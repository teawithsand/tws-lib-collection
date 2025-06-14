import type { LockAdapter, RwLock, RwLockAdapter } from "./lock.js"

/**
 * Implementation of RwLock that wraps an RwLockAdapter and provides
 * convenient methods for both read and write lock management.
 */
export class RwLockImpl implements RwLock {
	constructor(private readonly adapter: RwLockAdapter) {}

	/**
	 * Lock adapter for read operations.
	 * Multiple readers can acquire this lock simultaneously.
	 */
	public readonly readLock: LockAdapter = this.adapter.readLock

	/**
	 * Lock adapter for write operations.
	 * Only one writer can acquire this lock at a time, and it's exclusive with readers.
	 */
	public readonly writeLock: LockAdapter = this.adapter.writeLock

	/**
	 * Executes a function within the scope of a read lock.
	 * Automatically acquires the read lock before execution and releases it after completion.
	 * @param fn Function to execute while holding the read lock
	 * @returns Promise that resolves with the return value of the function
	 */
	public readonly withReadLock = async <T>(
		fn: () => Promise<T>,
	): Promise<T> => {
		await this.readLock.lock()
		try {
			return await fn()
		} finally {
			await this.readLock.unlock()
		}
	}

	/**
	 * Executes a function within the scope of a write lock.
	 * Automatically acquires the write lock before execution and releases it after completion.
	 * @param fn Function to execute while holding the write lock
	 * @returns Promise that resolves with the return value of the function
	 */
	public readonly withWriteLock = async <T>(
		fn: () => Promise<T>,
	): Promise<T> => {
		await this.writeLock.lock()
		try {
			return await fn()
		} finally {
			await this.writeLock.unlock()
		}
	}
}
