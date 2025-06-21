import { describe, expect, test } from "vitest"
import { ChunkSplitterFileReader } from "./chunkSplitterFileReader.js"
import { FileReader } from "./fileReader.js"

/**
 * Mock FileReader implementation for testing
 */
class MockFileReader implements FileReader {
	private chunks: ArrayBuffer[] = []
	private currentIndex = 0
	private closeCallCount = 0

	constructor(chunks: ArrayBuffer[]) {
		this.chunks = chunks
	}

	public readonly readChunk = async (): Promise<ArrayBuffer | null> => {
		if (this.currentIndex >= this.chunks.length) {
			return null
		}
		const chunk = this.chunks[this.currentIndex++]
		return chunk ?? null
	}

	public readonly close = async (): Promise<void> => {
		this.closeCallCount++
	}

	public readonly getCloseCallCount = (): number => {
		return this.closeCallCount
	}
}

describe("ChunkSplitterFileReader", () => {
	const createArrayBuffer = (content: string): ArrayBuffer => {
		return new TextEncoder().encode(content).buffer
	}

	const arrayBufferToString = (buffer: ArrayBuffer): string => {
		return new TextDecoder().decode(buffer)
	}

	test("should return chunks smaller than min size aggregated", async () => {
		const smallChunk1 = createArrayBuffer("ab")
		const smallChunk2 = createArrayBuffer("cd")
		const smallChunk3 = createArrayBuffer("ef")
		const mockReader = new MockFileReader([
			smallChunk1,
			smallChunk2,
			smallChunk3,
		])
		const splitter = new ChunkSplitterFileReader(mockReader, 10, 5)

		const result = await splitter.readChunk()
		const nextResult = await splitter.readChunk()

		expect(result).not.toBeNull()
		expect(arrayBufferToString(result!)).toBe("abcdef")
		expect(result!.byteLength).toBe(6)
		expect(nextResult).toBeNull()
	})

	test("should return chunks larger than max size split", async () => {
		const largeChunk = createArrayBuffer(
			"this is a very long chunk that should be split",
		)
		const mockReader = new MockFileReader([largeChunk])
		const splitter = new ChunkSplitterFileReader(mockReader, 10, 5)

		const chunks: string[] = []
		let chunk = await splitter.readChunk()
		while (chunk) {
			chunks.push(arrayBufferToString(chunk))
			chunk = await splitter.readChunk()
		}

		expect(chunks.length).toBeGreaterThan(1)
		expect(chunks.join("")).toBe(
			"this is a very long chunk that should be split",
		)
		chunks.forEach((c) => expect(c.length).toBeLessThanOrEqual(10))
	})

	test("should handle chunks within min-max range unchanged", async () => {
		const goodSizeChunk = createArrayBuffer("good size")
		const mockReader = new MockFileReader([goodSizeChunk])
		const splitter = new ChunkSplitterFileReader(mockReader, 15, 5)

		const result = await splitter.readChunk()

		expect(result).not.toBeNull()
		expect(arrayBufferToString(result!)).toBe("good size")
		expect(result!.byteLength).toBe(9)
	})

	test("should aggregate multiple small chunks until min size is reached", async () => {
		const chunks = [
			createArrayBuffer("a"),
			createArrayBuffer("b"),
			createArrayBuffer("c"),
			createArrayBuffer("d"),
			createArrayBuffer("e"),
		]
		const mockReader = new MockFileReader(chunks)
		const splitter = new ChunkSplitterFileReader(mockReader, 10, 4)

		const result1 = await splitter.readChunk()
		const result2 = await splitter.readChunk()

		expect(result1).not.toBeNull()
		expect(arrayBufferToString(result1!)).toBe("abcd")
		expect(result1!.byteLength).toBe(4)
		expect(result2).not.toBeNull()
		expect(arrayBufferToString(result2!)).toBe("e")
		expect(result2!.byteLength).toBe(1)
	})

	test("should handle mixed small and large chunks", async () => {
		const smallChunk1 = createArrayBuffer("ab")
		const largeChunk = createArrayBuffer("this is very long content here")
		const smallChunk2 = createArrayBuffer("cd")
		const mockReader = new MockFileReader([
			smallChunk1,
			largeChunk,
			smallChunk2,
		])
		const splitter = new ChunkSplitterFileReader(mockReader, 10, 4)

		const chunks: string[] = []
		let chunk = await splitter.readChunk()
		while (chunk) {
			chunks.push(arrayBufferToString(chunk))
			chunk = await splitter.readChunk()
		}

		const reconstructed = chunks.join("")
		expect(reconstructed).toBe("abthis is very long content herecd")
		chunks.forEach((c) => expect(c.length).toBeLessThanOrEqual(10))
	})

	test("should return null when underlying reader is exhausted", async () => {
		const mockReader = new MockFileReader([])
		const splitter = new ChunkSplitterFileReader(mockReader, 10, 5)

		const result = await splitter.readChunk()

		expect(result).toBeNull()
	})

	test("should handle empty chunks from underlying reader", async () => {
		const emptyChunk = new ArrayBuffer(0)
		const normalChunk = createArrayBuffer("normal")
		const mockReader = new MockFileReader([emptyChunk, normalChunk])
		const splitter = new ChunkSplitterFileReader(mockReader, 10, 5)

		const chunk1 = await splitter.readChunk()
		const chunk2 = await splitter.readChunk()
		const chunk3 = await splitter.readChunk()

		expect(chunk1!.byteLength).toBe(0)
		expect(arrayBufferToString(chunk2!)).toBe("normal")
		expect(chunk3).toBeNull()
	})

	test("should delegate close to underlying reader", async () => {
		const mockReader = new MockFileReader([])
		const splitter = new ChunkSplitterFileReader(mockReader, 10, 5)

		await splitter.close()

		expect(mockReader.getCloseCallCount()).toBe(1)
	})

	test("should clean up internal state on close", async () => {
		const largeChunk = createArrayBuffer("large chunk that will be split")
		const mockReader = new MockFileReader([largeChunk])
		const splitter = new ChunkSplitterFileReader(mockReader, 5, 3)

		await splitter.readChunk()
		await splitter.close()
		const result = await splitter.readChunk()

		expect(result).toBeNull()
	})

	test("should handle single byte max chunk size", async () => {
		const chunk = createArrayBuffer("abc")
		const mockReader = new MockFileReader([chunk])
		const splitter = new ChunkSplitterFileReader(mockReader, 1, 1)

		const chunks: string[] = []
		let chunk_ = await splitter.readChunk()
		while (chunk_) {
			chunks.push(arrayBufferToString(chunk_))
			chunk_ = await splitter.readChunk()
		}

		expect(chunks).toEqual(["a", "b", "c"])
	})

	test("should validate min and max chunk sizes", () => {
		const mockReader = new MockFileReader([])

		expect(() => new ChunkSplitterFileReader(mockReader, 5, 10)).toThrow(
			"minChunkSize cannot be greater than maxChunkSize",
		)
	})

	test("should use default min chunk size when not specified", async () => {
		const smallChunks = [createArrayBuffer("a"), createArrayBuffer("b")]
		const mockReader = new MockFileReader(smallChunks)
		const splitter = new ChunkSplitterFileReader(mockReader, 12)

		const result = await splitter.readChunk()

		expect(result).not.toBeNull()
		expect(arrayBufferToString(result!)).toBe("ab")
		expect(result!.byteLength).toBe(2)
	})

	test("should handle aggregation exceeding max size", async () => {
		const chunks = [
			createArrayBuffer("abcd"),
			createArrayBuffer("efgh"),
			createArrayBuffer("ijkl"),
		]
		const mockReader = new MockFileReader(chunks)
		const splitter = new ChunkSplitterFileReader(mockReader, 10, 6)

		const result1 = await splitter.readChunk()
		const result2 = await splitter.readChunk()

		expect(result1).not.toBeNull()
		expect(arrayBufferToString(result1!)).toBe("abcdefgh")
		expect(result1!.byteLength).toBe(8)
		expect(result2).not.toBeNull()
		expect(arrayBufferToString(result2!)).toBe("ijkl")
		expect(result2!.byteLength).toBe(4)
	})
})
