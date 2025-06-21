import { describe, expect, test } from "vitest"
import { BlobFileReceiverHandler, BlobFileWriter } from "./blobFileWriter.js"

describe("BlobFileWriter", () => {
	test("should write chunks and create blob", async () => {
		const writer = new BlobFileWriter()
		const chunk1 = new TextEncoder().encode("Hello ")
		const chunk2 = new TextEncoder().encode("World!")

		await writer.writeChunk(chunk1)
		await writer.writeChunk(chunk2)
		await writer.close()

		const blob = writer.getBlob()
		const text = await blob.text()
		expect(text).toBe("Hello World!")
		expect(writer.closed).toBe(true)
	})

	test("should throw error when writing to closed writer", async () => {
		const writer = new BlobFileWriter()
		await writer.close()

		const chunk = new TextEncoder().encode("test")
		await expect(writer.writeChunk(chunk)).rejects.toThrow(
			"Cannot write to a closed file writer",
		)
	})

	test("should handle empty file", async () => {
		const writer = new BlobFileWriter()
		await writer.close()

		const blob = writer.getBlob()
		expect(blob.size).toBe(0)
		expect(writer.closed).toBe(true)
	})

	test("should create independent copies of chunks", async () => {
		const writer = new BlobFileWriter()
		const buffer = new ArrayBuffer(4)
		const view = new Uint8Array(buffer)
		view[0] = 65

		await writer.writeChunk(buffer)

		view[0] = 66

		await writer.close()
		const blob = writer.getBlob()
		const text = await blob.text()
		expect(text.charCodeAt(0)).toBe(65)
	})

	test("should aggregate chunks into single blob when byte threshold is reached", async () => {
		const writer = new BlobFileWriter()

		const chunkSize = 100 * 1024
		const numChunks = 12

		for (let i = 0; i < numChunks; i++) {
			const chunk = new ArrayBuffer(chunkSize)
			const view = new Uint8Array(chunk)

			view.fill(65 + (i % 26))
			await writer.writeChunk(chunk)
		}

		await writer.close()

		const blob = writer.getBlob()
		expect(blob.size).toBe(numChunks * chunkSize)
	})
})

describe("BlobFileReceiverHandler", () => {
	test("should create file writers and store blobs with global headers", async () => {
		const handler = new BlobFileReceiverHandler<string, string>()

		const writer1 = (await handler.createFileWriter(
			"global1",
			"file1",
			0,
		)) as BlobFileWriter
		const writer2 = (await handler.createFileWriter(
			"global2",
			"file2",
			1,
		)) as BlobFileWriter

		const chunk1 = new TextEncoder().encode("File 1")
		const chunk2 = new TextEncoder().encode("File 2")

		await writer1.writeChunk(chunk1)
		await writer2.writeChunk(chunk2)
		await writer1.close()
		await writer2.close()

		const receivedData = handler.getReceivedData()
		expect(receivedData).toHaveLength(2)

		const [fileHeader1, blob1] = receivedData[0]!
		const [fileHeader2, blob2] = receivedData[1]!

		expect(fileHeader1).toBe("file1")
		expect(fileHeader2).toBe("file2")

		const text1 = await blob1.text()
		const text2 = await blob2.text()
		expect(text1).toBe("File 1")
		expect(text2).toBe("File 2")
		expect(handler.fileWriterCount).toBe(2)

		expect(handler.getGlobalHeader(writer1)).toBe("global1")
		expect(handler.getGlobalHeader(writer2)).toBe("global2")
		expect(handler.getGlobalHeaderOrThrow(writer1)).toBe("global1")
		expect(handler.getGlobalHeaderOrThrow(writer2)).toBe("global2")
	})

	test("should return null for unknown writer in getGlobalHeader", async () => {
		const handler = new BlobFileReceiverHandler<string, string>()
		const unknownWriter = new BlobFileWriter()

		expect(handler.getGlobalHeader(unknownWriter)).toBeNull()
	})

	test("should throw error for unknown writer in getGlobalHeaderOrThrow", async () => {
		const handler = new BlobFileReceiverHandler<string, string>()
		const unknownWriter = new BlobFileWriter()

		expect(() => handler.getGlobalHeaderOrThrow(unknownWriter)).toThrow(
			"Global header not found for the specified writer",
		)
	})

	test("should allow getting received data without safe flag when writers are open", async () => {
		const handler = new BlobFileReceiverHandler<string, string>()

		const writer = await handler.createFileWriter("global", "file", 0)
		await writer.writeChunk(new TextEncoder().encode("test"))

		const receivedData = handler.getReceivedData(false)
		expect(receivedData).toHaveLength(1)

		const [fileHeader, blob] = receivedData[0]!
		expect(fileHeader).toBe("file")
		const text = await blob.text()
		expect(text).toBe("test")
	})

	test("should throw error with safe flag when writers are not closed", async () => {
		const handler = new BlobFileReceiverHandler<string, string>()

		const writer = await handler.createFileWriter("global", "file", 0)
		await writer.writeChunk(new TextEncoder().encode("test"))

		expect(() => handler.getReceivedData(true)).toThrow(
			"Cannot get received data safely: 1 file writer(s) are still open",
		)
	})

	test("should allow safe access when all writers are closed", async () => {
		const handler = new BlobFileReceiverHandler<string, string>()

		const writer = await handler.createFileWriter("global", "file", 0)
		await writer.writeChunk(new TextEncoder().encode("test"))
		await writer.close()

		const receivedData = handler.getReceivedData(true)
		expect(receivedData).toHaveLength(1)

		const [fileHeader, blob] = receivedData[0]!
		expect(fileHeader).toBe("file")
		const text = await blob.text()
		expect(text).toBe("test")
	})

	test("should handle multiple unclosed writers in safe mode", async () => {
		const handler = new BlobFileReceiverHandler<string, string>()

		await handler.createFileWriter("global1", "file1", 0)
		await handler.createFileWriter("global2", "file2", 1)
		const writer3 = await handler.createFileWriter("global3", "file3", 2)
		await writer3.close()

		expect(() => handler.getReceivedData(true)).toThrow(
			"Cannot get received data safely: 2 file writer(s) are still open",
		)
	})
})
