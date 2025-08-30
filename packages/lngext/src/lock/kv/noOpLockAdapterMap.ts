import { NoOpLockAdapter, NoOpRwLockAdapter } from "../noOpLockAdapter"
import type { LockAdapterMap, RwLockAdapterMap } from "./lockAdapterMap"

/**
 * A no-op implementation of LockAdapterMap that provides the same NoOpLockAdapter
 * instance for all keys. Performs no actual locking.
 * Useful for testing or scenarios where locking is not required.
 */
export class NoOpLockAdapterMap implements LockAdapterMap {
	private readonly lockAdapter = new NoOpLockAdapter()

	public readonly getLock = (): NoOpLockAdapter => {
		return this.lockAdapter
	}
}

/**
 * A no-op implementation of RwLockAdapterMap that provides the same NoOpRwLockAdapter
 * instance for all keys. Performs no actual locking.
 * Useful for testing or scenarios where locking is not required.
 */
export class NoOpRwLockAdapterMap implements RwLockAdapterMap {
	private readonly rwLockAdapter = new NoOpRwLockAdapter()

	public readonly getLock = (): NoOpRwLockAdapter => {
		return this.rwLockAdapter
	}
}
