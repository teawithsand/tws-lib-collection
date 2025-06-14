import type { Lock, LockAdapter } from "./lock.js"

/**
 * Implementation of Lock that wraps a LockAdapter and provides
 * convenient methods for lock management including the withLock helper.
 */
export class LockImpl implements Lock {
	constructor(private readonly adapter: LockAdapter) {}

	/**
	 * Acquires the lock. If the lock is already held, this method should wait
	 * until the lock becomes available.
	 * @returns Promise that resolves when the lock is acquired
	 */
	public readonly lock = async (): Promise<void> => {
		return this.adapter.lock()
	}

	/**
	 * Releases the lock, making it available for other consumers.
	 * @returns Promise that resolves when the lock is released
	 */
	public readonly unlock = async (): Promise<void> => {
		return this.adapter.unlock()
	}

	/**
	 * Executes a function within the scope of this lock.
	 * Automatically acquires the lock before execution and releases it after completion.
	 * @param fn Function to execute while holding the lock
	 * @returns Promise that resolves with the return value of the function
	 */
	public readonly withLock = async <T>(fn: () => Promise<T>): Promise<T> => {
		await this.lock()
		try {
			return await fn()
		} finally {
			await this.unlock()
		}
	}
}
