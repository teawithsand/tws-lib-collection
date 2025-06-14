import type { LockAdapter, RwLockAdapter } from "./lock.js"

/**
 * A concrete implementation of RwLockAdapter that uses queue-based mechanisms
 * to manage read and write lock requests. Supports multiple concurrent readers
 * but exclusive write access.
 */
export class QueueRwLockAdapter implements RwLockAdapter {
	private activeReaders = 0
	private hasWriter = false
	private readonly readWaitQueue: Array<() => void> = []
	private readonly writeWaitQueue: Array<() => void> = []

	public readonly readLock: LockAdapter = {
		lock: async (): Promise<void> => {
			// If no writer is active and no writers are waiting, grant read access immediately
			if (!this.hasWriter && this.writeWaitQueue.length === 0) {
				this.activeReaders++
				return
			}

			// Otherwise, wait in the read queue
			return new Promise<void>((resolve) => {
				this.readWaitQueue.push(resolve)
			})
		},

		unlock: async (): Promise<void> => {
			if (this.activeReaders <= 0) {
				throw new Error(
					"Cannot unlock read lock when no readers are active",
				)
			}

			this.activeReaders--

			// If this was the last reader, check if there are waiting writers
			if (this.activeReaders === 0) {
				this.processNextWriter()
			}
		},
	}

	public readonly writeLock: LockAdapter = {
		lock: async (): Promise<void> => {
			if (this.activeReaders === 0 && !this.hasWriter) {
				this.hasWriter = true
				return
			}

			return new Promise<void>((resolve) => {
				this.writeWaitQueue.push(resolve)
			})
		},

		unlock: async (): Promise<void> => {
			if (!this.hasWriter) {
				throw new Error(
					"Cannot unlock write lock when no writer is active",
				)
			}

			this.hasWriter = false

			if (!this.processNextWriter()) {
				this.processWaitingReaders()
			}
		},
	}

	private readonly processNextWriter = (): boolean => {
		const nextWriter = this.writeWaitQueue.shift()
		if (nextWriter) {
			this.hasWriter = true
			nextWriter()
			return true
		}
		return false
	}

	private readonly processWaitingReaders = (): void => {
		// Grant access to all waiting readers
		while (this.readWaitQueue.length > 0) {
			const nextReader = this.readWaitQueue.shift()
			if (nextReader) {
				this.activeReaders++
				nextReader()
			}
		}
	}

	public readonly hasActiveReaders = (): boolean => {
		return this.activeReaders > 0
	}

	public readonly hasActiveWriter = (): boolean => {
		return this.hasWriter
	}

	public readonly getActiveReaderCount = (): number => {
		return this.activeReaders
	}

	public readonly getReadWaiterCount = (): number => {
		return this.readWaitQueue.length
	}

	public readonly getWriteWaiterCount = (): number => {
		return this.writeWaitQueue.length
	}
}
