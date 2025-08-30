import type { LockAdapter, RwLockAdapter } from "../lock"
import type { LockAdapterMap, RwLockAdapterMap } from "./lockAdapterMap"

/**
 * Simple implementation of LockAdapterMap that always returns the same lock adapter
 * regardless of the key. Useful when you want all operations to be synchronized
 * through a single lock.
 */
export class SingleLockAdapterMap implements LockAdapterMap {
	constructor(private readonly lockAdapter: LockAdapter) {}

	/**
	 * Always returns the same lock adapter instance regardless of the key.
	 * @param _key String identifier for the lock (ignored)
	 * @returns The single LockAdapter instance
	 */
	public readonly getLock = (_key: string): LockAdapter => {
		return this.lockAdapter
	}
}

/**
 * Simple implementation of RwLockAdapterMap that always returns the same read-write lock adapter
 * regardless of the key. Useful when you want all operations to be synchronized
 * through a single read-write lock.
 */
export class SingleRwLockAdapterMap implements RwLockAdapterMap {
	constructor(private readonly lockAdapter: RwLockAdapter) {}

	/**
	 * Always returns the same read-write lock adapter instance regardless of the key.
	 * @param _key String identifier for the lock (ignored)
	 * @returns The single RwLockAdapter instance
	 */
	public readonly getLock = (_key: string): RwLockAdapter => {
		return this.lockAdapter
	}
}
