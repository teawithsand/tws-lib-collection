export class MessageQueue<T> {
	private readonly queue: T[] = []
	private error: Error | null = null
	private readonly waitingPromises: Array<{
		resolve: (value: T | PromiseLike<T>) => void
		reject: (reason?: any) => void
	}> = []
	private readonly maxSize: number

	public constructor(maxSize: number = Infinity) {
		this.maxSize = maxSize
	}

	public readonly send = (message: T): void => {
		if (this.error) {
			throw new Error(
				"MessageQueue has an error set. Cannot send new messages.",
			)
		}

		if (this.queue.length >= this.maxSize) {
			throw new Error("MessageQueue has reached its maximum size.")
		}

		if (this.waitingPromises.length > 0) {
			// Non-null assertion is safe due to the length check.
			const { resolve } = this.waitingPromises.shift()!
			resolve(message)
		} else {
			this.queue.push(message)
		}
	}

	public readonly receive = async (): Promise<T> => {
		// If there are messages in the queue, they should be processed first,
		// even if an error has been set (unless rejectBufferedMessages was true during setError,
		// in which case the queue would have been emptied).
		if (this.queue.length > 0) {
			// Non-null assertion is safe due to the length check.
			return this.queue.shift()!
		}

		// If the queue is empty and an error is set, then throw the error.
		if (this.error) {
			throw this.error
		}

		// Otherwise, if the queue is empty and no error is set, wait for a new message.
		return new Promise<T>((resolve, reject) => {
			this.waitingPromises.push({ resolve, reject })
		})
	}

	public readonly setError = (
		error: Error,
		rejectBufferedMessages = false,
	): void => {
		if (this.error) {
			// Error is already set, do nothing to maintain the first error state.
			return
		}
		this.error = error
		if (rejectBufferedMessages) {
			this.queue.length = 0 // Clear the queue as messages will not be processed.
		}

		// Reject all currently waiting promises.
		// Iterate over a copy of the array, as reject handlers might trigger new operations on the queue.
		const currentWaitingPromises = [...this.waitingPromises]
		this.waitingPromises.length = 0 // Clear the list of waiting promises.

		for (const { reject } of currentWaitingPromises) {
			reject(error)
		}
	}
}
