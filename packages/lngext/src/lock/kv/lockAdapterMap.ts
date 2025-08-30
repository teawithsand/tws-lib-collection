import type { LockAdapter, RwLockAdapter } from "../lock"

/**
 * Interface for managing multiple LockAdapter instances keyed by string identifiers.
 * Allows creation and retrieval of locks for different resources or operations.
 */
export interface LockAdapterMap {
	/**
	 * Gets or creates a LockAdapter for the specified key.
	 * Multiple calls with the same key should return the same lock instance.
	 * @param key String identifier for the lock
	 * @returns LockAdapter instance for the given key
	 */
	readonly getLock: (key: string) => LockAdapter
}

/**
 * Interface for managing multiple RwLockAdapter instances keyed by string identifiers.
 * Allows creation and retrieval of read-write locks for different resources or operations.
 */
export interface RwLockAdapterMap {
	/**
	 * Gets or creates an RwLockAdapter for the specified key.
	 * Multiple calls with the same key should return the same lock instance.
	 * @param key String identifier for the lock
	 * @returns RwLockAdapter instance for the given key
	 */
	readonly getLock: (key: string) => RwLockAdapter
}
