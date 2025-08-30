import {
	latePromise,
	LockAdapter,
	LockAlreadyHeldError,
	ReadLockNotHeldError,
	RwLockAdapter,
	WriteLockNotHeldError,
} from "@teawithsand/lngext"
import { WebApiUnsupportedError } from ".."

/**
 * Web Locks API based implementation of RwLockAdapter.
 * Uses the browser's native Web Locks API for cross-tab/cross-worker synchronization.
 * Implements a reader-writer lock pattern using shared and exclusive lock modes on a single lock.
 *
 * Note: This requires a browser environment with Web Locks API support.
 * Falls back to error if Web Locks API is not available.
 */
export class WebRwLockAdapter implements RwLockAdapter {
	private readonly lockName: string
	public readonly readLock: LockAdapter
	public readonly writeLock: LockAdapter

	/**
	 * Creates a new WebRwLockAdapter instance.
	 * @param lockName Name for the lock. Both read and write operations will use this same lock name.
	 */
	constructor(lockName: string) {
		this.lockName = lockName
		this.ensureWebLocksSupport()

		this.readLock = new WebSharedLockAdapter(this.lockName)
		this.writeLock = new WebExclusiveLockAdapter(this.lockName)
	}

	private readonly ensureWebLocksSupport = (): void => {
		if (
			typeof navigator !== "object" ||
			navigator === null ||
			!("locks" in navigator)
		) {
			throw new WebApiUnsupportedError(
				"Web Locks API is not supported in this environment. " +
					"Web Locks are only available in secure contexts (HTTPS) and supported browsers.",
			)
		}
	}
}

/**
 * Web Locks API based shared lock implementation.
 * Uses shared mode to allow multiple concurrent readers.
 */
class WebSharedLockAdapter implements LockAdapter {
	private readonly lockName: string
	private currentLockController: AbortController | null = null
	private lockHeldResolver: (() => void) | null = null

	constructor(lockName: string) {
		this.lockName = lockName
	}

	public readonly lock = async (): Promise<void> => {
		if (this.currentLockController) {
			throw new LockAlreadyHeldError(
				"Shared lock is already held by this adapter instance",
			)
		}

		this.currentLockController = new AbortController()
		const signal = this.currentLockController.signal

		const [lockAcquiredPromise, resolveLockAcquired, rejectLockAcquired] =
			latePromise<void>()
		const [lockHeldPromise, resolveLockHeld] = latePromise<void>()

		this.lockHeldResolver = resolveLockHeld

		navigator.locks
			.request(this.lockName, { mode: "shared", signal }, async () => {
				resolveLockAcquired()
				return lockHeldPromise
			})
			.catch((error) => {
				if (signal.aborted) {
					return
				}
				rejectLockAcquired(error)
			})

		return lockAcquiredPromise
	}

	public readonly unlock = async (): Promise<void> => {
		if (!this.currentLockController) {
			throw new ReadLockNotHeldError(
				"Cannot unlock read lock when no readers are active",
			)
		}

		if (this.lockHeldResolver) {
			this.lockHeldResolver()
			this.lockHeldResolver = null
		}

		this.currentLockController = null
	}
}

/**
 * Web Locks API based exclusive lock implementation.
 * Uses exclusive mode to ensure only one writer at a time.
 */
class WebExclusiveLockAdapter implements LockAdapter {
	private readonly lockName: string
	private currentLockController: AbortController | null = null
	private lockHeldResolver: (() => void) | null = null

	constructor(lockName: string) {
		this.lockName = lockName
	}

	public readonly lock = async (): Promise<void> => {
		if (this.currentLockController) {
			throw new LockAlreadyHeldError(
				"Exclusive lock is already held by this adapter instance",
			)
		}

		this.currentLockController = new AbortController()
		const signal = this.currentLockController.signal

		const [lockAcquiredPromise, resolveLockAcquired, rejectLockAcquired] =
			latePromise<void>()
		const [lockHeldPromise, resolveLockHeld] = latePromise<void>()

		this.lockHeldResolver = resolveLockHeld

		navigator.locks
			.request(this.lockName, { mode: "exclusive", signal }, async () => {
				resolveLockAcquired()
				return lockHeldPromise
			})
			.catch((error) => {
				if (signal.aborted) {
					return
				}
				rejectLockAcquired(error)
			})

		return lockAcquiredPromise
	}

	public readonly unlock = async (): Promise<void> => {
		if (!this.currentLockController) {
			throw new WriteLockNotHeldError(
				"Cannot unlock write lock when no writer is active",
			)
		}

		if (this.lockHeldResolver) {
			this.lockHeldResolver()
			this.lockHeldResolver = null
		}

		this.currentLockController = null
	}
}
