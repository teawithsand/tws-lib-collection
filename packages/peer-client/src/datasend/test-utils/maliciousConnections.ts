import { Conn } from "../../conn"
import { MessageType } from "../protocol"

/**
 * Malicious connection that can send unexpected messages
 */
export class MaliciousConn implements Conn<ArrayBuffer> {
	private messageQueue: ArrayBuffer[] = []
	private closed = false

	public readonly send = async (_data: ArrayBuffer): Promise<void> => {
		if (this.closed) {
			throw new Error("Connection is closed")
		}
	}

	public readonly receive = async (): Promise<ArrayBuffer> => {
		if (this.closed) {
			throw new Error("Connection is closed")
		}
		if (this.messageQueue.length === 0) {
			throw new Error("No messages available")
		}
		return this.messageQueue.shift()!
	}

	public readonly close = async (): Promise<void> => {
		this.closed = true
	}

	/**
	 * Queue a message to be received
	 */
	public readonly queueMessage = (data: ArrayBuffer): void => {
		this.messageQueue.push(data)
	}

	/**
	 * Queue a malformed message
	 */
	public readonly queueMalformedMessage = (): void => {
		const malformed = new TextEncoder().encode("not-json").buffer
		this.messageQueue.push(malformed)
	}

	/**
	 * Queue a message with wrong type
	 */
	public readonly queueWrongTypeMessage = (): void => {
		const wrongType = JSON.stringify({
			type: "UNKNOWN_TYPE",
			payload: {},
		})
		const encoded = new TextEncoder().encode(wrongType).buffer
		this.messageQueue.push(encoded)
	}

	/**
	 * Queue a hello message with wrong version
	 */
	public readonly queueWrongVersionHello = (): void => {
		const message = JSON.stringify({
			type: MessageType.HELLO,
			payload: { version: 999 },
		})
		const encoded = new TextEncoder().encode(message).buffer
		this.messageQueue.push(encoded)
	}

	/**
	 * Queue an error message
	 */
	public readonly queueErrorMessage = (errorMsg: string): void => {
		const message = JSON.stringify({
			type: MessageType.ERROR,
			payload: { message: errorMsg },
		})
		const encoded = new TextEncoder().encode(message).buffer
		this.messageQueue.push(encoded)
	}

	/**
	 * Queue a valid hello message
	 */
	public readonly queueValidHello = (): void => {
		const message = JSON.stringify({
			type: MessageType.HELLO,
			payload: { version: 1 },
		})
		const encoded = new TextEncoder().encode(message).buffer
		this.messageQueue.push(encoded)
	}

	/**
	 * Queue transfer rejection
	 */
	public readonly queueTransferRejection = (): void => {
		const message = JSON.stringify({
			type: MessageType.REJECT_TRANSFER,
		})
		const encoded = new TextEncoder().encode(message).buffer
		this.messageQueue.push(encoded)
	}

	/**
	 * Queue transfer acceptance
	 */
	public readonly queueTransferAcceptance = (): void => {
		const message = JSON.stringify({
			type: MessageType.ACCEPT_TRANSFER,
		})
		const encoded = new TextEncoder().encode(message).buffer
		this.messageQueue.push(encoded)
	}

	/**
	 * Queue file chunk with oversized data
	 */
	public readonly queueOversizedFileChunk = (size: number): void => {
		const message = JSON.stringify({
			type: MessageType.FILE_CHUNK,
			payload: "x".repeat(size),
		})
		const encoded = new TextEncoder().encode(message).buffer
		this.messageQueue.push(encoded)
	}

	/**
	 * Queue a complete transfer message
	 */
	public readonly queueTransferComplete = (): void => {
		const message = JSON.stringify({
			type: MessageType.TRANSFER_COMPLETE,
		})
		const encoded = new TextEncoder().encode(message).buffer
		this.messageQueue.push(encoded)
	}

	/**
	 * Queue a file header message
	 */
	public readonly queueFileHeader = (header: unknown): void => {
		const message = JSON.stringify({
			type: MessageType.FILE_HEADER,
			payload: header,
		})
		const encoded = new TextEncoder().encode(message).buffer
		this.messageQueue.push(encoded)
	}

	/**
	 * Queue a file end message
	 */
	public readonly queueFileEnd = (): void => {
		const message = JSON.stringify({
			type: MessageType.FILE_END,
		})
		const encoded = new TextEncoder().encode(message).buffer
		this.messageQueue.push(encoded)
	}
}

/**
 * Connection that fails after a certain number of operations
 */
export class FailingConn implements Conn<ArrayBuffer> {
	private operationCount = 0

	constructor(private readonly failAfterOperations: number) {}

	public readonly send = async (_data: ArrayBuffer): Promise<void> => {
		this.operationCount++
		if (this.operationCount > this.failAfterOperations) {
			throw new Error("Connection failed")
		}
	}

	public readonly receive = async (): Promise<ArrayBuffer> => {
		this.operationCount++
		if (this.operationCount > this.failAfterOperations) {
			throw new Error("Connection failed")
		}

		return new ArrayBuffer(0)
	}

	public readonly close = async (): Promise<void> => {}
}

/**
 * Slow connection that introduces delays
 */
export class SlowConn implements Conn<ArrayBuffer> {
	private messageQueue: ArrayBuffer[] = []
	private closed = false

	constructor(private readonly delay: number = 1000) {}

	public readonly send = async (_data: ArrayBuffer): Promise<void> => {
		if (this.closed) {
			throw new Error("Connection is closed")
		}
		await new Promise((resolve) => setTimeout(resolve, this.delay))
	}

	public readonly receive = async (): Promise<ArrayBuffer> => {
		if (this.closed) {
			throw new Error("Connection is closed")
		}
		await new Promise((resolve) => setTimeout(resolve, this.delay))
		if (this.messageQueue.length === 0) {
			throw new Error("No messages available")
		}
		return this.messageQueue.shift()!
	}

	public readonly close = async (): Promise<void> => {
		this.closed = true
	}

	public readonly queueMessage = (data: ArrayBuffer): void => {
		this.messageQueue.push(data)
	}
}
