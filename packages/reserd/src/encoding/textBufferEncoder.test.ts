import { describe, expect, test } from "vitest"
import { TextBufferEncoder } from "./textBufferEncoder"

describe("TextBufferEncoder", () => {
	const encoder = new TextBufferEncoder()

	test("should encode and decode empty string", () => {
		// Arrange
		const emptyString = ""
		const emptyBuffer = new ArrayBuffer(0)

		// Act
		const encodedBuffer = encoder.encode(emptyString)
		const decodedString = encoder.decode(emptyBuffer)

		// Assert
		expect(encodedBuffer.byteLength).toBe(0)
		expect(decodedString).toBe("")
	})

	test("should encode and decode basic ASCII text", () => {
		// Arrange
		const text = "Hello, World!"
		const expectedBuffer = new TextEncoder().encode(text).buffer

		// Act
		const encodedBuffer = encoder.encode(text)
		const decodedString = encoder.decode(expectedBuffer)

		// Assert
		expect(new Uint8Array(encodedBuffer)).toEqual(
			new Uint8Array(expectedBuffer),
		)
		expect(decodedString).toBe(text)
	})

	test("should handle Unicode characters correctly", () => {
		// Arrange
		const unicodeText = "Hello 世界! 🌍 Ñoël émoji: 😀🎉"
		const expectedBuffer = new TextEncoder().encode(unicodeText).buffer

		// Act
		const encodedBuffer = encoder.encode(unicodeText)
		const decodedString = encoder.decode(expectedBuffer)

		// Assert
		expect(new Uint8Array(encodedBuffer)).toEqual(
			new Uint8Array(expectedBuffer),
		)
		expect(decodedString).toBe(unicodeText)
	})

	test("should handle complex Unicode with various scripts", () => {
		// Arrange
		const complexUnicode =
			"العربية русский 中文 日本語 한국어 ελληνικά हिन्दी ไทย"
		const expectedBuffer = new TextEncoder().encode(complexUnicode).buffer

		// Act
		const encodedBuffer = encoder.encode(complexUnicode)
		const decodedString = encoder.decode(expectedBuffer)

		// Assert
		expect(new Uint8Array(encodedBuffer)).toEqual(
			new Uint8Array(expectedBuffer),
		)
		expect(decodedString).toBe(complexUnicode)
	})

	test("should handle special Unicode characters and symbols", () => {
		// Arrange
		const specialChars = "€£¥₹₽₨₩₪₫₡₦₨₪₫₡₦ ⚡⭐🎭🎨🎪🎯🎲"
		const expectedBuffer = new TextEncoder().encode(specialChars).buffer

		// Act
		const encodedBuffer = encoder.encode(specialChars)
		const decodedString = encoder.decode(expectedBuffer)

		// Assert
		expect(new Uint8Array(encodedBuffer)).toEqual(
			new Uint8Array(expectedBuffer),
		)
		expect(decodedString).toBe(specialChars)
	})

	test("should handle newlines and whitespace", () => {
		// Arrange
		const textWithWhitespace =
			"Line 1\nLine 2\r\nLine 3\tTabbed\n\n  Spaced  "
		const expectedBuffer = new TextEncoder().encode(
			textWithWhitespace,
		).buffer

		// Act
		const encodedBuffer = encoder.encode(textWithWhitespace)
		const decodedString = encoder.decode(expectedBuffer)

		// Assert
		expect(new Uint8Array(encodedBuffer)).toEqual(
			new Uint8Array(expectedBuffer),
		)
		expect(decodedString).toBe(textWithWhitespace)
	})

	test("should be reversible for all operations", () => {
		// Arrange
		const originalText = "Reversibility test: 可逆性测试 🔄⚡"

		// Act
		const buffer = encoder.encode(originalText)
		const reconstructedText = encoder.decode(buffer)

		// Assert
		expect(reconstructedText).toBe(originalText)
	})

	test("should handle large text correctly", () => {
		// Arrange
		const largeText = "Unicode repeat: 测试🌍 ".repeat(1000)
		const expectedBuffer = new TextEncoder().encode(largeText).buffer

		// Act
		const encodedBuffer = encoder.encode(largeText)
		const decodedString = encoder.decode(expectedBuffer)

		// Assert
		expect(new Uint8Array(encodedBuffer)).toEqual(
			new Uint8Array(expectedBuffer),
		)
		expect(decodedString).toBe(largeText)
	})

	test("should produce consistent results for the same input", () => {
		// Arrange
		const testText = "Consistency test: 一致性测试 🔄"

		// Act
		const buffer1 = encoder.encode(testText)
		const buffer2 = encoder.encode(testText)
		const text1 = encoder.decode(buffer1)
		const text2 = encoder.decode(buffer2)

		// Assert
		expect(text1).toBe(text2)
		expect(new Uint8Array(buffer1)).toEqual(new Uint8Array(buffer2))
	})
})
