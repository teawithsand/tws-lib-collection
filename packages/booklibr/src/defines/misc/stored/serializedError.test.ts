import { describe, expect, test } from "vitest"
import {
	SerializedErrorSerializer,
	StoredSerializedErrorV1,
} from "./serializedError"

describe("SerializedErrorSerializer", () => {
	test("should serialize and deserialize correctly (round-trip)", () => {
		const input = { message: "Something went wrong" }
		const stored = SerializedErrorSerializer.serialize(input)
		expect(stored).toEqual({ version: 1, message: "Something went wrong" })
		const output = SerializedErrorSerializer.deserialize(stored)
		expect(output).toEqual(input)
	})

	test("should handle empty message", () => {
		const input = { message: "" }
		const stored = SerializedErrorSerializer.serialize(input)
		expect(stored).toEqual({ version: 1, message: "" })
		const output = SerializedErrorSerializer.deserialize(stored)
		expect(output).toEqual(input)
	})

	test("should handle long message", () => {
		const longMsg = "x".repeat(10000)
		const input = { message: longMsg }
		const stored = SerializedErrorSerializer.serialize(input)
		expect(stored).toEqual({ version: 1, message: longMsg })
		const output = SerializedErrorSerializer.deserialize(stored)
		expect(output).toEqual(input)
	})

	test("should throw on missing message field", () => {
		const stored = { version: 1 } as any
		expect(() => SerializedErrorSerializer.deserialize(stored)).toThrow()
	})

	test("should throw on wrong version", () => {
		const stored = { version: 2, message: "err" } as any
		expect(() => SerializedErrorSerializer.deserialize(stored)).toThrow()
	})

	test("should throw on non-string message", () => {
		const stored = { version: 1, message: 123 } as any
		expect(() => SerializedErrorSerializer.deserialize(stored)).toThrow()
	})

	test("should throw on completely invalid input", () => {
		expect(() => SerializedErrorSerializer.deserialize(null)).toThrow()
		expect(() => SerializedErrorSerializer.deserialize(undefined)).toThrow()
		expect(() => SerializedErrorSerializer.deserialize(42)).toThrow()
		expect(() => SerializedErrorSerializer.deserialize({})).toThrow()
	})

	test("should not mutate input object", () => {
		const input = { message: "immutable" }
		const clone = { ...input }
		SerializedErrorSerializer.serialize(input)
		expect(input).toEqual(clone)
	})

	test("should allow unicode and special characters in message", () => {
		const input = { message: "Ошибка: 😱\nnewline\t\u2603" }
		const stored = SerializedErrorSerializer.serialize(input)
		const output = SerializedErrorSerializer.deserialize(stored)
		expect(output).toEqual(input)
	})
})
