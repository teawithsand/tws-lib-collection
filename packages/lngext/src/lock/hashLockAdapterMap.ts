import type { LockAdapterMap, RwLockAdapterMap } from "./kv/lockAdapterMap"
import type { LockAdapter, RwLockAdapter } from "./lock"

/**
 * Simple hash function implementation similar to Java's String.hashCode()
 * @param str Input string to hash
 * @returns Hash value as number
 */
const simpleHash = (str: string): number => {
	let hash = 0
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i)
		hash = (hash << 5) - hash + char
		hash = hash & hash // Convert to 32-bit integer
	}
	return Math.abs(hash)
}

/**
 * Implementation of LockAdapterMap that distributes locks across an array of lock adapters
 * using a hash function. Includes an optional prefix to make key distribution less predictable.
 */
export class HashLockAdapterMap implements LockAdapterMap {
	private readonly prefix: string

	constructor(
		private readonly lockAdapters: readonly LockAdapter[],
		prefix = "",
	) {
		if (lockAdapters.length === 0) {
			throw new Error("Lock adapters array cannot be empty")
		}
		this.prefix = prefix
	}

	/**
	 * Gets a lock adapter based on the hash of the prefixed key.
	 * @param key String identifier for the lock
	 * @returns LockAdapter instance selected by hash distribution
	 */
	public readonly getLock = (key: string): LockAdapter => {
		const prefixedKey = this.prefix + key
		const hash = simpleHash(prefixedKey)
		const index = hash % this.lockAdapters.length
		return this.lockAdapters[index]!
	}
}

/**
 * Implementation of RwLockAdapterMap that distributes locks across an array of read-write lock adapters
 * using a hash function. Includes an optional prefix to make key distribution less predictable.
 */
export class HashRwLockAdapterMap implements RwLockAdapterMap {
	private readonly prefix: string

	constructor(
		private readonly lockAdapters: readonly RwLockAdapter[],
		prefix = "",
	) {
		if (lockAdapters.length === 0) {
			throw new Error("Lock adapters array cannot be empty")
		}
		this.prefix = prefix
	}

	/**
	 * Gets a read-write lock adapter based on the hash of the prefixed key.
	 * @param key String identifier for the lock
	 * @returns RwLockAdapter instance selected by hash distribution
	 */
	public readonly getLock = (key: string): RwLockAdapter => {
		const prefixedKey = this.prefix + key
		const hash = simpleHash(prefixedKey)
		const index = hash % this.lockAdapters.length
		return this.lockAdapters[index]!
	}
}
