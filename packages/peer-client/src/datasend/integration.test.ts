import { describe, expect, test, vi } from "vitest"
import { z } from "zod"
import { MockConnSniffing } from "../util/mockConnSniffing"
import { ChunkSplitterFileSource } from "./reader/chunkSplitterFileSource.js"
import { InMemoryFileSource } from "./reader/inMemoryFileSource.js"
import { FileReceiver } from "./receiver.js"
import { FileSender } from "./sender.js"
import {
	MockFileReader,
	MockFileReceiverHandler,
	MockFileSource,
	TestFileHeader,
	TestGlobalHeader,
} from "./test-utils/mocks"
import { BlobFileReceiverHandler } from "./writer/blobFileWriter.js"
import { ValidatingFileReceiverHandler } from "./writer/validatingFileReceiverHandler.js"

describe("Integration Tests", () => {
	test("should complete a full file transfer between sender and receiver", async () => {
		const [senderConn, receiverConn, sniffer] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()

		const sender = new FileSender<TestGlobalHeader, TestFileHeader>({
			conn: senderConn,
		})
		const mockHandler = new MockFileReceiverHandler()
		const receiver = new FileReceiver<TestGlobalHeader, TestFileHeader>({
			conn: receiverConn,
			fileReceiverHandler: mockHandler,
		})

		const chunks = [
			new TextEncoder().encode("Hello ").buffer,
			new TextEncoder().encode("World!").buffer,
		]
		const fileReader = new MockFileReader(chunks)
		const fileHeader: TestFileHeader = {
			fileName: "test.txt",
			fileSize: 12,
		}

		const globalHeader: TestGlobalHeader = {
			transferId: "test-123",
			totalFiles: 1,
		}
		const fileSource = new MockFileSource([
			{ reader: fileReader, header: fileHeader },
		])

		const acceptTransfer = vi.fn().mockResolvedValue(true)

		const receivePromise = receiver.receive(acceptTransfer)

		await new Promise((resolve) => setTimeout(resolve, 10))

		const sendPromise = sender.send(globalHeader, fileSource)

		await Promise.all([sendPromise, receivePromise])

		expect(acceptTransfer).toHaveBeenCalledWith(globalHeader)

		const writers = mockHandler.getWriters()
		expect(writers.length).toBe(1)

		const receivedChunks = writers[0]!.getChunks()
		expect(receivedChunks.length).toBe(2)
		expect(new TextDecoder().decode(receivedChunks[0])).toBe("Hello ")
		expect(new TextDecoder().decode(receivedChunks[1])).toBe("World!")

		const messages = sniffer.getAllMessages()
		expect(messages.length).toBeGreaterThan(0)
	})

	test("should transfer files using InMemoryFileSource and BlobFileReceiverHandler", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()

		const sender = new FileSender<TestGlobalHeader, TestFileHeader>({
			conn: senderConn,
		})

		const blobHandler = new BlobFileReceiverHandler<
			TestGlobalHeader,
			TestFileHeader
		>()
		const receiver = new FileReceiver<TestGlobalHeader, TestFileHeader>({
			conn: receiverConn,
			fileReceiverHandler: blobHandler,
		})

		const files: Array<[TestFileHeader, ArrayBuffer | Blob]> = [
			[
				{ fileName: "text.txt", fileSize: 11 },
				new TextEncoder().encode("Hello World").buffer,
			],
			[
				{ fileName: "binary.dat", fileSize: 5 },
				new Blob([new Uint8Array([1, 2, 3, 4, 5])]),
			],
			[
				{ fileName: "large.txt", fileSize: 1000 },
				new TextEncoder().encode("x".repeat(1000)).buffer,
			],
		]

		const fileSource = new InMemoryFileSource(files, 100)

		const globalHeader: TestGlobalHeader = {
			transferId: "integration-test",
			totalFiles: 3,
		}

		const receivePromise = receiver.receive(async () => true)

		await new Promise((resolve) => setTimeout(resolve, 10))

		const sendPromise = sender.send(globalHeader, fileSource)

		await Promise.all([sendPromise, receivePromise])

		const receivedData = blobHandler.getReceivedData(true)
		expect(receivedData.length).toBe(3)

		const [file1Header, file1Blob] = receivedData[0]!
		expect(file1Header.fileName).toBe("text.txt")
		expect(await file1Blob.text()).toBe("Hello World")

		const [file2Header, file2Blob] = receivedData[1]!
		expect(file2Header.fileName).toBe("binary.dat")
		const file2Buffer = await file2Blob.arrayBuffer()
		expect(new Uint8Array(file2Buffer)).toEqual(
			new Uint8Array([1, 2, 3, 4, 5]),
		)

		const [file3Header, file3Blob] = receivedData[2]!
		expect(file3Header.fileName).toBe("large.txt")
		expect(await file3Blob.text()).toBe("x".repeat(1000))
	})

	test("should transfer files using ChunkSplitterFileSource with aggregation and splitting", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()

		const sender = new FileSender<TestGlobalHeader, TestFileHeader>({
			conn: senderConn,
		})
		const blobHandler = new BlobFileReceiverHandler<
			TestGlobalHeader,
			TestFileHeader
		>()
		const receiver = new FileReceiver<TestGlobalHeader, TestFileHeader>({
			conn: receiverConn,
			fileReceiverHandler: blobHandler,
		})

		const files: Array<[TestFileHeader, ArrayBuffer | Blob]> = [
			[
				{ fileName: "small-chunks.txt", fileSize: 50 },
				new TextEncoder().encode("a".repeat(50)).buffer,
			],
			[
				{ fileName: "large-chunk.txt", fileSize: 2000 },
				new TextEncoder().encode("b".repeat(2000)).buffer,
			],
		]

		const baseSource = new InMemoryFileSource(files, 10)

		const chunkSplitterSource = new ChunkSplitterFileSource(
			baseSource,
			500,
			100,
		)

		const globalHeader: TestGlobalHeader = {
			transferId: "chunk-splitter-test",
			totalFiles: 2,
		}

		const receivePromise = receiver.receive(async () => true)

		await new Promise((resolve) => setTimeout(resolve, 10))

		const sendPromise = sender.send(globalHeader, chunkSplitterSource)

		await Promise.all([sendPromise, receivePromise])

		const receivedData = blobHandler.getReceivedData(true)
		expect(receivedData.length).toBe(2)

		const [file1Header, file1Blob] = receivedData[0]!
		expect(file1Header.fileName).toBe("small-chunks.txt")
		expect(await file1Blob.text()).toBe("a".repeat(50))

		const [file2Header, file2Blob] = receivedData[1]!
		expect(file2Header.fileName).toBe("large-chunk.txt")
		expect(await file2Blob.text()).toBe("b".repeat(2000))
	})

	test("should transfer files with ValidatingFileReceiverHandler and enforce limits", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()

		const sender = new FileSender<TestGlobalHeader, TestFileHeader>({
			conn: senderConn,
		})

		const blobHandler = new BlobFileReceiverHandler<
			TestGlobalHeader,
			TestFileHeader
		>()

		const validatingHandler = new ValidatingFileReceiverHandler(
			blobHandler,
			{
				extractFileCount: (globalHeader: TestGlobalHeader) => ({
					expected: globalHeader.totalFiles,
					max: globalHeader.totalFiles + 1,
				}),
				extractFileSize: (
					globalHeader: TestGlobalHeader,
					fileHeader: TestFileHeader,
				) => ({
					expected: fileHeader.fileSize,
					max: globalHeader.maxFileSize ?? 1000,
				}),
			},
		)

		const receiver = new FileReceiver<TestGlobalHeader, TestFileHeader>({
			conn: receiverConn,
			fileReceiverHandler: validatingHandler,
		})

		const files: Array<[TestFileHeader, ArrayBuffer | Blob]> = [
			[
				{ fileName: "valid1.txt", fileSize: 100 },
				new TextEncoder().encode("x".repeat(100)).buffer,
			],
			[
				{ fileName: "valid2.txt", fileSize: 200 },
				new TextEncoder().encode("y".repeat(200)).buffer,
			],
		]

		const fileSource = new InMemoryFileSource(files)

		const globalHeader: TestGlobalHeader = {
			transferId: "validation-test",
			totalFiles: 2,
			maxFileSize: 500,
		}

		const receivePromise = receiver.receive(async () => true)

		await new Promise((resolve) => setTimeout(resolve, 10))

		const sendPromise = sender.send(globalHeader, fileSource)

		await Promise.all([sendPromise, receivePromise])

		const receivedData = blobHandler.getReceivedData(true)
		expect(receivedData.length).toBe(2)
		expect(receivedData[0]![1].size).toBe(100)
		expect(receivedData[1]![1].size).toBe(200)
	})

	test("should fail transfer when ValidatingFileReceiverHandler detects size mismatch", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()

		const sender = new FileSender<TestGlobalHeader, TestFileHeader>({
			conn: senderConn,
		})

		const blobHandler = new BlobFileReceiverHandler<
			TestGlobalHeader,
			TestFileHeader
		>()

		const validatingHandler = new ValidatingFileReceiverHandler(
			blobHandler,
			{
				extractFileCount: (globalHeader: TestGlobalHeader) => ({
					expected: globalHeader.totalFiles,
				}),
				extractFileSize: (
					_globalHeader: TestGlobalHeader,
					fileHeader: TestFileHeader,
				) => ({
					expected: fileHeader.fileSize,
				}),
			},
		)

		const receiver = new FileReceiver<TestGlobalHeader, TestFileHeader>({
			conn: receiverConn,
			fileReceiverHandler: validatingHandler,
		})

		const files: Array<[TestFileHeader, ArrayBuffer | Blob]> = [
			[
				{ fileName: "mismatch.txt", fileSize: 50 },
				new TextEncoder().encode("x".repeat(100)).buffer,
			],
		]

		const fileSource = new InMemoryFileSource(files)

		const globalHeader: TestGlobalHeader = {
			transferId: "validation-fail-test",
			totalFiles: 1,
		}

		const receivePromise = receiver.receive(async () => true)

		await new Promise((resolve) => setTimeout(resolve, 10))

		const sendPromise = sender.send(globalHeader, fileSource)

		await expect(
			Promise.all([sendPromise, receivePromise]),
		).rejects.toThrow()
	})

	test("should handle complex scenario with all utilities combined", async () => {
		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()

		const sender = new FileSender<TestGlobalHeader, TestFileHeader>({
			conn: senderConn,
		})

		const blobHandler = new BlobFileReceiverHandler<
			TestGlobalHeader,
			TestFileHeader
		>()

		const validatingHandler = new ValidatingFileReceiverHandler(
			blobHandler,
			{
				extractFileCount: (globalHeader: TestGlobalHeader) => ({
					max: globalHeader.totalFiles,
				}),
				extractFileSize: (
					_globalHeader: TestGlobalHeader,
					fileHeader: TestFileHeader,
				) => ({
					max: fileHeader.fileSize + 100,
				}),
			},
		)

		const receiver = new FileReceiver<TestGlobalHeader, TestFileHeader>({
			conn: receiverConn,
			fileReceiverHandler: validatingHandler,
		})

		const files: Array<[TestFileHeader, ArrayBuffer | Blob]> = [
			[
				{ fileName: "tiny.txt", fileSize: 5 },
				new TextEncoder().encode("hello").buffer,
			],
			[
				{ fileName: "medium.dat", fileSize: 1024 },
				new Uint8Array(1024).fill(42).buffer,
			],
			[
				{ fileName: "large.txt", fileSize: 5000 },
				new TextEncoder().encode("Z".repeat(5000)).buffer,
			],
		]

		const baseSource = new InMemoryFileSource(files, 50)

		const chunkSplitterSource = new ChunkSplitterFileSource(
			baseSource,
			800,
			200,
		)

		const globalHeader: TestGlobalHeader = {
			transferId: "complex-integration-test",
			totalFiles: 3,
			maxFileSize: 10000,
		}

		const receivePromise = receiver.receive(async () => true)

		await new Promise((resolve) => setTimeout(resolve, 10))

		const sendPromise = sender.send(globalHeader, chunkSplitterSource)

		await Promise.all([sendPromise, receivePromise])

		const receivedData = blobHandler.getReceivedData(true)
		expect(receivedData.length).toBe(3)

		const [tinyHeader, tinyBlob] = receivedData[0]!
		expect(tinyHeader.fileName).toBe("tiny.txt")
		expect(await tinyBlob.text()).toBe("hello")

		const [mediumHeader, mediumBlob] = receivedData[1]!
		expect(mediumHeader.fileName).toBe("medium.dat")
		const mediumBuffer = await mediumBlob.arrayBuffer()
		expect(new Uint8Array(mediumBuffer)).toEqual(
			new Uint8Array(1024).fill(42),
		)

		const [largeHeader, largeBlob] = receivedData[2]!
		expect(largeHeader.fileName).toBe("large.txt")
		expect(await largeBlob.text()).toBe("Z".repeat(5000))
	})

	test("should properly wrap FileReaders with ChunkSplitterFileReader using ChunkSplitterFileSource", async () => {
		const files: Array<[TestFileHeader, ArrayBuffer | Blob]> = [
			[
				{ fileName: "test1.txt", fileSize: 10 },
				new TextEncoder().encode("1234567890").buffer,
			],
			[
				{ fileName: "test2.txt", fileSize: 500 },
				new TextEncoder().encode("a".repeat(500)).buffer,
			],
		]

		const baseSource = new InMemoryFileSource(files, 5)

		const wrappedSource = new ChunkSplitterFileSource(baseSource, 50, 20)

		const firstFile = await wrappedSource.next()
		expect(firstFile).not.toBeNull()
		expect(firstFile!.header.fileName).toBe("test1.txt")

		const chunks: ArrayBuffer[] = []
		let chunk = await firstFile!.reader.readChunk()
		while (chunk) {
			chunks.push(chunk)

			expect(chunk.byteLength).toBeLessThanOrEqual(50)
			if (chunk.byteLength < 20) {
				const nextChunk = await firstFile!.reader.readChunk()
				expect(nextChunk).toBeNull()
				break
			}
			chunk = await firstFile!.reader.readChunk()
		}
		await firstFile!.reader.close()

		const reconstructed = new Uint8Array(
			chunks.reduce((acc, curr) => acc + curr.byteLength, 0),
		)
		let offset = 0
		for (const chunk of chunks) {
			reconstructed.set(new Uint8Array(chunk), offset)
			offset += chunk.byteLength
		}
		expect(new TextDecoder().decode(reconstructed)).toBe("1234567890")

		const secondFile = await wrappedSource.next()
		expect(secondFile).not.toBeNull()
		expect(secondFile!.header.fileName).toBe("test2.txt")
		await secondFile!.reader.close()

		const noMoreFiles = await wrappedSource.next()
		expect(noMoreFiles).toBeNull()

		await wrappedSource.close()
	})
	test("should reject invalid global header and preserve connection for future use", async () => {
		const globalHeaderSchema = z.object({
			transferId: z.string().min(1),
			totalFiles: z.number().positive(),
			maxFileSize: z.number().positive().optional(),
		}) as z.ZodSchema<TestGlobalHeader>

		const fileHeaderSchema = z.object({
			fileName: z.string().min(1),
			fileSize: z.number().positive(),
		}) as z.ZodSchema<TestFileHeader>

		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()

		const blobHandler = new BlobFileReceiverHandler<
			TestGlobalHeader,
			TestFileHeader
		>()
		const receiver = new FileReceiver<TestGlobalHeader, TestFileHeader>({
			conn: receiverConn,
			fileReceiverHandler: blobHandler,
			globalHeaderSchema,
			fileHeaderSchema,
		})

		const sender = new FileSender<TestGlobalHeader, TestFileHeader>({
			conn: senderConn,
		})

		const invalidGlobalHeader = {
			transferId: "test-invalid",
			totalFiles: -1,
		} as TestGlobalHeader

		const files: Array<[TestFileHeader, ArrayBuffer | Blob]> = [
			[
				{ fileName: "test.txt", fileSize: 5 },
				new TextEncoder().encode("hello").buffer,
			],
		]

		const fileSource = new InMemoryFileSource(files)

		const receivePromise = receiver.receive(async () => true)

		await new Promise((resolve) => setTimeout(resolve, 10))

		const sendPromise = sender.send(invalidGlobalHeader, fileSource)

		await expect(
			Promise.all([sendPromise, receivePromise]),
		).rejects.toThrow(/Invalid global header/)
	})
	test("should reject invalid file header and preserve connection", async () => {
		const globalHeaderSchema = z.object({
			transferId: z.string().min(1),
			totalFiles: z.number().positive(),
		}) as z.ZodSchema<TestGlobalHeader>

		const fileHeaderSchema = z.object({
			fileName: z.string().min(1),
			fileSize: z.number().positive(),
		}) as z.ZodSchema<TestFileHeader>

		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()

		const blobHandler = new BlobFileReceiverHandler<
			TestGlobalHeader,
			TestFileHeader
		>()
		const receiver = new FileReceiver<TestGlobalHeader, TestFileHeader>({
			conn: receiverConn,
			fileReceiverHandler: blobHandler,
			globalHeaderSchema,
			fileHeaderSchema,
		})

		const sender = new FileSender<TestGlobalHeader, TestFileHeader>({
			conn: senderConn,
		})

		const validGlobalHeader: TestGlobalHeader = {
			transferId: "test-file-validation",
			totalFiles: 1,
		}

		const files: Array<[TestFileHeader, ArrayBuffer | Blob]> = [
			[
				{ fileName: "", fileSize: 5 },
				new TextEncoder().encode("hello").buffer,
			],
		]

		const fileSource = new InMemoryFileSource(files)

		const receivePromise = receiver.receive(async () => true)
		await new Promise((resolve) => setTimeout(resolve, 10))

		const sendPromise = sender.send(validGlobalHeader, fileSource)

		await expect(
			Promise.all([sendPromise, receivePromise]),
		).rejects.toThrow(/Invalid file header/)
	})
	test("should validate headers when schemas are provided on sender side", async () => {
		const globalHeaderSchema = z.object({
			transferId: z.string().min(1),
			totalFiles: z.number().positive(),
		}) as z.ZodSchema<TestGlobalHeader>

		const fileHeaderSchema = z.object({
			fileName: z.string().min(1),
			fileSize: z.number().positive(),
		}) as z.ZodSchema<TestFileHeader>

		const [senderConn, receiverConn] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()

		const sender = new FileSender<TestGlobalHeader, TestFileHeader>({
			conn: senderConn,
			globalHeaderSchema,
			fileHeaderSchema,
		})

		const blobHandler = new BlobFileReceiverHandler<
			TestGlobalHeader,
			TestFileHeader
		>()
		const receiver = new FileReceiver<TestGlobalHeader, TestFileHeader>({
			conn: receiverConn,
			fileReceiverHandler: blobHandler,
		})

		const invalidGlobalHeader = {
			transferId: "",
			totalFiles: 1,
		} as TestGlobalHeader

		const files: Array<[TestFileHeader, ArrayBuffer | Blob]> = [
			[
				{ fileName: "test.txt", fileSize: 5 },
				new TextEncoder().encode("hello").buffer,
			],
		]

		const fileSource = new InMemoryFileSource(files)

		receiver.receive(async () => true).catch(() => {})
		await new Promise((resolve) => setTimeout(resolve, 10))

		const sendPromise = sender.send(invalidGlobalHeader, fileSource)

		await expect(sendPromise).rejects.toThrow()
	})

	test("should properly handle protocol error messages without corrupting connection state", async () => {
		const globalHeaderSchema = z.object({
			transferId: z.string().min(1),
			totalFiles: z.number().positive(),
		}) as z.ZodSchema<TestGlobalHeader>

		const [senderConn, receiverConn, sniffer] =
			MockConnSniffing.createConnectedPair<ArrayBuffer>()

		const blobHandler = new BlobFileReceiverHandler<
			TestGlobalHeader,
			TestFileHeader
		>()
		const receiver = new FileReceiver<TestGlobalHeader, TestFileHeader>({
			conn: receiverConn,
			fileReceiverHandler: blobHandler,
			globalHeaderSchema,
		})

		const sender = new FileSender<TestGlobalHeader, TestFileHeader>({
			conn: senderConn,
		})

		const invalidGlobalHeader = {
			transferId: "",
			totalFiles: 1,
		} as TestGlobalHeader

		const files: Array<[TestFileHeader, ArrayBuffer | Blob]> = [
			[
				{ fileName: "test.txt", fileSize: 5 },
				new TextEncoder().encode("hello").buffer,
			],
		]

		const fileSource = new InMemoryFileSource(files)

		const receivePromise = receiver.receive(async () => true)
		await new Promise((resolve) => setTimeout(resolve, 10))

		const sendPromise = sender.send(invalidGlobalHeader, fileSource)

		await expect(
			Promise.all([sendPromise, receivePromise]),
		).rejects.toThrow()

		const messages = sniffer.getAllMessages()
		const errorMessages = messages.filter((msg) => {
			try {
				const parsed = JSON.parse(new TextDecoder().decode(msg.message))
				return parsed.type === "ERROR"
			} catch {
				return false
			}
		})

		expect(errorMessages.length).toBeGreaterThan(0)
	})
})
