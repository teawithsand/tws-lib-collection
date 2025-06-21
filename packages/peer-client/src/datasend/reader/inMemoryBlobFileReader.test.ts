import { describe, expect, test } from "vitest"
import { InMemoryBlobFileReader } from "./inMemoryBlobFileReader.js"

describe("InMemoryBlobFileReader", () => {
	const createArrayBuffer = (content: string): ArrayBuffer => {
		return new TextEncoder().encode(content).buffer
	}

	const createBlob = (content: string): Blob => {
		return new Blob([content], { type: "text/plain" })
	}

	const arrayBufferToString = (buffer: ArrayBuffer): string => {
		return new TextDecoder().decode(buffer)
	}

	test("should read ArrayBuffer data in chunks", async () => {
		const data = createArrayBuffer("Hello World!")
		const reader = new InMemoryBlobFileReader([data], 5)

		const chunks: string[] = []
		let chunk = await reader.readChunk()
		while (chunk) {
			chunks.push(arrayBufferToString(chunk))
			chunk = await reader.readChunk()
		}

		expect(chunks).toEqual(["Hello", " Worl", "d!"])
	})

	test("should read Blob data in chunks", async () => {
		const blob = createBlob("Hello World!")
		const reader = new InMemoryBlobFileReader([blob], 5)

		const chunks: string[] = []
		let chunk = await reader.readChunk()
		while (chunk) {
			chunks.push(arrayBufferToString(chunk))
			chunk = await reader.readChunk()
		}

		expect(chunks).toEqual(["Hello", " Worl", "d!"])
	})

	test("should handle mixed ArrayBuffer and Blob data", async () => {
		const arrayBuffer = createArrayBuffer("Hello ")
		const blob = createBlob("World!")
		const reader = new InMemoryBlobFileReader([arrayBuffer, blob], 4)

		const chunks: string[] = []
		let chunk = await reader.readChunk()
		while (chunk) {
			chunks.push(arrayBufferToString(chunk))
			chunk = await reader.readChunk()
		}

		expect(chunks.join("")).toBe("Hello World!")
	})

	test("should use default chunk size when not specified", async () => {
		const largeContent = "a".repeat(100000)
		const data = createArrayBuffer(largeContent)
		const reader = new InMemoryBlobFileReader([data])

		const chunk = await reader.readChunk()

		expect(chunk).not.toBeNull()
		expect(chunk!.byteLength).toBe(65536)
	})

	test("should handle empty data array", async () => {
		const reader = new InMemoryBlobFileReader([])

		const chunk = await reader.readChunk()

		expect(chunk).toBeNull()
	})

	test("should handle empty ArrayBuffer", async () => {
		const emptyBuffer = new ArrayBuffer(0)
		const normalBuffer = createArrayBuffer("data")
		const reader = new InMemoryBlobFileReader(
			[emptyBuffer, normalBuffer],
			10,
		)

		const chunk1 = await reader.readChunk()
		const chunk2 = await reader.readChunk()
		const chunk3 = await reader.readChunk()

		expect(chunk1!.byteLength).toBe(0)
		expect(arrayBufferToString(chunk2!)).toBe("data")
		expect(chunk3).toBeNull()
	})

	test("should handle empty Blob", async () => {
		const emptyBlob = new Blob([])
		const normalBlob = createBlob("data")
		const reader = new InMemoryBlobFileReader([emptyBlob, normalBlob], 10)

		const chunk1 = await reader.readChunk()
		const chunk2 = await reader.readChunk()
		const chunk3 = await reader.readChunk()

		expect(chunk1!.byteLength).toBe(0)
		expect(arrayBufferToString(chunk2!)).toBe("data")
		expect(chunk3).toBeNull()
	})

	test("should handle single byte chunk size", async () => {
		const data = createArrayBuffer("abc")
		const reader = new InMemoryBlobFileReader([data], 1)

		const chunks: string[] = []
		let chunk = await reader.readChunk()
		while (chunk) {
			chunks.push(arrayBufferToString(chunk))
			chunk = await reader.readChunk()
		}

		expect(chunks).toEqual(["a", "b", "c"])
	})

	test("should handle chunk size larger than data", async () => {
		const data = createArrayBuffer("small")
		const reader = new InMemoryBlobFileReader([data], 1000)

		const chunk = await reader.readChunk()
		const nextChunk = await reader.readChunk()

		expect(arrayBufferToString(chunk!)).toBe("small")
		expect(nextChunk).toBeNull()
	})

	test("should handle multiple small items", async () => {
		const items = [
			createArrayBuffer("a"),
			createBlob("b"),
			createArrayBuffer("c"),
			createBlob("d"),
		]
		const reader = new InMemoryBlobFileReader(items, 10)

		const chunks: string[] = []
		let chunk = await reader.readChunk()
		while (chunk) {
			chunks.push(arrayBufferToString(chunk))
			chunk = await reader.readChunk()
		}

		expect(chunks).toEqual(["a", "b", "c", "d"])
	})

	test("should reset state when closed", async () => {
		const data = createArrayBuffer("Hello World!")
		const reader = new InMemoryBlobFileReader([data], 5)

		const chunk1 = await reader.readChunk()
		await reader.close()
		const chunk2 = await reader.readChunk()

		expect(arrayBufferToString(chunk1!)).toBe("Hello")
		expect(chunk2).toBeNull()
	})

	test("should handle multiple close calls", async () => {
		const data = createArrayBuffer("data")
		const reader = new InMemoryBlobFileReader([data])

		await reader.close()
		await reader.close()
		await reader.close()
		expect(await reader.readChunk()).toBeNull()
	})

	test("should handle exact chunk size boundaries with ArrayBuffer", async () => {
		const data = createArrayBuffer("1234567890")
		const reader = new InMemoryBlobFileReader([data], 5)

		const chunks: string[] = []
		let chunk = await reader.readChunk()
		while (chunk) {
			chunks.push(arrayBufferToString(chunk))
			chunk = await reader.readChunk()
		}

		expect(chunks).toEqual(["12345", "67890"])
	})

	test("should handle exact chunk size boundaries with Blob", async () => {
		const blob = createBlob("1234567890")
		const reader = new InMemoryBlobFileReader([blob], 5)

		const chunks: string[] = []
		let chunk = await reader.readChunk()
		while (chunk) {
			chunks.push(arrayBufferToString(chunk))
			chunk = await reader.readChunk()
		}

		expect(chunks).toEqual(["12345", "67890"])
	})

	test("should handle large number of small items", async () => {
		const items = Array.from({ length: 100 }, (_, i) =>
			createArrayBuffer(i.toString()),
		)
		const reader = new InMemoryBlobFileReader(items, 50)

		const chunks: string[] = []
		let chunk = await reader.readChunk()
		while (chunk) {
			chunks.push(arrayBufferToString(chunk))
			chunk = await reader.readChunk()
		}

		const expectedContent = Array.from({ length: 100 }, (_, i) =>
			i.toString(),
		).join("")
		expect(chunks.join("")).toBe(expectedContent)
	})

	test("should handle binary data correctly", async () => {
		const binaryData = new Uint8Array([0, 1, 2, 3, 255, 254, 253, 252])
		const arrayBuffer = binaryData.buffer
		const reader = new InMemoryBlobFileReader([arrayBuffer], 4)

		const chunk1 = await reader.readChunk()
		const chunk2 = await reader.readChunk()
		const chunk3 = await reader.readChunk()

		expect(new Uint8Array(chunk1!)).toEqual(new Uint8Array([0, 1, 2, 3]))
		expect(new Uint8Array(chunk2!)).toEqual(
			new Uint8Array([255, 254, 253, 252]),
		)
		expect(chunk3).toBeNull()
	})
})
