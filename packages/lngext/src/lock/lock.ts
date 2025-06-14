/**
 * Base interface for lock adapters that provide basic lock/unlock functionality.
 * Represents a mutex-like synchronization primitive.
 */
export interface LockAdapter {
	/**
	 * Acquires the lock. If the lock is already held, this method should wait
	 * until the lock becomes available.
	 * @returns Promise that resolves when the lock is acquired
	 */
	readonly lock: () => Promise<void>

	/**
	 * Releases the lock, making it available for other consumers.
	 * @returns Promise that resolves when the lock is released
	 */
	readonly unlock: () => Promise<void>
}

/**
 * High-level lock interface that wraps a LockAdapter and provides
 * convenient methods for lock management.
 */
export interface Lock {
	/**
	 * Acquires the lock. If the lock is already held, this method should wait
	 * until the lock becomes available.
	 * @returns Promise that resolves when the lock is acquired
	 */
	readonly lock: () => Promise<void>

	/**
	 * Releases the lock, making it available for other consumers.
	 * @returns Promise that resolves when the lock is released
	 */
	readonly unlock: () => Promise<void>

	/**
	 * Executes a function within the scope of this lock.
	 * Automatically acquires the lock before execution and releases it after completion.
	 * @param fn Function to execute while holding the lock
	 * @returns Promise that resolves with the return value of the function
	 */
	readonly withLock: <T>(fn: () => Promise<T>) => Promise<T>
}

/**
 * Adapter interface for read-write locks that supports separate read and write operations.
 * Multiple readers can hold the lock simultaneously, but writers have exclusive access.
 */
export interface RwLockAdapter {
	/**
	 * Lock adapter for read operations.
	 * Multiple readers can acquire this lock simultaneously.
	 */
	readonly readLock: LockAdapter

	/**
	 * Lock adapter for write operations.
	 * Only one writer can acquire this lock at a time, and it's exclusive with readers.
	 */
	readonly writeLock: LockAdapter
}

/**
 * High-level read-write lock interface that wraps an RwLockAdapter.
 * Provides convenient methods for both read and write lock management.
 */
export interface RwLock {
	/**
	 * Lock adapter for read operations.
	 * Multiple readers can acquire this lock simultaneously.
	 */
	readonly readLock: LockAdapter

	/**
	 * Lock adapter for write operations.
	 * Only one writer can acquire this lock at a time, and it's exclusive with readers.
	 */
	readonly writeLock: LockAdapter

	/**
	 * Executes a function within the scope of a read lock.
	 * Automatically acquires the read lock before execution and releases it after completion.
	 * @param fn Function to execute while holding the read lock
	 * @returns Promise that resolves with the return value of the function
	 */
	readonly withReadLock: <T>(fn: () => Promise<T>) => Promise<T>

	/**
	 * Executes a function within the scope of a write lock.
	 * Automatically acquires the write lock before execution and releases it after completion.
	 * @param fn Function to execute while holding the write lock
	 * @returns Promise that resolves with the return value of the function
	 */
	readonly withWriteLock: <T>(fn: () => Promise<T>) => Promise<T>
}
