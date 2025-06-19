import { describe, expect, test } from "vitest"
import { JsonEncoder } from "./jsonEncoder"

describe("JsonEncoder", () => {
	test("should encode and decode objects correctly", () => {
		// Arrange
		const encoder = new JsonEncoder<{
			name: string
			age: number
			active: boolean
		}>()
		const testObject = { name: "John Doe", age: 30, active: true }

		// Act
		const encoded = encoder.encode(testObject)
		const decoded = encoder.decode(encoded)

		// Assert
		expect(encoded).toBe('{"name":"John Doe","age":30,"active":true}')
		expect(decoded).toEqual(testObject)
	})
})
