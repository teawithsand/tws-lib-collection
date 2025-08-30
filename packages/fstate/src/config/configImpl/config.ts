import { RwLockAdapter, RwLockAdapterMap } from "@teawithsand/lngext"
import { JotaiStore } from "../../libs"
import { ConfigFieldMismatchError, ConfigUnknownFieldError } from "../errors"
import { ConfigStorage } from "../storage"
import {
	Config,
	ConfigMutator,
	ConfigSpec,
	ConfigStorageCacheMode,
	ConsistentConfigAtoms,
	ConsistentConfigLoadableAtoms,
	EventuallyConsistentConfigAtoms,
} from "../types"
import { ConfigAtomsHelper } from "./configAtomsImpl"
import { ConfigLocksHelper } from "./configLocksHelper"
import { ConfigStorageHelper } from "./configStorageHelper"

export class ConfigImpl<T extends Record<string, unknown>>
	implements Config<T>
{
	private readonly storageHelper
	private readonly atomsHelper
	private readonly locksHelper
	private readonly spec

	public readonly consistentAtoms: ConsistentConfigAtoms<T>
	public readonly consistentLoadableAtoms: ConsistentConfigLoadableAtoms<T>
	public readonly eventuallyConsistentAtoms: EventuallyConsistentConfigAtoms<T>

	constructor({
		store,
		spec,
		storage,
		rwLockAdapterMap,
		globalLock,
		storageKeyTransform,
		lockKeyTransform,
		cacheMode,
	}: {
		readonly store: JotaiStore
		readonly spec: ConfigSpec<T>
		readonly storage: ConfigStorage
		readonly rwLockAdapterMap: RwLockAdapterMap
		readonly globalLock: RwLockAdapter
		readonly storageKeyTransform?: (key: keyof T) => keyof T
		readonly lockKeyTransform?: (key: keyof T) => keyof T
		readonly cacheMode?: ConfigStorageCacheMode
	}) {
		this.storageHelper = new ConfigStorageHelper({
			spec,
			storage,
			cacheMode: cacheMode ?? ConfigStorageCacheMode.DISABLED,
			storageKeyTransform: storageKeyTransform ?? ((x) => x),
		})

		this.spec = spec

		this.atomsHelper = new ConfigAtomsHelper({
			spec,
			store,
		})

		this.locksHelper = new ConfigLocksHelper({
			rwLockAdapterMap,
			globalLock,
			...(lockKeyTransform && { lockKeyTransform }),
		})

		this.consistentAtoms = this.atomsHelper.consistentAtoms
		this.consistentLoadableAtoms = this.atomsHelper.loadableConsistentAtoms
		this.eventuallyConsistentAtoms =
			this.atomsHelper.eventuallyConsistentAtoms
	}

	public readonly updateConfig = async (
		mutator: ConfigMutator<T>,
	): Promise<void> => {
		await this.locksHelper.withGlobalWriteLock(async () => {
			const fields = await this.loadAllFieldsNoLock()

			const newFields = mutator(fields)

			for (const k in fields) {
				if (newFields[k] !== fields[k]) {
					await this.storageHelper.write(
						k,
						newFields[k] as T[typeof k],
					)
					this.atomsHelper.loadValue(k, this.storageHelper.read(k))
				}
			}
		})
	}

	public readonly setField = async <K extends keyof T>(
		key: K,
		value: T[K],
	): Promise<void> => {
		return await this.locksHelper.withWriteLock(key, async () => {
			await this.storageHelper.write(key, value)
			this.atomsHelper.loadValue(key, this.storageHelper.read(key))
		})
	}

	public readonly getField = async <K extends keyof T>(
		key: K,
	): Promise<T[K]> => {
		return await this.storageHelper.read(key)
	}

	public readonly loadAllFields = async (): Promise<T> => {
		const res: Partial<T> = {} as Partial<T>
		for (const key in this.spec) {
			await this.locksHelper.withReadLock(key, async () => {
				const value = await this.storageHelper.read(key)
				this.atomsHelper.loadValue(key, Promise.resolve(value))
				res[key] = value
			})
		}

		return res as T
	}

	public readonly assertFieldsConfigured = (
		keys: Partial<{ [K in keyof T]: undefined | null }>,
	): void => {
		const specKeys = Object.keys(this.spec) as (keyof T)[]
		const providedKeys = Object.keys(keys) as (keyof T)[]

		const extraKeys = providedKeys.filter((key) => !(key in this.spec))
		if (extraKeys.length > 0) {
			throw new ConfigUnknownFieldError(
				`Extra fields not in specification: ${extraKeys.join(", ")}`,
			)
		}

		const missingKeys = specKeys.filter((key) => !(key in keys))
		if (missingKeys.length > 0) {
			throw new ConfigFieldMismatchError(
				`Missing required fields from specification: ${missingKeys.join(", ")}`,
			)
		}
	}

	private readonly loadAllFieldsNoLock = async () => {
		const res: Partial<T> = {} as Partial<T>
		for (const key in this.spec) {
			const value = await this.storageHelper.read(key)
			this.atomsHelper.loadValue(key, Promise.resolve(value))
			res[key] = value
		}

		return res as T
	}
}
