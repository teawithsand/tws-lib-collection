type AsyncTask<T = any> = () => Promise<T>

export class AsyncTaskQueue {
	private queue: AsyncTask[] = []
	private _isRunning = false

	private idleResolvers: (() => void)[] = []

	public get queueLength(): number {
		return this.queue.length
	}

	public get isRunning(): boolean {
		return this._isRunning
	}

	readonly enqueue = <T>(task: AsyncTask<T>): Promise<T> =>
		new Promise<T>((resolve, reject) => {
			const wrappedTask = async () => {
				try {
					const result = await task()
					resolve(result)
					return result
				} catch (error) {
					reject(error)
					// Prevent unhandled rejection in runNext by not re-throwing
					return
				}
			}

			this.queue.push(wrappedTask)
			void this.runNext()
		})

	private runNext = async (): Promise<void> => {
		if (this._isRunning) {
			return
		}
		if (this.queue.length === 0) {
			this.resolveIdle()
			return
		}

		this._isRunning = true
		const task = this.queue.shift()!
		try {
			await task()
		} finally {
			this._isRunning = false
			void this.runNext()
		}
	}

	readonly clear = (): void => {
		this.queue = []
		this.resolveIdle()
	}

	readonly idlePromise = (): Promise<void> => {
		if (!this._isRunning && this.queue.length === 0) {
			return Promise.resolve()
		}
		return new Promise((resolve) => {
			this.idleResolvers.push(resolve)
		})
	}

	private resolveIdle = (): void => {
		while (this.idleResolvers.length > 0) {
			const resolve = this.idleResolvers.shift()!
			resolve()
		}
	}
}
