import { ReadLockNotHeldError, WriteLockNotHeldError } from "./errors"
import type { LockAdapter, RwLockAdapter } from "./lock"

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
			if (!this.hasWriter && this.writeWaitQueue.length === 0) {
				this.activeReaders++
				return
			}

			return new Promise<void>((resolve) => {
				this.readWaitQueue.push(resolve)
			})
		},

		unlock: async (): Promise<void> => {
			if (this.activeReaders <= 0) {
				throw new ReadLockNotHeldError(
					"Cannot unlock read lock when no readers are active",
				)
			}

			this.activeReaders--

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
				throw new WriteLockNotHeldError(
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
