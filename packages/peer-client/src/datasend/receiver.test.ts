import { describe, expect, test } from "vitest"
import { MockConnSniffing } from "../util/mockConnSniffing"
import { MessageHandler } from "./messageHandler"
import { MessageType } from "./protocol"
import { FileReceiver } from "./receiver"
import {
	FailingFileWriter,
	MockFileReceiverHandler,
	TestDataUtils,
	TestFileHeader,
	TestGlobalHeader,
} from "./test-utils/mocks"
import { ValidatingFileReceiverHandler } from "./writer/validatingFileReceiverHandler"

describe("FileReceiver", () => {
	const createTextMessage = (message: unknown): ArrayBuffer => {
		return new TextEncoder().encode(JSON.stringify(message)).buffer
	}

	test("should successfully receive files with valid protocol flow", async () => {
		const [senderConn, receiverConn, sniffer] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const handler = new MockFileReceiverHandler()
		const receiver = new FileReceiver<TestGlobalHeader, TestFileHeader>({
			conn: receiverConn,
			fileReceiverHandler: handler,
		})
		const messageHandler = new MessageHandler()

		const receivePromise = receiver.receive(async () => true)

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.HELLO,
			payload: { version: 1 },
		})

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.TRANSFER_HEADER,
			payload: { transferId: "test-123", totalFiles: 1 },
		})

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.FILE_HEADER,
			payload: { fileName: "test.txt", fileSize: 300 },
		})

		const chunks = TestDataUtils.createChunks([100, 200])
		for (const chunk of chunks) {
			await messageHandler.sendMessage(senderConn, {
				type: MessageType.FILE_CHUNK,
				payload: chunk,
			})
		}

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.FILE_END,
		})

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.TRANSFER_COMPLETE,
		})

		await expect(receivePromise).resolves.toBeUndefined()

		const writers = handler.getWriters()
		expect(writers).toHaveLength(1)
		expect(writers[0]?.getTotalBytes()).toBe(300)
		expect(handler.isClosed()).toBe(true)

		const messages = sniffer.getMessagesFromConnection("conn2")
		const ackMessages = messages.filter((msg) => {
			try {
				const parsed = JSON.parse(new TextDecoder().decode(msg))
				return parsed.type === MessageType.CHUNK_ACK
			} catch {
				return false
			}
		})
		expect(ackMessages).toHaveLength(2)
	})

	test("should handle protocol version mismatch", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const handler = new MockFileReceiverHandler()
		const receiver = new FileReceiver<TestGlobalHeader, TestFileHeader>({
			conn: receiverConn,
			fileReceiverHandler: handler,
		})

		const receivePromise = receiver.receive(async () => true)

		const wrongVersionMessage = createTextMessage({
			type: MessageType.HELLO,
			payload: { version: 999 },
		})
		senderConn.send(wrongVersionMessage)

		await expect(receivePromise).rejects.toThrow(
			"Protocol version mismatch",
		)
	})

	test("should handle transfer rejection", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const handler = new MockFileReceiverHandler()
		const receiver = new FileReceiver<TestGlobalHeader, TestFileHeader>({
			conn: receiverConn,
			fileReceiverHandler: handler,
		})
		const messageHandler = new MessageHandler()

		const receivePromise = receiver.receive(async () => false)

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.HELLO,
			payload: { version: 1 },
		})

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.TRANSFER_HEADER,
			payload: { transferId: "test-123", totalFiles: 1 },
		})

		await expect(receivePromise).resolves.toBeUndefined()

		expect(handler.isClosed()).toBe(false)
	})

	test("should handle malformed hello message", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const handler = new MockFileReceiverHandler()
		const receiver = new FileReceiver<TestGlobalHeader, TestFileHeader>({
			conn: receiverConn,
			fileReceiverHandler: handler,
		})

		const receivePromise = receiver.receive(async () => true)

		const malformedHello = createTextMessage({
			type: MessageType.HELLO,
		})
		senderConn.send(malformedHello)

		await expect(receivePromise).rejects.toThrow()
	})

	test("should handle missing hello message type", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const handler = new MockFileReceiverHandler()
		const receiver = new FileReceiver<TestGlobalHeader, TestFileHeader>({
			conn: receiverConn,
			fileReceiverHandler: handler,
		})

		const receivePromise = receiver.receive(async () => true)

		const noTypeMessage = createTextMessage({
			payload: { version: 1 },
		})
		senderConn.send(noTypeMessage)

		await expect(receivePromise).rejects.toThrow()
	})

	test("should handle wrong message type instead of transfer header", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const handler = new MockFileReceiverHandler()
		const receiver = new FileReceiver<TestGlobalHeader, TestFileHeader>({
			conn: receiverConn,
			fileReceiverHandler: handler,
		})
		const messageHandler = new MessageHandler()

		const receivePromise = receiver.receive(async () => true)

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.HELLO,
			payload: { version: 1 },
		})

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.FILE_HEADER,
			payload: { fileName: "test.txt", fileSize: 100 },
		})

		await expect(receivePromise).rejects.toThrow("Expected transfer header")
	})

	test("should handle unexpected message during file receiving", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const handler = new MockFileReceiverHandler()
		const receiver = new FileReceiver<TestGlobalHeader, TestFileHeader>({
			conn: receiverConn,
			fileReceiverHandler: handler,
		})
		const messageHandler = new MessageHandler()

		const receivePromise = receiver.receive(async () => true)

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.HELLO,
			payload: { version: 1 },
		})

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.TRANSFER_HEADER,
			payload: { transferId: "test-123", totalFiles: 1 },
		})

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.TRANSFER_COMPLETE,
		})

		await expect(receivePromise).resolves.toBeUndefined()
	})

	test("should handle unexpected message during file chunk receiving", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const handler = new MockFileReceiverHandler()
		const receiver = new FileReceiver<TestGlobalHeader, TestFileHeader>({
			conn: receiverConn,
			fileReceiverHandler: handler,
		})
		const messageHandler = new MessageHandler()

		const receivePromise = receiver.receive(async () => true)

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.HELLO,
			payload: { version: 1 },
		})

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.TRANSFER_HEADER,
			payload: { transferId: "test-123", totalFiles: 1 },
		})

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.FILE_HEADER,
			payload: { fileName: "test.txt", fileSize: 100 },
		})

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.TRANSFER_COMPLETE,
		})

		await expect(receivePromise).rejects.toThrow(
			"Unexpected message type during file transfer",
		)
	})

	test("should handle error message from sender", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const handler = new MockFileReceiverHandler()
		const receiver = new FileReceiver<TestGlobalHeader, TestFileHeader>({
			conn: receiverConn,
			fileReceiverHandler: handler,
		})
		const messageHandler = new MessageHandler()

		const receivePromise = receiver.receive(async () => true)

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.HELLO,
			payload: { version: 1 },
		})

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.TRANSFER_HEADER,
			payload: { transferId: "test-123", totalFiles: 1 },
		})

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.ERROR,
			payload: { message: "Sender error occurred" },
		})

		await expect(receivePromise).rejects.toThrow(
			"Remote error: Sender error occurred",
		)
	})

	test("should handle file writer failure", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()

		class FailingReceiverHandler extends MockFileReceiverHandler {
			public override readonly createFileWriter = async (
				_globalHeader: TestGlobalHeader,
				_fileHeader: TestFileHeader,
				_fileIndex: number,
			) => {
				return new FailingFileWriter(50)
			}
		}

		const failingHandler = new FailingReceiverHandler()

		const receiver = new FileReceiver<TestGlobalHeader, TestFileHeader>({
			conn: receiverConn,
			fileReceiverHandler: failingHandler,
		})
		const messageHandler = new MessageHandler()

		const receivePromise = receiver.receive(async () => true)

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.HELLO,
			payload: { version: 1 },
		})

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.TRANSFER_HEADER,
			payload: { transferId: "test-123", totalFiles: 1 },
		})

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.FILE_HEADER,
			payload: { fileName: "test.txt", fileSize: 200 },
		})

		const largeChunk = TestDataUtils.createChunk(100)
		await messageHandler.sendMessage(senderConn, {
			type: MessageType.FILE_CHUNK,
			payload: largeChunk,
		})

		await expect(receivePromise).rejects.toThrow("Simulated write failure")
	})

	test("should handle multiple files transfer", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const handler = new MockFileReceiverHandler()
		const receiver = new FileReceiver<TestGlobalHeader, TestFileHeader>({
			conn: receiverConn,
			fileReceiverHandler: handler,
		})
		const messageHandler = new MessageHandler()

		const receivePromise = receiver.receive(async () => true)

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.HELLO,
			payload: { version: 1 },
		})

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.TRANSFER_HEADER,
			payload: { transferId: "test-123", totalFiles: 2 },
		})

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.FILE_HEADER,
			payload: { fileName: "file1.txt", fileSize: 100 },
		})

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.FILE_CHUNK,
			payload: TestDataUtils.createChunk(100),
		})

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.FILE_END,
		})

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.FILE_HEADER,
			payload: { fileName: "file2.txt", fileSize: 200 },
		})

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.FILE_CHUNK,
			payload: TestDataUtils.createChunk(200),
		})

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.FILE_END,
		})

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.TRANSFER_COMPLETE,
		})

		await expect(receivePromise).resolves.toBeUndefined()

		const writers = handler.getWriters()
		expect(writers).toHaveLength(2)
		expect(writers[0]?.getTotalBytes()).toBe(100)
		expect(writers[1]?.getTotalBytes()).toBe(200)
	})

	test("should handle validation with ValidatingFileReceiverHandler", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const baseHandler = new MockFileReceiverHandler()
		const validatingHandler = new ValidatingFileReceiverHandler(
			baseHandler,
			{
				extractFileCount: (globalHeader) => ({
					expected: globalHeader.totalFiles,
				}),
				extractFileSize: (_globalHeader, fileHeader) => ({
					expected: fileHeader.fileSize,
				}),
			},
		)
		const receiver = new FileReceiver<TestGlobalHeader, TestFileHeader>({
			conn: receiverConn,
			fileReceiverHandler: validatingHandler,
		})
		const messageHandler = new MessageHandler()

		const receivePromise = receiver.receive(async () => true)

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.HELLO,
			payload: { version: 1 },
		})

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.TRANSFER_HEADER,
			payload: { transferId: "test-123", totalFiles: 1 },
		})

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.FILE_HEADER,
			payload: { fileName: "test.txt", fileSize: 100 },
		})

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.FILE_CHUNK,
			payload: TestDataUtils.createChunk(100),
		})

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.FILE_END,
		})

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.TRANSFER_COMPLETE,
		})

		await expect(receivePromise).resolves.toBeUndefined()

		const writers = baseHandler.getWriters()
		expect(writers).toHaveLength(1)
		expect(writers[0]?.getTotalBytes()).toBe(100)
	})

	test("should handle validation failure with wrong file size", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const baseHandler = new MockFileReceiverHandler()
		const validatingHandler = new ValidatingFileReceiverHandler(
			baseHandler,
			{
				extractFileCount: () => null,
				extractFileSize: (_globalHeader, fileHeader) => ({
					expected: fileHeader.fileSize,
				}),
			},
		)
		const receiver = new FileReceiver<TestGlobalHeader, TestFileHeader>({
			conn: receiverConn,
			fileReceiverHandler: validatingHandler,
		})
		const messageHandler = new MessageHandler()

		const receivePromise = receiver.receive(async () => true)

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.HELLO,
			payload: { version: 1 },
		})

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.TRANSFER_HEADER,
			payload: { transferId: "test-123", totalFiles: 1 },
		})

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.FILE_HEADER,
			payload: { fileName: "test.txt", fileSize: 100 },
		})

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.FILE_CHUNK,
			payload: TestDataUtils.createChunk(200),
		})

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.FILE_END,
		})

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.TRANSFER_COMPLETE,
		})

		await expect(receivePromise).rejects.toThrow(
			"expected 100 bytes, but received 200 bytes",
		)
	})

	test("should handle validation failure with wrong file count", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const baseHandler = new MockFileReceiverHandler()
		const validatingHandler = new ValidatingFileReceiverHandler(
			baseHandler,
			{
				extractFileCount: (globalHeader) => ({
					expected: globalHeader.totalFiles,
				}),
				extractFileSize: () => null,
			},
		)
		const receiver = new FileReceiver<TestGlobalHeader, TestFileHeader>({
			conn: receiverConn,
			fileReceiverHandler: validatingHandler,
		})
		const messageHandler = new MessageHandler()

		const receivePromise = receiver.receive(async () => true)

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.HELLO,
			payload: { version: 1 },
		})

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.TRANSFER_HEADER,
			payload: { transferId: "test-123", totalFiles: 2 },
		})

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.FILE_HEADER,
			payload: { fileName: "test.txt", fileSize: 100 },
		})

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.FILE_CHUNK,
			payload: TestDataUtils.createChunk(100),
		})

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.FILE_END,
		})

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.TRANSFER_COMPLETE,
		})

		await expect(receivePromise).rejects.toThrow(
			"Expected 2 files, but received 1",
		)
	})

	test("should handle excessive file size with max validation", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const baseHandler = new MockFileReceiverHandler()
		const validatingHandler = new ValidatingFileReceiverHandler(
			baseHandler,
			{
				extractFileCount: () => null,
				extractFileSize: () => ({ max: 50 }),
			},
		)
		const receiver = new FileReceiver<TestGlobalHeader, TestFileHeader>({
			conn: receiverConn,
			fileReceiverHandler: validatingHandler,
		})
		const messageHandler = new MessageHandler()

		const receivePromise = receiver.receive(async () => true)

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.HELLO,
			payload: { version: 1 },
		})

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.TRANSFER_HEADER,
			payload: { transferId: "test-123", totalFiles: 1 },
		})

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.FILE_HEADER,
			payload: { fileName: "test.txt", fileSize: 100 },
		})

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.FILE_CHUNK,
			payload: TestDataUtils.createChunk(100),
		})

		await expect(receivePromise).rejects.toThrow(
			"exceeds maximum of 50 bytes",
		)
	})

	test("should allow connection reuse after successful receive", async () => {
		const [senderConn, receiverConn, sniffer] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const messageHandler = new MessageHandler()

		const handler1 = new MockFileReceiverHandler()
		const receiver1 = new FileReceiver<TestGlobalHeader, TestFileHeader>({
			conn: receiverConn,
			fileReceiverHandler: handler1,
		})

		const receivePromise1 = receiver1.receive(async () => true)

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.HELLO,
			payload: { version: 1 },
		})
		await messageHandler.sendMessage(senderConn, {
			type: MessageType.TRANSFER_HEADER,
			payload: { transferId: "test-1", totalFiles: 1 },
		})
		await messageHandler.sendMessage(senderConn, {
			type: MessageType.FILE_HEADER,
			payload: { fileName: "file1.txt", fileSize: 100 },
		})
		await messageHandler.sendMessage(senderConn, {
			type: MessageType.FILE_CHUNK,
			payload: TestDataUtils.createChunk(100),
		})
		await messageHandler.sendMessage(senderConn, {
			type: MessageType.FILE_END,
		})
		await messageHandler.sendMessage(senderConn, {
			type: MessageType.TRANSFER_COMPLETE,
		})

		await expect(receivePromise1).resolves.toBeUndefined()

		sniffer.clear()

		const handler2 = new MockFileReceiverHandler()
		const receiver2 = new FileReceiver<TestGlobalHeader, TestFileHeader>({
			conn: receiverConn,
			fileReceiverHandler: handler2,
		})

		const receivePromise2 = receiver2.receive(async () => true)

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.HELLO,
			payload: { version: 1 },
		})
		await messageHandler.sendMessage(senderConn, {
			type: MessageType.TRANSFER_HEADER,
			payload: { transferId: "test-2", totalFiles: 1 },
		})
		await messageHandler.sendMessage(senderConn, {
			type: MessageType.FILE_HEADER,
			payload: { fileName: "file2.txt", fileSize: 200 },
		})
		await messageHandler.sendMessage(senderConn, {
			type: MessageType.FILE_CHUNK,
			payload: TestDataUtils.createChunk(200),
		})
		await messageHandler.sendMessage(senderConn, {
			type: MessageType.FILE_END,
		})
		await messageHandler.sendMessage(senderConn, {
			type: MessageType.TRANSFER_COMPLETE,
		})

		await expect(receivePromise2).resolves.toBeUndefined()

		const pendingMessages = sniffer.getAllMessages()
		expect(pendingMessages.length).toBeGreaterThan(0)
	})

	test("should allow connection reuse after rejected transfer", async () => {
		const [senderConn, receiverConn, sniffer] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const handler = new MockFileReceiverHandler()
		const receiver = new FileReceiver<TestGlobalHeader, TestFileHeader>({
			conn: receiverConn,
			fileReceiverHandler: handler,
		})
		const messageHandler = new MessageHandler()

		const receivePromise1 = receiver.receive(async () => false)

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.HELLO,
			payload: { version: 1 },
		})
		await messageHandler.sendMessage(senderConn, {
			type: MessageType.TRANSFER_HEADER,
			payload: { transferId: "test-1", totalFiles: 1 },
		})

		await expect(receivePromise1).resolves.toBeUndefined()

		sniffer.clear()

		const receivePromise2 = receiver.receive(async () => true)

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.HELLO,
			payload: { version: 1 },
		})
		await messageHandler.sendMessage(senderConn, {
			type: MessageType.TRANSFER_HEADER,
			payload: { transferId: "test-2", totalFiles: 1 },
		})
		await messageHandler.sendMessage(senderConn, {
			type: MessageType.FILE_HEADER,
			payload: { fileName: "file2.txt", fileSize: 200 },
		})
		await messageHandler.sendMessage(senderConn, {
			type: MessageType.FILE_CHUNK,
			payload: TestDataUtils.createChunk(200),
		})
		await messageHandler.sendMessage(senderConn, {
			type: MessageType.FILE_END,
		})
		await messageHandler.sendMessage(senderConn, {
			type: MessageType.TRANSFER_COMPLETE,
		})

		await expect(receivePromise2).resolves.toBeUndefined()

		const pendingMessages = sniffer.getAllMessages()
		expect(pendingMessages.length).toBeGreaterThan(0)
	})

	test("should handle malicious sender sending extra messages during transfer", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const handler = new MockFileReceiverHandler()
		const receiver = new FileReceiver<TestGlobalHeader, TestFileHeader>({
			conn: receiverConn,
			fileReceiverHandler: handler,
		})
		const messageHandler = new MessageHandler()

		const receivePromise = receiver.receive(async () => true)

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.HELLO,
			payload: { version: 1 },
		})
		await messageHandler.sendMessage(senderConn, {
			type: MessageType.TRANSFER_HEADER,
			payload: { transferId: "test-123", totalFiles: 1 },
		})
		await messageHandler.sendMessage(senderConn, {
			type: MessageType.FILE_HEADER,
			payload: { fileName: "test.txt", fileSize: 300 },
		})

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.FILE_CHUNK,
			payload: TestDataUtils.createChunk(100),
		})

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.HELLO,
			payload: { version: 1 },
		})

		await expect(receivePromise).rejects.toThrow(
			"Unexpected message type during file transfer",
		)
	})

	test("should handle malicious sender sending garbage data", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const handler = new MockFileReceiverHandler()
		const receiver = new FileReceiver<TestGlobalHeader, TestFileHeader>({
			conn: receiverConn,
			fileReceiverHandler: handler,
		})

		const receivePromise = receiver.receive(async () => true)

		const malformedMessage = new TextEncoder().encode("invalid json").buffer
		senderConn.send(malformedMessage)

		await expect(receivePromise).rejects.toThrow()
	})

	test("should handle malicious sender pretending protocol compliance then corrupting data", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const handler = new MockFileReceiverHandler()
		const receiver = new FileReceiver<TestGlobalHeader, TestFileHeader>({
			conn: receiverConn,
			fileReceiverHandler: handler,
		})
		const messageHandler = new MessageHandler()

		const receivePromise = receiver.receive(async () => true)

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.HELLO,
			payload: { version: 1 },
		})
		await messageHandler.sendMessage(senderConn, {
			type: MessageType.TRANSFER_HEADER,
			payload: { transferId: "test-123", totalFiles: 2 },
		})

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.FILE_HEADER,
			payload: { fileName: "file1.txt", fileSize: 100 },
		})
		await messageHandler.sendMessage(senderConn, {
			type: MessageType.FILE_CHUNK,
			payload: TestDataUtils.createChunk(100),
		})
		await messageHandler.sendMessage(senderConn, {
			type: MessageType.FILE_END,
		})

		const garbageMessage = new ArrayBuffer(100)
		const garbageView = new Uint8Array(garbageMessage)
		for (let i = 0; i < garbageView.length; i++) {
			garbageView[i] = Math.floor(Math.random() * 256)
		}
		senderConn.send(garbageMessage)

		await expect(receivePromise).rejects.toThrow()
	})

	test("should handle malicious sender sending wrong message sequence", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const handler = new MockFileReceiverHandler()
		const receiver = new FileReceiver<TestGlobalHeader, TestFileHeader>({
			conn: receiverConn,
			fileReceiverHandler: handler,
		})
		const messageHandler = new MessageHandler()

		const receivePromise = receiver.receive(async () => true)

		await messageHandler.sendMessage(senderConn, {
			type: MessageType.TRANSFER_HEADER,
			payload: { transferId: "test-123", totalFiles: 1 },
		})

		await expect(receivePromise).rejects.toThrow()
	})
})
