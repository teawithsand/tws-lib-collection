import { describe, expect, test } from "vitest"
import { Blobs } from "./blob"

const text = "Hello, world!"
const encoder = new TextEncoder()
const arrayBuffer = encoder.encode(text).buffer

// Helper to create a Blob in Node.js (using Blob from global)
const createBlob = (data: string | ArrayBuffer) => {
	return new Blob([data])
}

describe("Blobs", () => {
	describe("blobToArrayBuffer", () => {
		test("converts Blob to ArrayBuffer (happy path)", async () => {
			// Arrange
			const blob = createBlob(arrayBuffer)
			// Act
			const result = await Blobs.blobToArrayBuffer(blob)
			// Assert
			expect(result).toBeInstanceOf(ArrayBuffer)
			expect(new Uint8Array(result)).toEqual(new Uint8Array(arrayBuffer))
		})

		test("throws error if Blob is not readable as ArrayBuffer", async () => {
			// Arrange
			const fakeBlob = { arrayBuffer: undefined } as unknown as Blob
			// Act & Assert
			await expect(Blobs.blobToArrayBuffer(fakeBlob)).rejects.toThrow()
		})
	})

	describe("blobToText", () => {
		test("converts Blob to text (happy path)", async () => {
			// Arrange
			const blob = createBlob(text)
			// Act
			const result = await Blobs.blobToText(blob)
			// Assert
			expect(result).toBe(text)
		})

		test("converts Blob to text via ArrayBuffer fallback", async () => {
			// Arrange
			const blob = createBlob(arrayBuffer)
			// Act
			const result = await Blobs.blobToText(blob)
			// Assert
			expect(result).toBe(text)
		})

		test("throws error if Blob is not readable as text", async () => {
			// Arrange
			const fakeBlob = {
				text: undefined,
				arrayBuffer: undefined,
			} as unknown as Blob
			// Act & Assert
			await expect(Blobs.blobToText(fakeBlob)).rejects.toThrow()
		})
	})
})
