import { Conn } from "../conn"
import { MessageQueue } from "./messageQueue"

/**
 * Message with direction information
 */
export interface MessageWithDirection<T> {
	message: T
	connectionId: string
}

/**
 * Minimalistic sniffer class that captures messages with direction information
 */
export class MessageSniffer<T> {
	private readonly allMessages: MessageWithDirection<T>[] = []

	/**
	 * Record a message that was sent from a specific connection
	 */
	public readonly recordMessage = (
		message: T,
		connectionId: string,
	): void => {
		this.allMessages.push({ message, connectionId })
	}

	/**
	 * Get all recorded messages with direction
	 */
	public readonly getAllMessages = (): readonly MessageWithDirection<T>[] => {
		return [...this.allMessages]
	}

	/**
	 * Get all recorded messages from both directions (content only, no direction info)
	 */
	public readonly getAllMessagesBothDirections = (): readonly T[] => {
		return this.allMessages.map((entry) => entry.message)
	}

	/**
	 * Get messages sent from a specific connection
	 */
	public readonly getMessagesFromConnection = (
		connectionId: string,
	): readonly T[] => {
		return this.allMessages
			.filter((entry) => entry.connectionId === connectionId)
			.map((entry) => entry.message)
	}

	/**
	 * Get the count of all recorded messages
	 */
	public readonly getMessageCount = (): number => {
		return this.allMessages.length
	}

	/**
	 * Clear all recorded messages
	 */
	public readonly clear = (): void => {
		this.allMessages.length = 0
	}
}

/**
 * MockConn implementation with message sniffing capabilities
 */
export class MockConnSniffing<T> implements Conn<T> {
	private readonly inputQueue: MessageQueue<T>
	private readonly outputQueue: MessageQueue<T>
	private readonly sniffer: MessageSniffer<T>
	private readonly connectionId: string
	private readonly sentMessages: T[] = []
	private closed = false

	private constructor(
		inputQueue: MessageQueue<T>,
		outputQueue: MessageQueue<T>,
		sniffer: MessageSniffer<T>,
		connectionId: string,
	) {
		this.inputQueue = inputQueue
		this.outputQueue = outputQueue
		this.sniffer = sniffer
		this.connectionId = connectionId
	}

	/**
	 * Create a connected pair of MockConnSniffing instances with a shared sniffer
	 * @param maxQueueSize Maximum size of the message queues
	 * @returns Tuple containing [conn1, conn2, sniffer]
	 */
	public static readonly createConnectedPair = <T>(
		maxQueueSize: number = Infinity,
	): [MockConnSniffing<T>, MockConnSniffing<T>, MessageSniffer<T>] => {
		const queue1 = new MessageQueue<T>(maxQueueSize)
		const queue2 = new MessageQueue<T>(maxQueueSize)
		const sniffer = new MessageSniffer<T>()

		const conn1 = new MockConnSniffing<T>(queue1, queue2, sniffer, "conn1")
		const conn2 = new MockConnSniffing<T>(queue2, queue1, sniffer, "conn2")

		return [conn1, conn2, sniffer]
	}

	/**
	 * Create a connected pair with separate sniffers for each connection
	 * @param maxQueueSize Maximum size of the message queues
	 * @returns Tuple containing [conn1, conn2, sniffer1, sniffer2]
	 */
	public static readonly createConnectedPairWithSeparateSniffers = <T>(
		maxQueueSize: number = Infinity,
	): [
		MockConnSniffing<T>,
		MockConnSniffing<T>,
		MessageSniffer<T>,
		MessageSniffer<T>,
	] => {
		const queue1 = new MessageQueue<T>(maxQueueSize)
		const queue2 = new MessageQueue<T>(maxQueueSize)
		const sniffer1 = new MessageSniffer<T>()
		const sniffer2 = new MessageSniffer<T>()

		const conn1 = new MockConnSniffing<T>(queue1, queue2, sniffer1, "conn1")
		const conn2 = new MockConnSniffing<T>(queue2, queue1, sniffer2, "conn2")

		return [conn1, conn2, sniffer1, sniffer2]
	}

	public readonly send = async (message: T): Promise<void> => {
		if (this.closed) {
			throw new Error("Connection is closed. Cannot send message.")
		}

		try {
			// Store message in connection's own store
			this.sentMessages.push(message)
			// Record the message in sniffer with connection ID
			this.sniffer.recordMessage(message, this.connectionId)
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

	/**
	 * Get the sniffer associated with this connection
	 */
	public readonly getSniffer = (): MessageSniffer<T> => {
		return this.sniffer
	}

	/**
	 * Get messages sent by this specific connection
	 */
	public readonly getSentMessages = (): readonly T[] => {
		return [...this.sentMessages]
	}

	/**
	 * Get the connection ID
	 */
	public readonly getConnectionId = (): string => {
		return this.connectionId
	}

	/**
	 * Check if the connection is closed
	 */
	public readonly isClosed = (): boolean => {
		return this.closed
	}
}
