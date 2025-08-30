import { BaseError, Errors } from "../../error"
import type { LockAdapter, RwLockAdapter } from "../lock"
import type { LockAdapterMap, RwLockAdapterMap } from "./lockAdapterMap"

export const LockAdapterMapKeyNotFoundError = Errors.makeErrorType(
	"LockAdapterMapKeyNotFoundError",
	BaseError,
)

/**
 * Implementation of LockAdapterMap that uses a predefined map of keys to lock adapters.
 * Throws LockAdapterMapKeyNotFoundError if the requested key is not found in the map.
 */
export class MapLockAdapterMap implements LockAdapterMap {
	constructor(private readonly lockMap: ReadonlyMap<string, LockAdapter>) {}

	/**
	 * Creates a MapLockAdapterMap by generating lock adapters for each key using the provided factory function.
	 * @param lockAdapterFactory Function that creates a new LockAdapter instance
	 * @param keys Array of keys for which to create lock adapters
	 * @returns A new MapLockAdapterMap instance with lock adapters for all specified keys
	 */
	public static readonly create = (
		lockAdapterFactory: () => LockAdapter,
		keys: readonly string[],
	): MapLockAdapterMap => {
		const lockMap = new Map<string, LockAdapter>()
		for (const key of keys) {
			lockMap.set(key, lockAdapterFactory())
		}
		return new MapLockAdapterMap(lockMap)
	}

	/**
	 * Gets the LockAdapter for the specified key from the predefined map.
	 * @param key String identifier for the lock
	 * @returns LockAdapter instance for the given key
	 * @throws LockAdapterMapKeyNotFoundError if the key is not found in the map
	 */
	public readonly getLock = (key: string): LockAdapter => {
		const lockAdapter = this.lockMap.get(key)
		if (lockAdapter === undefined) {
			throw new LockAdapterMapKeyNotFoundError(
				`Lock adapter not found for key: ${key}`,
			)
		}
		return lockAdapter
	}
}

/**
 * Implementation of RwLockAdapterMap that uses a predefined map of keys to read-write lock adapters.
 * Throws LockAdapterMapKeyNotFoundError if the requested key is not found in the map.
 */
export class MapRwLockAdapterMap implements RwLockAdapterMap {
	constructor(private readonly lockMap: ReadonlyMap<string, RwLockAdapter>) {}

	/**
	 * Creates a MapRwLockAdapterMap by generating read-write lock adapters for each key using the provided factory function.
	 * @param rwLockAdapterFactory Function that creates a new RwLockAdapter instance
	 * @param keys Array of keys for which to create read-write lock adapters
	 * @returns A new MapRwLockAdapterMap instance with read-write lock adapters for all specified keys
	 */
	public static readonly create = (
		rwLockAdapterFactory: () => RwLockAdapter,
		keys: readonly string[],
	): MapRwLockAdapterMap => {
		const lockMap = new Map<string, RwLockAdapter>()
		for (const key of keys) {
			lockMap.set(key, rwLockAdapterFactory())
		}
		return new MapRwLockAdapterMap(lockMap)
	}

	/**
	 * Gets the RwLockAdapter for the specified key from the predefined map.
	 * @param key String identifier for the lock
	 * @returns RwLockAdapter instance for the given key
	 * @throws LockAdapterMapKeyNotFoundError if the key is not found in the map
	 */
	public readonly getLock = (key: string): RwLockAdapter => {
		const lockAdapter = this.lockMap.get(key)
		if (lockAdapter === undefined) {
			throw new LockAdapterMapKeyNotFoundError(
				`Read-write lock adapter not found for key: ${key}`,
			)
		}
		return lockAdapter
	}
}
