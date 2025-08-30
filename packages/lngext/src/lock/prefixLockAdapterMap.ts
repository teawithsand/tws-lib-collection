import type { LockAdapterMap, RwLockAdapterMap } from "./kv/lockAdapterMap"
import type { LockAdapter, RwLockAdapter } from "./lock"

/**
 * Wrapper implementation of LockAdapterMap that adds a prefix to all keys
 * before forwarding them to the wrapped map. Useful for namespacing or
 * creating isolated lock scopes.
 */
export class PrefixLockAdapterMap implements LockAdapterMap {
	constructor(
		private readonly wrappedMap: LockAdapterMap,
		private readonly prefix: string,
	) {}

	/**
	 * Gets a lock adapter by adding the prefix to the key and delegating to the wrapped map.
	 * @param key String identifier for the lock
	 * @returns LockAdapter instance from the wrapped map using the prefixed key
	 */
	public readonly getLock = (key: string): LockAdapter => {
		const prefixedKey = this.prefix + key
		return this.wrappedMap.getLock(prefixedKey)
	}
}

/**
 * Wrapper implementation of RwLockAdapterMap that adds a prefix to all keys
 * before forwarding them to the wrapped map. Useful for namespacing or
 * creating isolated read-write lock scopes.
 */
export class PrefixRwLockAdapterMap implements RwLockAdapterMap {
	constructor(
		private readonly wrappedMap: RwLockAdapterMap,
		private readonly prefix: string,
	) {}

	/**
	 * Gets a read-write lock adapter by adding the prefix to the key and delegating to the wrapped map.
	 * @param key String identifier for the lock
	 * @returns RwLockAdapter instance from the wrapped map using the prefixed key
	 */
	public readonly getLock = (key: string): RwLockAdapter => {
		const prefixedKey = this.prefix + key
		return this.wrappedMap.getLock(prefixedKey)
	}
}
