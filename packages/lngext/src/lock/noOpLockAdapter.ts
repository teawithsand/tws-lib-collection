import type { LockAdapter, RwLockAdapter } from "../lock"

/**
 * A no-op implementation of LockAdapter that performs no actual locking.
 * All operations complete immediately without any synchronization.
 * Useful for testing or scenarios where locking is not required.
 */
export class NoOpLockAdapter implements LockAdapter {
	public readonly lock = async (): Promise<void> => {
		// No-op: immediately resolve
	}

	public readonly unlock = async (): Promise<void> => {
		// No-op: immediately resolve
	}
}

/**
 * A no-op implementation of RwLockAdapter that performs no actual locking.
 * All operations complete immediately without any synchronization.
 * Useful for testing or scenarios where locking is not required.
 */
export class NoOpRwLockAdapter implements RwLockAdapter {
	public readonly readLock: LockAdapter = new NoOpLockAdapter()
	public readonly writeLock: LockAdapter = new NoOpLockAdapter()
}
