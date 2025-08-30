import {
	latePromise,
	LockAdapter,
	LockAlreadyHeldError,
	LockNotHeldError,
} from "@teawithsand/lngext"
import { WebApiUnsupportedError } from ".."

/**
 * Web Locks API based implementation of LockAdapter.
 * Uses the browser's native Web Locks API for cross-tab/cross-worker synchronization.
 *
 * Note: This requires a browser environment with Web Locks API support.
 * Falls back to error if Web Locks API is not available.
 */
export class WebLockAdapter implements LockAdapter {
	private readonly lockName: string
	private currentLockController: AbortController | null = null
	private lockHeldResolver: (() => void) | null = null

	/**
	 * Creates a new WebLockAdapter instance.
	 * @param lockName Unique name for the lock. Should be unique across the application.
	 */
	constructor(lockName: string) {
		this.lockName = lockName
		this.ensureWebLocksSupport()
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

	public readonly lock = async (): Promise<void> => {
		this.ensureWebLocksSupport()

		if (this.currentLockController) {
			throw new LockAlreadyHeldError(
				"Lock is already held by this adapter instance",
			)
		}

		this.currentLockController = new AbortController()
		const signal = this.currentLockController.signal

		const [lockAcquiredPromise, resolveLockAcquired, rejectLockAcquired] =
			latePromise<void>()
		const [lockHeldPromise, resolveLockHeld] = latePromise<void>()

		this.lockHeldResolver = resolveLockHeld

		navigator.locks
			.request(this.lockName, { signal }, async () => {
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
			throw new LockNotHeldError(
				"Cannot unlock a lock that is not currently held",
			)
		}

		if (this.lockHeldResolver) {
			this.lockHeldResolver()
			this.lockHeldResolver = null
		}

		this.currentLockController = null
	}

	/**
	 * Checks if this adapter instance currently holds the lock.
	 * @returns true if the lock is held by this instance
	 */
	public readonly isHeld = (): boolean => {
		return this.currentLockController !== null
	}
}
