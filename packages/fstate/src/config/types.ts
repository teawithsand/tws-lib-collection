import { Lock } from "@teawithsand/lngext"
import { SerializerReverse } from "@teawithsand/reserd"
import { Atom } from "jotai"
import { Loadable } from "../jotai"
import { JotaiStore } from "../libs"
import { ConfigStorage } from "./storage/storage"

/**
 * Configuration specification for a single config field
 */
export interface ConfigFieldSpec<T> {
	/**
	 * Default value for this field
	 */
	readonly defaultValue: T

	/**
	 * Serializer for converting values to/from storage
	 */
	readonly serializer: SerializerReverse<T, unknown>

	/**
	 * Storage key for this field. If not provided, will use the field name.
	 */
	readonly storageKey?: string
}

/**
 * Configuration specification mapping field names to their specs
 */
export type Config<T extends Record<string, unknown>> = {
	readonly [K in keyof T]: ConfigFieldSpec<T[K]>
}

/**
 * Consistent config atoms that resolve to Promise<T> when values are loaded
 */
export type ConsistentConfigAtoms<T extends Record<string, unknown>> = {
	readonly [K in keyof T]: Atom<Promise<T[K]>>
}

/**
 * Loadable wrapper for consistent config atoms
 */
export type ConsistentConfigLoadableAtoms<T extends Record<string, unknown>> = {
	readonly [K in keyof T]: Atom<Loadable<T[K]>>
}

/**
 * Eventually consistent config atoms that may fallback to defaults
 */
export type EventuallyConsistentConfigAtoms<T extends Record<string, unknown>> =
	{
		readonly [K in keyof T]: Atom<T[K]>
	}

/**
 * Config mutator function type for atomic updates
 */
export type ConfigMutator<T extends Record<string, unknown>> = (
	current: Readonly<T>,
) => Partial<T>

/**
 * Base interface for config management
 */
export interface BaseConfig<T extends Record<string, unknown>> {
	/**
	 * Consistent config atoms that resolve to Promise<T>
	 */
	readonly consistentConfig: ConsistentConfigAtoms<T>

	/**
	 * Loadable versions of consistent config atoms
	 */
	readonly consistentConfigLoadable: ConsistentConfigLoadableAtoms<T>

	/**
	 * Eventually consistent config atoms with fallback to defaults
	 */
	readonly eventuallyConsistentConfig: EventuallyConsistentConfigAtoms<T>

	/**
	 * Atomically update multiple config fields
	 * @param mutator Function that receives current config and returns partial updates
	 * @returns Promise that resolves when all updates are complete
	 */
	readonly updateConfig: (mutator: ConfigMutator<T>) => Promise<void>

	/**
	 * Update a single config field
	 * @param key Field key
	 * @param value New value
	 * @returns Promise that resolves when update is complete
	 */
	readonly setField: <K extends keyof T>(key: K, value: T[K]) => Promise<void>

	/**
	 * Get current value of a field (may be default if not loaded)
	 * @param key Field key
	 * @returns Current value or default
	 */
	readonly getField: <K extends keyof T>(key: K) => T[K]

	/**
	 * Load a field from storage
	 * @param key Field key
	 * @returns Promise resolving to the loaded value
	 */
	readonly loadField: <K extends keyof T>(key: K) => Promise<T[K]>

	/**
	 * Check if a field has been loaded from storage
	 * @param key Field key
	 * @returns True if field has been loaded
	 */
	readonly isFieldLoaded: <K extends keyof T>(key: K) => boolean

	/**
	 * Load all fields from storage
	 * @returns Promise resolving to the complete loaded configuration
	 */
	readonly loadAllFields: () => Promise<T>

	/**
	 * Assert that all fields in the config specification have been set/configured
	 * @param keys Object with same keys as T but with undefined/null values
	 * @throws Error if not all fields are configured or if extra fields are present
	 */
	readonly assertFieldsConfigured: (
		keys: Partial<{
			[K in keyof T]: undefined | null
		}>,
	) => void
}

/**
 * Options for creating a config instance
 */
export interface ConfigOptions<T extends Record<string, unknown>> {
	/**
	 * Configuration specification
	 */
	readonly spec: Config<T>

	/**
	 * Storage backend
	 */
	readonly storage: ConfigStorage

	/**
	 * Jotai store for atom management
	 */
	readonly store: JotaiStore

	/**
	 * Lock for protecting concurrent updates
	 */
	readonly lock: Lock

	/**
	 * Key prefix for storage keys (optional)
	 */
	readonly keyPrefix?: string
}
