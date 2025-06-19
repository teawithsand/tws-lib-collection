import { describe, expect, test } from "vitest"
import { TextBufferEncoder } from "./textBufferEncoder"

describe("TextBufferEncoder", () => {
	const encoder = new TextBufferEncoder()

	test("should encode and decode empty string", () => {
		// Arrange
		const emptyString = ""
		const emptyBuffer = new ArrayBuffer(0)

		// Act
		const encodedFromBuffer = encoder.encode(emptyBuffer)
		const decodedToBuffer = encoder.decode(emptyString)

		// Assert
		expect(encodedFromBuffer).toBe("")
		expect(decodedToBuffer.byteLength).toBe(0)
	})

	test("should encode and decode basic ASCII text", () => {
		// Arrange
		const text = "Hello, World!"
		const expectedBuffer = new TextEncoder().encode(text).buffer

		// Act
		const encodedString = encoder.encode(expectedBuffer)
		const decodedBuffer = encoder.decode(text)

		// Assert
		expect(encodedString).toBe(text)
		expect(new Uint8Array(decodedBuffer)).toEqual(
			new Uint8Array(expectedBuffer),
		)
	})

	test("should handle Unicode characters correctly", () => {
		// Arrange
		const unicodeText = "Hello 世界! 🌍 Ñoël émoji: 😀🎉"
		const expectedBuffer = new TextEncoder().encode(unicodeText).buffer

		// Act
		const encodedString = encoder.encode(expectedBuffer)
		const decodedBuffer = encoder.decode(unicodeText)

		// Assert
		expect(encodedString).toBe(unicodeText)
		expect(new Uint8Array(decodedBuffer)).toEqual(
			new Uint8Array(expectedBuffer),
		)
	})

	test("should handle complex Unicode with various scripts", () => {
		// Arrange
		const complexUnicode =
			"العربية русский 中文 日本語 한국어 ελληνικά हिन्दी ไทย"
		const expectedBuffer = new TextEncoder().encode(complexUnicode).buffer

		// Act
		const encodedString = encoder.encode(expectedBuffer)
		const decodedBuffer = encoder.decode(complexUnicode)

		// Assert
		expect(encodedString).toBe(complexUnicode)
		expect(new Uint8Array(decodedBuffer)).toEqual(
			new Uint8Array(expectedBuffer),
		)
	})

	test("should handle special Unicode characters and symbols", () => {
		// Arrange
		const specialChars = "€£¥₹₽₨₩₪₫₡₦₨₪₫₡₦ ⚡⭐🎭🎨🎪🎯🎲"
		const expectedBuffer = new TextEncoder().encode(specialChars).buffer

		// Act
		const encodedString = encoder.encode(expectedBuffer)
		const decodedBuffer = encoder.decode(specialChars)

		// Assert
		expect(encodedString).toBe(specialChars)
		expect(new Uint8Array(decodedBuffer)).toEqual(
			new Uint8Array(expectedBuffer),
		)
	})

	test("should handle newlines and whitespace", () => {
		// Arrange
		const textWithWhitespace =
			"Line 1\nLine 2\r\nLine 3\tTabbed\n\n  Spaced  "
		const expectedBuffer = new TextEncoder().encode(
			textWithWhitespace,
		).buffer

		// Act
		const encodedString = encoder.encode(expectedBuffer)
		const decodedBuffer = encoder.decode(textWithWhitespace)

		// Assert
		expect(encodedString).toBe(textWithWhitespace)
		expect(new Uint8Array(decodedBuffer)).toEqual(
			new Uint8Array(expectedBuffer),
		)
	})

	test("should be reversible for all operations", () => {
		// Arrange
		const originalText = "Reversibility test: 可逆性测试 🔄⚡"

		// Act
		const buffer = encoder.decode(originalText)
		const reconstructedText = encoder.encode(buffer)

		// Assert
		expect(reconstructedText).toBe(originalText)
	})

	test("should handle large text correctly", () => {
		// Arrange
		const largeText = "Unicode repeat: 测试🌍 ".repeat(1000)
		const expectedBuffer = new TextEncoder().encode(largeText).buffer

		// Act
		const encodedString = encoder.encode(expectedBuffer)
		const decodedBuffer = encoder.decode(largeText)

		// Assert
		expect(encodedString).toBe(largeText)
		expect(new Uint8Array(decodedBuffer)).toEqual(
			new Uint8Array(expectedBuffer),
		)
	})

	test("should produce consistent results for the same input", () => {
		// Arrange
		const testText = "Consistency test: 一致性测试 🔄"

		// Act
		const buffer1 = encoder.decode(testText)
		const buffer2 = encoder.decode(testText)
		const text1 = encoder.encode(buffer1)
		const text2 = encoder.encode(buffer2)

		// Assert
		expect(text1).toBe(text2)
		expect(new Uint8Array(buffer1)).toEqual(new Uint8Array(buffer2))
	})
})
