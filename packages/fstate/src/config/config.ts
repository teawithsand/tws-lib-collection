import { Lock } from "@teawithsand/lngext"
import { atom, Atom, WritableAtom } from "jotai"
import { loadable } from "jotai/utils"
import { Loadable } from "../jotai"
import { JotaiStore } from "../libs"
import { ConfigBuilder } from "./builder"
import { ConfigStorage } from "./storage/storage"
import {
	BaseConfig,
	Config,
	ConfigMutator,
	ConfigOptions,
	ConsistentConfigAtoms,
	ConsistentConfigLoadableAtoms,
	EventuallyConsistentConfigAtoms,
} from "./types"

/**
 * Implementation of config management with consistent and eventually consistent access patterns
 */
export class ConfigImpl<T extends Record<string, unknown>>
	implements BaseConfig<T>
{
	private readonly spec: Config<T>
	private readonly storage: ConfigStorage
	private readonly store: JotaiStore
	private readonly lock: Lock
	private readonly keyPrefix: string

	// Internal state tracking
	private readonly loadedFields = new Set<keyof T>()
	private readonly fieldAtoms = new Map<
		keyof T,
		WritableAtom<T[keyof T], [T[keyof T]], void>
	>()
	private readonly promiseAtoms = new Map<
		keyof T,
		Atom<Promise<T[keyof T]>>
	>()

	public readonly consistentConfig: ConsistentConfigAtoms<T>
	public readonly consistentConfigLoadable: ConsistentConfigLoadableAtoms<T>
	public readonly eventuallyConsistentConfig: EventuallyConsistentConfigAtoms<T>

	constructor({
		spec,
		storage,
		store,
		lock,
		keyPrefix = "",
	}: ConfigOptions<T>) {
		this.spec = spec
		this.storage = storage
		this.store = store
		this.lock = lock
		this.keyPrefix = keyPrefix

		// Initialize atoms for each field
		this.initializeAtoms()

		// Create the public atom maps
		this.consistentConfig = this.createConsistentConfigAtoms()
		this.consistentConfigLoadable =
			this.createConsistentConfigLoadableAtoms()
		this.eventuallyConsistentConfig =
			this.createEventuallyConsistentConfigAtoms()
	}

	/**
	 * Initialize internal atoms for each config field
	 */
	private readonly initializeAtoms = (): void => {
		for (const key of Object.keys(this.spec) as Array<keyof T>) {
			const defaultValue = this.spec[key]!.defaultValue

			// Create atom for eventually consistent access
			const fieldAtom = atom(defaultValue)
			this.fieldAtoms.set(key, fieldAtom)

			// Create promise atom for consistent access
			const promiseAtom = atom(async (): Promise<T[keyof T]> => {
				return await this.loadFieldInternal(key)
			})
			this.promiseAtoms.set(key, promiseAtom)
		}
	}

	/**
	 * Create consistent config atoms
	 */
	private readonly createConsistentConfigAtoms =
		(): ConsistentConfigAtoms<T> => {
			const result = {} as {
				-readonly [K in keyof T]: Atom<Promise<T[K]>>
			}
			for (const key of Object.keys(this.spec) as Array<keyof T>) {
				const promiseAtom = this.promiseAtoms.get(key)!
				result[key] = promiseAtom as Atom<Promise<T[keyof T]>>
			}
			return result as ConsistentConfigAtoms<T>
		}

	/**
	 * Create loadable versions of consistent config atoms
	 */
	private readonly createConsistentConfigLoadableAtoms =
		(): ConsistentConfigLoadableAtoms<T> => {
			const result = {} as {
				-readonly [K in keyof T]: Atom<Loadable<T[K]>>
			}
			for (const key of Object.keys(this.spec) as Array<keyof T>) {
				const promiseAtom = this.promiseAtoms.get(key)!
				result[key] = loadable(promiseAtom) as Atom<
					Loadable<T[keyof T]>
				>
			}
			return result as ConsistentConfigLoadableAtoms<T>
		}

	/**
	 * Create eventually consistent config atoms
	 */
	private readonly createEventuallyConsistentConfigAtoms =
		(): EventuallyConsistentConfigAtoms<T> => {
			const result = {} as { -readonly [K in keyof T]: Atom<T[K]> }
			for (const key of Object.keys(this.spec) as Array<keyof T>) {
				const fieldAtom = this.fieldAtoms.get(key)!
				result[key] = fieldAtom as Atom<T[keyof T]>
			}
			return result as EventuallyConsistentConfigAtoms<T>
		}

	/**
	 * Get storage key for a field
	 */
	private readonly getStorageKey = (key: keyof T): string => {
		const fieldSpec = this.spec[key]!
		const baseKey = fieldSpec.storageKey ?? String(key)
		return this.keyPrefix ? `${this.keyPrefix}:${baseKey}` : baseKey
	}

	/**
	 * Internal method to load a field from storage
	 */
	private readonly loadFieldInternal = async <K extends keyof T>(
		key: K,
	): Promise<T[K]> => {
		const fieldSpec = this.spec[key]!
		const storageKey = this.getStorageKey(key)

		try {
			const stored = await this.storage.get(storageKey)
			if (stored === null) {
				// No value in storage, use default
				return fieldSpec.defaultValue
			}

			const deserialized = fieldSpec.serializer.deserialize(stored)
			this.loadedFields.add(key)

			// Update the eventually consistent atom using the store
			const fieldAtom = this.fieldAtoms.get(key)
			if (fieldAtom) {
				this.store.set(fieldAtom, deserialized)
			}

			return deserialized
		} catch (error) {
			throw new Error(
				`Failed to load config field ${String(key)}: ${error instanceof Error ? error.message : String(error)}`,
			)
		}
	}

	/**
	 * Store a field value to storage
	 */
	private readonly storeFieldInternal = async <K extends keyof T>(
		key: K,
		value: T[K],
	): Promise<void> => {
		const fieldSpec = this.spec[key]!
		const storageKey = this.getStorageKey(key)

		try {
			const serialized = fieldSpec.serializer.serialize(value)
			await this.storage.set(storageKey, serialized)
			this.loadedFields.add(key)
		} catch (error) {
			throw new Error(
				`Failed to store config field ${String(key)}: ${error}`,
			)
		}
	}

	public readonly updateConfig = async (
		mutator: ConfigMutator<T>,
	): Promise<void> => {
		await this.lock.withLock(async () => {
			// Load current values
			const currentConfig = {} as T
			for (const key of Object.keys(this.spec) as Array<keyof T>) {
				currentConfig[key] = await this.loadFieldInternal(key)
			}

			// Apply mutations
			const updates = mutator(currentConfig)

			// Store all updates
			const storePromises: Promise<void>[] = []
			for (const [key, value] of Object.entries(updates) as Array<
				[keyof T, T[keyof T]]
			>) {
				if (value !== undefined) {
					storePromises.push(this.storeFieldInternal(key, value))
					// Update the eventually consistent atom
					const fieldAtom = this.fieldAtoms.get(key)
					if (fieldAtom) {
						this.store.set(fieldAtom, value)
					}
				}
			}

			await Promise.all(storePromises)
		})
	}

	public readonly setField = async <K extends keyof T>(
		key: K,
		value: T[K],
	): Promise<void> => {
		await this.lock.withLock(async () => {
			await this.storeFieldInternal(key, value)
			// Update the eventually consistent atom
			const fieldAtom = this.fieldAtoms.get(key)
			if (fieldAtom) {
				this.store.set(fieldAtom, value)
			}
		})
	}

	public readonly getField = <K extends keyof T>(key: K): T[K] => {
		const fieldAtom = this.fieldAtoms.get(key)
		if (!fieldAtom) {
			throw new Error(`Unknown config field: ${String(key)}`)
		}

		return this.store.get(fieldAtom) as T[K]
	}

	public readonly loadField = async <K extends keyof T>(
		key: K,
	): Promise<T[K]> => {
		return await this.loadFieldInternal(key)
	}

	public readonly isFieldLoaded = <K extends keyof T>(key: K): boolean => {
		return this.loadedFields.has(key)
	}

	public readonly loadAllFields = async (): Promise<T> => {
		const result = {} as T

		for (const key of Object.keys(this.spec) as Array<keyof T>) {
			const value = await this.loadFieldInternal(key)
			result[key] = value
		}

		return result
	}

	/**
	 * Assert that all fields in the config specification have been set/configured
	 * @param keys Object with same keys as T but with undefined/null values
	 * @throws Error if not all fields are configured or if extra fields are present
	 */
	public readonly assertFieldsConfigured = (
		keys: Partial<{ [K in keyof T]: undefined | null }>,
	): void => {
		const specifiedKeys = Object.keys(keys) as Array<keyof T>
		const allSpecKeys = Object.keys(this.spec) as Array<keyof T>

		const missingKeys = allSpecKeys.filter(
			(key) => !specifiedKeys.includes(key),
		)
		const extraKeys = specifiedKeys.filter(
			(key) => !allSpecKeys.includes(key),
		)

		if (missingKeys.length > 0 || extraKeys.length > 0) {
			const errors: string[] = []

			if (missingKeys.length > 0) {
				errors.push(`Missing fields: ${missingKeys.join(", ")}`)
			}

			if (extraKeys.length > 0) {
				errors.push(`Extra fields: ${extraKeys.join(", ")}`)
			}

			throw new Error(
				`Field configuration mismatch: ${errors.join("; ")}`,
			)
		}
	}

	/**
	 * Create a config builder for fluent configuration
	 */
	public static readonly builder = <T extends Record<string, unknown>>() => {
		return new ConfigBuilder<T>()
	}
}
