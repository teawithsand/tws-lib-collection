import type { LockAdapter } from "./lock.js"

/**
 * Implementation of LockAdapter that uses a queue-based mechanism
 * to manage waiting lock requests. Ensures fair ordering of lock acquisition.
 */
export class QueueLockAdapter implements LockAdapter {
	private isLocked = false
	private readonly waitQueue: Array<() => void> = []

	public readonly lock = async (): Promise<void> => {
		if (!this.isLocked) {
			this.isLocked = true
			return
		}

		return new Promise<void>((resolve) => {
			this.waitQueue.push(resolve)
		})
	}

	public readonly unlock = async (): Promise<void> => {
		if (!this.isLocked) {
			throw new Error("Cannot unlock a lock that is not currently held")
		}

		const nextWaiter = this.waitQueue.shift()
		if (nextWaiter) {
			nextWaiter()
		} else {
			this.isLocked = false
		}
	}

	public readonly isHeld = (): boolean => {
		return this.isLocked
	}

	public readonly getWaiterCount = (): number => {
		return this.waitQueue.length
	}
}
