import { describe, expect, test } from "vitest"
import { MockConnSniffing } from "../util/mockConnSniffing"
import { MessageHandler } from "./messageHandler"
import { MessageType } from "./protocol"
import { FileSender } from "./sender"
import {
	FailingFileReader,
	MockFileReader,
	MockFileSource,
	TestDataUtils,
	TestFileHeader,
	TestGlobalHeader,
} from "./test-utils/mocks"

describe("FileSender", () => {
	const createTextMessage = (message: unknown): ArrayBuffer => {
		return new TextEncoder().encode(JSON.stringify(message)).buffer
	}

	test("should successfully send files with valid protocol flow", async () => {
		const [senderConn, receiverConn, sniffer] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const sender = new FileSender<TestGlobalHeader, TestFileHeader>({
			conn: senderConn,
		})
		const messageHandler = new MessageHandler()

		const chunks = TestDataUtils.createChunks([100, 200, 150])
		const fileReader = new MockFileReader(chunks)
		const fileSource = new MockFileSource([
			{
				reader: fileReader,
				header: { fileName: "test.txt", fileSize: 450 },
			},
		])

		const sendPromise = sender.send(
			{ transferId: "test-123", totalFiles: 1 },
			fileSource,
		)

		await messageHandler.sendMessage(receiverConn, {
			type: MessageType.HELLO,
			payload: { version: 1 },
		})
		await messageHandler.sendMessage(receiverConn, {
			type: MessageType.ACCEPT_TRANSFER,
		})

		for (let i = 0; i < chunks.length; i++) {
			await messageHandler.sendMessage(receiverConn, {
				type: MessageType.CHUNK_ACK,
			})
		}

		await messageHandler.sendMessage(receiverConn, {
			type: MessageType.TRANSFER_COMPLETE,
		})

		await sendPromise

		const messages = sniffer.getMessagesFromConnection("conn1")
		expect(messages.length).toBeGreaterThan(0)
		expect(fileSource.isClosed()).toBe(false)
	})

	test("should handle protocol version mismatch from receiver", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const sender = new FileSender<TestGlobalHeader, TestFileHeader>({
			conn: senderConn,
		})

		const fileSource = new MockFileSource([])

		const sendPromise = sender.send(
			{ transferId: "test-123", totalFiles: 0 },
			fileSource,
		)

		const wrongVersionMessage = createTextMessage({
			type: MessageType.HELLO,
			payload: { version: 999 },
		})
		receiverConn.send(wrongVersionMessage)

		await expect(sendPromise).rejects.toThrow("Protocol version mismatch")
	})

	test("should handle transfer rejection from receiver", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const sender = new FileSender<TestGlobalHeader, TestFileHeader>({
			conn: senderConn,
		})

		const fileSource = new MockFileSource([])

		const sendPromise = sender.send(
			{ transferId: "test-123", totalFiles: 0 },
			fileSource,
		)

		const helloMessage = createTextMessage({
			type: MessageType.HELLO,
			payload: { version: 1 },
		})
		receiverConn.send(helloMessage)

		const rejectMessage = createTextMessage({
			type: MessageType.REJECT_TRANSFER,
		})
		receiverConn.send(rejectMessage)

		await expect(sendPromise).rejects.toThrow(
			"Transfer rejected by receiver",
		)
	})

	test("should handle unexpected message type during transfer negotiation", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const sender = new FileSender<TestGlobalHeader, TestFileHeader>({
			conn: senderConn,
		})

		const fileSource = new MockFileSource([])

		const sendPromise = sender.send(
			{ transferId: "test-123", totalFiles: 0 },
			fileSource,
		)

		const helloMessage = createTextMessage({
			type: MessageType.HELLO,
			payload: { version: 1 },
		})
		receiverConn.send(helloMessage)

		const unexpectedMessage = createTextMessage({
			type: MessageType.FILE_HEADER,
			payload: { fileName: "unexpected.txt", fileSize: 100 },
		})
		receiverConn.send(unexpectedMessage)

		await expect(sendPromise).rejects.toThrow(
			"Expected transfer accept/reject response",
		)
	})

	test("should handle malformed JSON message from receiver", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const sender = new FileSender<TestGlobalHeader, TestFileHeader>({
			conn: senderConn,
		})

		const fileSource = new MockFileSource([])

		const sendPromise = sender.send(
			{ transferId: "test-123", totalFiles: 0 },
			fileSource,
		)

		const malformedMessage = new TextEncoder().encode("not-json").buffer
		receiverConn.send(malformedMessage)

		await expect(sendPromise).rejects.toThrow()
	})

	test("should handle missing message type field", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const sender = new FileSender<TestGlobalHeader, TestFileHeader>({
			conn: senderConn,
		})

		const fileSource = new MockFileSource([])

		const sendPromise = sender.send(
			{ transferId: "test-123", totalFiles: 0 },
			fileSource,
		)

		const noTypeMessage = createTextMessage({
			payload: { version: 1 },
		})
		receiverConn.send(noTypeMessage)

		await expect(sendPromise).rejects.toThrow()
	})

	test("should handle invalid message type", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const sender = new FileSender<TestGlobalHeader, TestFileHeader>({
			conn: senderConn,
		})

		const fileSource = new MockFileSource([])

		const sendPromise = sender.send(
			{ transferId: "test-123", totalFiles: 0 },
			fileSource,
		)

		const invalidTypeMessage = createTextMessage({
			type: "INVALID_TYPE",
			payload: { version: 1 },
		})
		receiverConn.send(invalidTypeMessage)

		await expect(sendPromise).rejects.toThrow()
	})

	test("should handle file reader failure during sending", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const sender = new FileSender<TestGlobalHeader, TestFileHeader>({
			conn: senderConn,
		})

		const chunks = TestDataUtils.createChunks([100, 200])
		const failingReader = new FailingFileReader(chunks, 1)
		const fileSource = new MockFileSource([
			{
				reader: failingReader,
				header: { fileName: "test.txt", fileSize: 300 },
			},
		])

		const sendPromise = sender.send(
			{ transferId: "test-123", totalFiles: 1 },
			fileSource,
		)

		const helloMessage = createTextMessage({
			type: MessageType.HELLO,
			payload: { version: 1 },
		})
		receiverConn.send(helloMessage)

		const acceptMessage = createTextMessage({
			type: MessageType.ACCEPT_TRANSFER,
		})
		receiverConn.send(acceptMessage)

		const chunkAckMessage = createTextMessage({
			type: MessageType.CHUNK_ACK,
		})
		receiverConn.send(chunkAckMessage)

		await expect(sendPromise).rejects.toThrow("Simulated read failure")
	})

	test("should handle missing chunk acknowledgment", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const sender = new FileSender<TestGlobalHeader, TestFileHeader>({
			conn: senderConn,
		})

		const chunks = TestDataUtils.createChunks([100])
		const fileReader = new MockFileReader(chunks)
		const fileSource = new MockFileSource([
			{
				reader: fileReader,
				header: { fileName: "test.txt", fileSize: 100 },
			},
		])

		const sendPromise = sender.send(
			{ transferId: "test-123", totalFiles: 1 },
			fileSource,
		)

		const helloMessage = createTextMessage({
			type: MessageType.HELLO,
			payload: { version: 1 },
		})
		receiverConn.send(helloMessage)

		const acceptMessage = createTextMessage({
			type: MessageType.ACCEPT_TRANSFER,
		})
		receiverConn.send(acceptMessage)

		const unexpectedMessage = createTextMessage({
			type: MessageType.FILE_END,
		})
		receiverConn.send(unexpectedMessage)

		await expect(sendPromise).rejects.toThrow(
			"Expected chunk acknowledgment",
		)
	})

	test("should handle receiver sending error during transfer", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const sender = new FileSender<TestGlobalHeader, TestFileHeader>({
			conn: senderConn,
		})

		const chunks = TestDataUtils.createChunks([100])
		const fileReader = new MockFileReader(chunks)
		const fileSource = new MockFileSource([
			{
				reader: fileReader,
				header: { fileName: "test.txt", fileSize: 100 },
			},
		])

		const sendPromise = sender.send(
			{ transferId: "test-123", totalFiles: 1 },
			fileSource,
		)

		const helloMessage = createTextMessage({
			type: MessageType.HELLO,
			payload: { version: 1 },
		})
		receiverConn.send(helloMessage)

		const acceptMessage = createTextMessage({
			type: MessageType.ACCEPT_TRANSFER,
		})
		receiverConn.send(acceptMessage)

		const errorMessage = createTextMessage({
			type: MessageType.ERROR,
			payload: { message: "Receiver error occurred" },
		})
		receiverConn.send(errorMessage)

		await expect(sendPromise).rejects.toThrow(
			"Remote error: Receiver error occurred",
		)
	})

	test("should handle empty file transfer", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const sender = new FileSender<TestGlobalHeader, TestFileHeader>({
			conn: senderConn,
		})

		const fileSource = new MockFileSource([])

		const sendPromise = sender.send(
			{ transferId: "test-123", totalFiles: 0 },
			fileSource,
		)

		const helloMessage = createTextMessage({
			type: MessageType.HELLO,
			payload: { version: 1 },
		})
		receiverConn.send(helloMessage)

		const acceptMessage = createTextMessage({
			type: MessageType.ACCEPT_TRANSFER,
		})
		receiverConn.send(acceptMessage)

		const completeMessage = createTextMessage({
			type: MessageType.TRANSFER_COMPLETE,
		})
		receiverConn.send(completeMessage)

		await expect(sendPromise).resolves.toBeUndefined()
	})

	test("should handle multiple files transfer", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const sender = new FileSender<TestGlobalHeader, TestFileHeader>({
			conn: senderConn,
		})

		const chunks1 = TestDataUtils.createChunks([100])
		const chunks2 = TestDataUtils.createChunks([200])
		const fileReader1 = new MockFileReader(chunks1)
		const fileReader2 = new MockFileReader(chunks2)
		const fileSource = new MockFileSource([
			{
				reader: fileReader1,
				header: { fileName: "file1.txt", fileSize: 100 },
			},
			{
				reader: fileReader2,
				header: { fileName: "file2.txt", fileSize: 200 },
			},
		])

		const sendPromise = sender.send(
			{ transferId: "test-123", totalFiles: 2 },
			fileSource,
		)

		const helloMessage = createTextMessage({
			type: MessageType.HELLO,
			payload: { version: 1 },
		})
		receiverConn.send(helloMessage)

		const acceptMessage = createTextMessage({
			type: MessageType.ACCEPT_TRANSFER,
		})
		receiverConn.send(acceptMessage)

		const chunkAckMessage = createTextMessage({
			type: MessageType.CHUNK_ACK,
		})
		receiverConn.send(chunkAckMessage)
		receiverConn.send(chunkAckMessage)

		await expect(sendPromise).resolves.toBeUndefined()
	})

	test("should allow connection reuse after successful transfer", async () => {
		const [senderConn, receiverConn, sniffer] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const sender = new FileSender<TestGlobalHeader, TestFileHeader>({
			conn: senderConn,
		})
		const messageHandler = new MessageHandler()

		const chunks1 = TestDataUtils.createChunks([100])
		const fileReader1 = new MockFileReader(chunks1)
		const fileSource1 = new MockFileSource([
			{
				reader: fileReader1,
				header: { fileName: "file1.txt", fileSize: 100 },
			},
		])

		const sendPromise1 = sender.send(
			{ transferId: "test-1", totalFiles: 1 },
			fileSource1,
		)

		await messageHandler.sendMessage(receiverConn, {
			type: MessageType.HELLO,
			payload: { version: 1 },
		})
		await messageHandler.sendMessage(receiverConn, {
			type: MessageType.ACCEPT_TRANSFER,
		})
		await messageHandler.sendMessage(receiverConn, {
			type: MessageType.CHUNK_ACK,
		})

		await expect(sendPromise1).resolves.toBeUndefined()

		sniffer.clear()

		const chunks2 = TestDataUtils.createChunks([200])
		const fileReader2 = new MockFileReader(chunks2)
		const fileSource2 = new MockFileSource([
			{
				reader: fileReader2,
				header: { fileName: "file2.txt", fileSize: 200 },
			},
		])

		const sendPromise2 = sender.send(
			{ transferId: "test-2", totalFiles: 1 },
			fileSource2,
		)

		await messageHandler.sendMessage(receiverConn, {
			type: MessageType.HELLO,
			payload: { version: 1 },
		})
		await messageHandler.sendMessage(receiverConn, {
			type: MessageType.ACCEPT_TRANSFER,
		})
		await messageHandler.sendMessage(receiverConn, {
			type: MessageType.CHUNK_ACK,
		})

		await expect(sendPromise2).resolves.toBeUndefined()

		const pendingMessages = sniffer.getAllMessages()
		expect(pendingMessages.length).toBeGreaterThan(0)
	})

	test("should allow connection reuse after rejected transfer", async () => {
		const [senderConn, receiverConn, sniffer] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const sender = new FileSender<TestGlobalHeader, TestFileHeader>({
			conn: senderConn,
		})
		const messageHandler = new MessageHandler()

		const chunks1 = TestDataUtils.createChunks([100])
		const fileReader1 = new MockFileReader(chunks1)
		const fileSource1 = new MockFileSource([
			{
				reader: fileReader1,
				header: { fileName: "file1.txt", fileSize: 100 },
			},
		])

		const sendPromise1 = sender.send(
			{ transferId: "test-1", totalFiles: 1 },
			fileSource1,
		)

		await messageHandler.sendMessage(receiverConn, {
			type: MessageType.HELLO,
			payload: { version: 1 },
		})
		await messageHandler.sendMessage(receiverConn, {
			type: MessageType.REJECT_TRANSFER,
		})

		await expect(sendPromise1).rejects.toThrow(
			"Transfer rejected by receiver",
		)

		sniffer.clear()

		const chunks2 = TestDataUtils.createChunks([200])
		const fileReader2 = new MockFileReader(chunks2)
		const fileSource2 = new MockFileSource([
			{
				reader: fileReader2,
				header: { fileName: "file2.txt", fileSize: 200 },
			},
		])

		const sendPromise2 = sender.send(
			{ transferId: "test-2", totalFiles: 1 },
			fileSource2,
		)

		await messageHandler.sendMessage(receiverConn, {
			type: MessageType.HELLO,
			payload: { version: 1 },
		})
		await messageHandler.sendMessage(receiverConn, {
			type: MessageType.ACCEPT_TRANSFER,
		})
		await messageHandler.sendMessage(receiverConn, {
			type: MessageType.CHUNK_ACK,
		})

		await expect(sendPromise2).resolves.toBeUndefined()

		const pendingMessages = sniffer.getAllMessages()
		expect(pendingMessages.length).toBeGreaterThan(0)
	})

	test("should handle malicious receiver sending extra messages during transfer", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const sender = new FileSender<TestGlobalHeader, TestFileHeader>({
			conn: senderConn,
		})

		const chunks = TestDataUtils.createChunks([100, 200])
		const fileReader = new MockFileReader(chunks)
		const fileSource = new MockFileSource([
			{
				reader: fileReader,
				header: { fileName: "test.txt", fileSize: 300 },
			},
		])

		const sendPromise = sender.send(
			{ transferId: "test-123", totalFiles: 1 },
			fileSource,
		)

		const helloMessage = createTextMessage({
			type: MessageType.HELLO,
			payload: { version: 1 },
		})
		receiverConn.send(helloMessage)

		const acceptMessage = createTextMessage({
			type: MessageType.ACCEPT_TRANSFER,
		})
		receiverConn.send(acceptMessage)

		const chunkAckMessage = createTextMessage({
			type: MessageType.CHUNK_ACK,
		})
		receiverConn.send(chunkAckMessage)

		const maliciousMessage = createTextMessage({
			type: MessageType.TRANSFER_HEADER,
			payload: { malicious: "data" },
		})
		receiverConn.send(maliciousMessage)

		await expect(sendPromise).rejects.toThrow(
			"Expected chunk acknowledgment",
		)
	})

	test("should handle malicious receiver sending invalid chunk acknowledgment", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const sender = new FileSender<TestGlobalHeader, TestFileHeader>({
			conn: senderConn,
		})

		const chunks = TestDataUtils.createChunks([100])
		const fileReader = new MockFileReader(chunks)
		const fileSource = new MockFileSource([
			{
				reader: fileReader,
				header: { fileName: "test.txt", fileSize: 100 },
			},
		])

		const sendPromise = sender.send(
			{ transferId: "test-123", totalFiles: 1 },
			fileSource,
		)

		const helloMessage = createTextMessage({
			type: MessageType.HELLO,
			payload: { version: 1 },
		})
		receiverConn.send(helloMessage)

		const acceptMessage = createTextMessage({
			type: MessageType.ACCEPT_TRANSFER,
		})
		receiverConn.send(acceptMessage)

		const malformedMessage = new TextEncoder().encode("invalid json").buffer
		receiverConn.send(malformedMessage)

		await expect(sendPromise).rejects.toThrow()
	})

	test("should handle malicious receiver pretending protocol compliance then sending garbage", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()
		const sender = new FileSender<TestGlobalHeader, TestFileHeader>({
			conn: senderConn,
		})

		const chunks = TestDataUtils.createChunks([100, 200, 150])
		const fileReader = new MockFileReader(chunks)
		const fileSource = new MockFileSource([
			{
				reader: fileReader,
				header: { fileName: "test.txt", fileSize: 450 },
			},
		])

		const sendPromise = sender.send(
			{ transferId: "test-123", totalFiles: 1 },
			fileSource,
		)

		const helloMessage = createTextMessage({
			type: MessageType.HELLO,
			payload: { version: 1 },
		})
		receiverConn.send(helloMessage)

		const acceptMessage = createTextMessage({
			type: MessageType.ACCEPT_TRANSFER,
		})
		receiverConn.send(acceptMessage)

		const chunkAckMessage = createTextMessage({
			type: MessageType.CHUNK_ACK,
		})
		receiverConn.send(chunkAckMessage)
		receiverConn.send(chunkAckMessage)

		const garbageMessage = new ArrayBuffer(50)
		const garbageView = new Uint8Array(garbageMessage)
		for (let i = 0; i < garbageView.length; i++) {
			garbageView[i] = Math.floor(Math.random() * 256)
		}
		receiverConn.send(garbageMessage)

		await expect(sendPromise).rejects.toThrow()
	})
})
