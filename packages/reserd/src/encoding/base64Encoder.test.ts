import { describe, expect, test } from "vitest"
import { Base64Encoder } from "./base64Encoder"

describe("Base64Encoder", () => {
	const encoder = new Base64Encoder()

	test("should encode and decode empty ArrayBuffer", () => {
		// Arrange
		const emptyBuffer = new ArrayBuffer(0)

		// Act
		const encoded = encoder.encode(emptyBuffer)
		const decoded = encoder.decode(encoded)

		// Assert
		expect(encoded).toBe("")
		expect(decoded.byteLength).toBe(0)
	})

	test("should encode and decode basic ASCII text", () => {
		// Arrange
		const text = "Hello, World!"
		const buffer = new TextEncoder().encode(text).buffer

		// Act
		const encoded = encoder.encode(buffer)
		const decoded = encoder.decode(encoded)
		const decodedText = new TextDecoder().decode(decoded)

		// Assert
		expect(decodedText).toBe(text)
		expect(encoded).toBe("SGVsbG8sIFdvcmxkIQ==")
	})

	test("should handle Unicode characters correctly", () => {
		// Arrange
		const unicodeText = "Hello 世界! 🌍 Ñoël émoji: 😀🎉"
		const buffer = new TextEncoder().encode(unicodeText).buffer

		// Act
		const encoded = encoder.encode(buffer)
		const decoded = encoder.decode(encoded)
		const decodedText = new TextDecoder().decode(decoded)

		// Assert
		expect(decodedText).toBe(unicodeText)
	})

	test("should handle complex Unicode with various scripts", () => {
		// Arrange
		const complexUnicode =
			"العربية русский 中文 日本語 한국어 ελληνικά हिन्दी ไทย"
		const buffer = new TextEncoder().encode(complexUnicode).buffer

		// Act
		const encoded = encoder.encode(buffer)
		const decoded = encoder.decode(encoded)
		const decodedText = new TextDecoder().decode(decoded)

		// Assert
		expect(decodedText).toBe(complexUnicode)
	})

	test("should handle binary data with all byte values", () => {
		// Arrange
		const binaryData = new Uint8Array(256)
		for (let i = 0; i < 256; i++) {
			binaryData[i] = i
		}
		const buffer = binaryData.buffer

		// Act
		const encoded = encoder.encode(buffer)
		const decoded = encoder.decode(encoded)
		const decodedArray = new Uint8Array(decoded)

		// Assert
		expect(decodedArray.length).toBe(256)
		for (let i = 0; i < 256; i++) {
			expect(decodedArray[i]).toBe(i)
		}
	})

	test("should handle large buffers", () => {
		// Arrange
		const largeData = new Uint8Array(10000)
		for (let i = 0; i < largeData.length; i++) {
			largeData[i] = i % 256
		}
		const buffer = largeData.buffer

		// Act
		const encoded = encoder.encode(buffer)
		const decoded = encoder.decode(encoded)
		const decodedArray = new Uint8Array(decoded)

		// Assert
		expect(decodedArray.length).toBe(10000)
		for (let i = 0; i < 1000; i++) {
			// Check first 1000 bytes
			expect(decodedArray[i]).toBe(i % 256)
		}
	})

	test("should produce consistent results for the same input", () => {
		// Arrange
		const testData = "Consistency test with Unicode: 测试 🔄"
		const buffer = new TextEncoder().encode(testData).buffer

		// Act
		const encoded1 = encoder.encode(buffer)
		const encoded2 = encoder.encode(buffer)
		const decoded1 = encoder.decode(encoded1)
		const decoded2 = encoder.decode(encoded2)

		// Assert
		expect(encoded1).toBe(encoded2)
		expect(new TextDecoder().decode(decoded1)).toBe(
			new TextDecoder().decode(decoded2),
		)
	})
})
