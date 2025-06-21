import { describe, expect, test } from "vitest"
import { MockConnSniffing } from "../util/mockConnSniffing"
import { MessageHandler } from "./messageHandler"
import { MessageType, PROTOCOL_VERSION } from "./protocol"

describe("Protocol", () => {
	describe("MessageType", () => {
		test("should contain all required message types", () => {
			expect(MessageType.HELLO).toBe("HELLO")
			expect(MessageType.TRANSFER_HEADER).toBe("TRANSFER_HEADER")
			expect(MessageType.ACCEPT_TRANSFER).toBe("ACCEPT_TRANSFER")
			expect(MessageType.REJECT_TRANSFER).toBe("REJECT_TRANSFER")
			expect(MessageType.FILE_HEADER).toBe("FILE_HEADER")
			expect(MessageType.FILE_CHUNK).toBe("FILE_CHUNK")
			expect(MessageType.CHUNK_ACK).toBe("CHUNK_ACK")
			expect(MessageType.FILE_END).toBe("FILE_END")
			expect(MessageType.TRANSFER_COMPLETE).toBe("TRANSFER_COMPLETE")
			expect(MessageType.ERROR).toBe("ERROR")
		})
	})

	describe("PROTOCOL_VERSION", () => {
		test("should be version 1", () => {
			expect(PROTOCOL_VERSION).toBe(1)
		})
	})
})

describe("MessageHandler", () => {
	test("should encode and decode JSON messages correctly", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const messageHandler = new MessageHandler()

		const originalMessage = {
			type: MessageType.HELLO,
			payload: { version: 1 },
		}

		await messageHandler.sendMessage(senderConn, originalMessage)

		const receivedMessage =
			await messageHandler.receiveMessage(receiverConn)
		expect(receivedMessage).toEqual(originalMessage)
	})

	test("should handle binary file chunk messages", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const messageHandler = new MessageHandler()

		const binaryData = new TextEncoder().encode("Hello, World!")
		const originalMessage = {
			type: MessageType.FILE_CHUNK,
			payload: binaryData,
		}

		await messageHandler.sendMessage(senderConn, originalMessage)

		const receivedMessage =
			await messageHandler.receiveMessage(receiverConn)
		expect(receivedMessage.type).toBe(MessageType.FILE_CHUNK)
		expect(receivedMessage.payload).toBeInstanceOf(ArrayBuffer)
		expect(
			new TextDecoder().decode(receivedMessage.payload as ArrayBuffer),
		).toBe("Hello, World!")
	})

	test("should handle transfer header messages", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const messageHandler = new MessageHandler()

		const originalMessage = {
			type: MessageType.TRANSFER_HEADER,
			payload: { transferId: "test-123", totalFiles: 5 },
		}

		await messageHandler.sendMessage(senderConn, originalMessage)
		const receivedMessage =
			await messageHandler.receiveMessage(receiverConn)
		expect(receivedMessage).toEqual(originalMessage)
	})

	test("should handle file header messages", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const messageHandler = new MessageHandler()

		const originalMessage = {
			type: MessageType.FILE_HEADER,
			payload: { fileName: "test.txt", fileSize: 1024 },
		}

		await messageHandler.sendMessage(senderConn, originalMessage)
		const receivedMessage =
			await messageHandler.receiveMessage(receiverConn)
		expect(receivedMessage).toEqual(originalMessage)
	})

	test("should handle accept transfer messages", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const messageHandler = new MessageHandler()

		const originalMessage = {
			type: MessageType.ACCEPT_TRANSFER,
		}

		await messageHandler.sendMessage(senderConn, originalMessage)
		const receivedMessage =
			await messageHandler.receiveMessage(receiverConn)
		expect(receivedMessage).toEqual(originalMessage)
	})

	test("should handle reject transfer messages", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const messageHandler = new MessageHandler()

		const originalMessage = {
			type: MessageType.REJECT_TRANSFER,
		}

		await messageHandler.sendMessage(senderConn, originalMessage)
		const receivedMessage =
			await messageHandler.receiveMessage(receiverConn)
		expect(receivedMessage).toEqual(originalMessage)
	})

	test("should handle file end messages", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const messageHandler = new MessageHandler()

		const originalMessage = {
			type: MessageType.FILE_END,
		}

		await messageHandler.sendMessage(senderConn, originalMessage)
		const receivedMessage =
			await messageHandler.receiveMessage(receiverConn)
		expect(receivedMessage).toEqual(originalMessage)
	})

	test("should handle transfer complete messages", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const messageHandler = new MessageHandler()

		const originalMessage = {
			type: MessageType.TRANSFER_COMPLETE,
		}

		await messageHandler.sendMessage(senderConn, originalMessage)
		const receivedMessage =
			await messageHandler.receiveMessage(receiverConn)
		expect(receivedMessage).toEqual(originalMessage)
	})

	test("should handle chunk acknowledgment messages", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const messageHandler = new MessageHandler()

		const originalMessage = {
			type: MessageType.CHUNK_ACK,
		}

		await messageHandler.sendMessage(senderConn, originalMessage)
		const receivedMessage =
			await messageHandler.receiveMessage(receiverConn)
		expect(receivedMessage).toEqual(originalMessage)
	})

	test("should handle error messages", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const messageHandler = new MessageHandler()

		const originalMessage = {
			type: MessageType.ERROR,
			payload: { message: "Something went wrong" },
		}

		await messageHandler.sendMessage(senderConn, originalMessage)
		const receivedMessage =
			await messageHandler.receiveMessage(receiverConn)
		expect(receivedMessage).toEqual(originalMessage)
	})

	test("should handle empty payloads", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const messageHandler = new MessageHandler()

		const originalMessage = {
			type: MessageType.FILE_END,
		}

		await messageHandler.sendMessage(senderConn, originalMessage)
		const receivedMessage =
			await messageHandler.receiveMessage(receiverConn)
		expect(receivedMessage.type).toBe(MessageType.FILE_END)
		expect(receivedMessage.payload).toBeUndefined()
	})

	test("should handle large binary data", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const messageHandler = new MessageHandler()

		const largeData = new ArrayBuffer(1024 * 1024)
		const view = new Uint8Array(largeData)
		for (let i = 0; i < view.length; i++) {
			view[i] = i % 256
		}

		const originalMessage = {
			type: MessageType.FILE_CHUNK,
			payload: largeData,
		}

		await messageHandler.sendMessage(senderConn, originalMessage)
		const receivedMessage =
			await messageHandler.receiveMessage(receiverConn)
		expect(receivedMessage.type).toBe(MessageType.FILE_CHUNK)
		expect(receivedMessage.payload).toBeInstanceOf(ArrayBuffer)
		expect((receivedMessage.payload as ArrayBuffer).byteLength).toBe(
			1024 * 1024,
		)

		const receivedView = new Uint8Array(
			receivedMessage.payload as ArrayBuffer,
		)
		for (let i = 0; i < Math.min(100, receivedView.length); i++) {
			expect(receivedView[i]).toBe(i % 256)
		}
	})
})
