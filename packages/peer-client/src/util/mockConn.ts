import { Conn } from "../conn"
import { MessageQueue } from "./messageQueue"

export class MockConn<T> implements Conn<T> {
	private readonly inputQueue: MessageQueue<T>
	private readonly outputQueue: MessageQueue<T>
	private closed = false

	private constructor(
		inputQueue: MessageQueue<T>,
		outputQueue: MessageQueue<T>,
	) {
		this.inputQueue = inputQueue
		this.outputQueue = outputQueue
	}

	public static readonly createConnectedPair = <T>(
		maxQueueSize: number = Infinity,
	): [MockConn<T>, MockConn<T>] => {
		const queue1 = new MessageQueue<T>(maxQueueSize)
		const queue2 = new MessageQueue<T>(maxQueueSize)
		const conn1 = new MockConn<T>(queue1, queue2)
		const conn2 = new MockConn<T>(queue2, queue1)
		return [conn1, conn2]
	}

	public readonly send = async (message: T): Promise<void> => {
		if (this.closed) {
			throw new Error("Connection is closed. Cannot send message.")
		}
		try {
			this.outputQueue.send(message)
		} catch (error) {
			if (
				error instanceof Error &&
				error.message.startsWith("MessageQueue has an error set")
			) {
				this.close()
				throw new Error("Connection closed")
			}
			throw error
		}
	}

	public readonly receive = async (): Promise<T> => {
		try {
			const message = await this.inputQueue.receive()
			return message
		} catch (error) {
			this.close()
			throw error
		}
	}

	public readonly close = (): void => {
		if (this.closed) {
			return
		}
		this.closed = true
		const closeError = new Error("Connection closed")

		this.outputQueue.setError(closeError, false)
		this.inputQueue.setError(closeError, false)
	}
}
