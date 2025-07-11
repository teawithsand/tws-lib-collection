import { BaseError } from "@teawithsand/lngext"
import { describe, expect, test } from "vitest"
import { SimpleSerializedError } from "./simpleSerializedError"

describe("SimpleSerializedError", () => {
	describe("SerializerReverse", () => {
		test("should serialize SimpleSerializedError to plain object", () => {
			const error = new Error("Test error")
			const simpleSerializedError = SimpleSerializedError.fromAny(error)

			const result = SimpleSerializedError.serializer.serialize(
				simpleSerializedError,
			)

			expect(result).toHaveProperty("type", "object")
			expect(result).toHaveProperty("message", "Test error")
			expect(result).toHaveProperty("name", "Error")
			expect(result).not.toHaveProperty("callStack")
			expect(result).not.toHaveProperty("rawStack")
		})

		test("should deserialize plain object to SimpleSerializedError with schema validation", () => {
			const plainObject = {
				type: "object",
				name: "TestError",
				message: "Test message",
				causeChain: [],
			}

			const result =
				SimpleSerializedError.serializer.deserialize(plainObject)

			expect(result).toBeInstanceOf(SimpleSerializedError)
			expect(result.type).toBe("object")
			expect(result.name).toBe("TestError")
			expect(result.message).toBe("Test message")
			expect(result.causeChain).toHaveLength(0)
		})

		test("should validate and deserialize nested cause chain", () => {
			const plainObject = {
				type: "object",
				name: "TopError",
				message: "Top error",
				causeChain: [
					{
						type: "object",
						name: "CauseError",
						message: "Cause error",
						causeChain: [],
					},
				],
			}

			const result =
				SimpleSerializedError.serializer.deserialize(plainObject)

			expect(result.causeChain).toHaveLength(1)
			expect(result.causeChain[0]?.name).toBe("CauseError")
			expect(result.causeChain[0]?.message).toBe("Cause error")
		})

		test("should throw error for invalid schema during deserialization", () => {
			const invalidObject = {
				type: "object",
				// missing required fields
			}

			expect(() =>
				SimpleSerializedError.serializer.deserialize(invalidObject),
			).toThrow()
		})

		test("should handle round trip serialization correctly", () => {
			const originalError = new BaseError(
				"Original error",
				new Error("Root cause"),
			)
			const serialized = SimpleSerializedError.fromAny(originalError)

			// Serialize to plain object
			const plainObject =
				SimpleSerializedError.serializer.serialize(serialized)

			// Deserialize back to SimpleSerializedError
			const deserialized =
				SimpleSerializedError.serializer.deserialize(plainObject)

			expect(deserialized.type).toBe(serialized.type)
			expect(deserialized.name).toBe(serialized.name)
			expect(deserialized.message).toBe(serialized.message)
			expect(deserialized.causeChain).toHaveLength(
				serialized.causeChain.length,
			)
			expect(deserialized.causeChain[0]?.message).toBe(
				serialized.causeChain[0]?.message,
			)
		})

		test("should work with JSON serialization", () => {
			const error = new BaseError("Test error", new Error("Cause"))
			const serialized = SimpleSerializedError.fromAny(error)

			// Convert to JSON through SerializerReverse
			const plainObject =
				SimpleSerializedError.serializer.serialize(serialized)
			const json = JSON.stringify(plainObject)
			const parsedJson = JSON.parse(json)

			// Deserialize back
			const deserialized =
				SimpleSerializedError.serializer.deserialize(parsedJson)

			expect(deserialized.message).toBe("Test error")
			expect(deserialized.causeChain).toHaveLength(1)
			expect(deserialized.causeChain[0]?.message).toBe("Cause")
		})
	})

	describe("fromAny", () => {
		test("should serialize a standard Error without stack traces", () => {
			const error = new Error("Test error message")
			error.name = "TestError"

			const serialized = SimpleSerializedError.fromAny(error)

			expect(serialized.type).toBe("object")
			expect(serialized.name).toBe("TestError")
			expect(serialized.message).toBe("Test error message")
			expect(serialized.causeChain).toEqual([])
			// No stack-related properties
			expect(serialized).not.toHaveProperty("callStack")
			expect(serialized).not.toHaveProperty("rawStack")
		})

		test("should serialize a BaseError with cause chain but no stack traces", () => {
			const rootCause = new Error("Root cause")
			const baseError = new BaseError("Base error message", rootCause)

			const serialized = SimpleSerializedError.fromAny(baseError)

			expect(serialized.type).toBe("object")
			expect(serialized.name).toBe("BaseError")
			expect(serialized.message).toBe("Base error message")
			expect(serialized.causeChain).toHaveLength(1)
			expect(serialized.causeChain[0]?.message).toBe("Root cause")
			// No stack traces in cause chain either
			expect(serialized.causeChain[0]).not.toHaveProperty("callStack")
			expect(serialized.causeChain[0]).not.toHaveProperty("rawStack")
		})

		test("should serialize BaseError with multiple nested causes", () => {
			const rootCause = new Error("Root cause")
			const middleCause = new BaseError("Middle cause", rootCause)
			const topError = new BaseError("Top error", middleCause)

			const serialized = SimpleSerializedError.fromAny(topError)

			expect(serialized.causeChain).toHaveLength(2)
			expect(serialized.causeChain[0]?.message).toBe("Middle cause")
			expect(serialized.causeChain[1]?.message).toBe("Root cause")
			// Ensure no stack traces in any level
			serialized.causeChain.forEach((cause) => {
				expect(cause).not.toHaveProperty("callStack")
				expect(cause).not.toHaveProperty("rawStack")
			})
		})

		test("should serialize a string value", () => {
			const error = "Simple string error"

			const serialized = SimpleSerializedError.fromAny(error)

			expect(serialized.type).toBe("string")
			expect(serialized.name).toBeNull()
			expect(serialized.message).toBe("Simple string error")
			expect(serialized.causeChain).toEqual([])
		})

		test("should serialize null and undefined values", () => {
			const nullSerialized = SimpleSerializedError.fromAny(null)
			expect(nullSerialized.type).toBe("object")
			expect(nullSerialized.message).toBe("null")

			const undefinedSerialized = SimpleSerializedError.fromAny(undefined)
			expect(undefinedSerialized.type).toBe("undefined")
			expect(undefinedSerialized.message).toBe("undefined")
		})

		test("should handle BaseError with circular cause references", () => {
			const error1 = new BaseError("Error 1")
			const error2 = new BaseError("Error 2", error1)
			// Manually create circular reference
			Object.defineProperty(error1, "cause", {
				value: error2,
				writable: false,
				enumerable: false,
				configurable: false,
			})

			const serialized = SimpleSerializedError.fromAny(error2)

			expect(serialized.causeChain.length).toBeGreaterThan(0)
			expect(serialized.causeChain[0]?.message).toBe("Error 1")
		})
	})

	describe("serializer round trip", () => {
		test("should convert to plain object and back", () => {
			const originalError = new BaseError(
				"Test message",
				new Error("Cause"),
			)
			const serialized = SimpleSerializedError.fromAny(originalError)

			const plainObject =
				SimpleSerializedError.serializer.serialize(serialized)
			const deserialized =
				SimpleSerializedError.serializer.deserialize(plainObject)

			expect(deserialized.type).toBe(serialized.type)
			expect(deserialized.name).toBe(serialized.name)
			expect(deserialized.message).toBe(serialized.message)
			expect(deserialized.causeChain).toHaveLength(
				serialized.causeChain.length,
			)
			expect(deserialized.causeChain[0]?.message).toBe(
				serialized.causeChain[0]?.message,
			)
		})

		test("should handle JSON serialization round trip", () => {
			const originalError = new BaseError(
				"Test message",
				new Error("Cause"),
			)
			const serialized = SimpleSerializedError.fromAny(originalError)

			const plainObject =
				SimpleSerializedError.serializer.serialize(serialized)
			const json = JSON.stringify(plainObject)
			const parsed = JSON.parse(json)
			const deserialized =
				SimpleSerializedError.serializer.deserialize(parsed)

			expect(deserialized.type).toBe(serialized.type)
			expect(deserialized.name).toBe(serialized.name)
			expect(deserialized.message).toBe(serialized.message)
			expect(deserialized.causeChain).toHaveLength(
				serialized.causeChain.length,
			)
		})

		test("should throw error for invalid object in deserializer", () => {
			expect(() =>
				SimpleSerializedError.serializer.deserialize(null),
			).toThrow()
			expect(() =>
				SimpleSerializedError.serializer.deserialize("invalid"),
			).toThrow()
			expect(() =>
				SimpleSerializedError.serializer.deserialize(123),
			).toThrow()
		})

		test("should handle empty or partial objects in deserializer", () => {
			const minimalObject = {
				type: "unknown",
				name: null,
				message: "Unknown error",
				causeChain: [],
			}

			const deserialized =
				SimpleSerializedError.serializer.deserialize(minimalObject)

			expect(deserialized.type).toBe("unknown")
			expect(deserialized.name).toBeNull()
			expect(deserialized.message).toBe("Unknown error")
			expect(deserialized.causeChain).toEqual([])
		})
	})

	describe("toString", () => {
		test("should format simple error", () => {
			const error = new Error("Test message")
			error.name = "TestError"
			const serialized = SimpleSerializedError.fromAny(error)

			const result = serialized.toString()

			expect(result).toContain("SimpleSerializedError [object]")
			expect(result).toContain("(TestError)")
			expect(result).toContain("Test message")
		})

		test("should format error with cause chain", () => {
			const rootCause = new Error("Root")
			const baseError = new BaseError("Top", rootCause)
			const serialized = SimpleSerializedError.fromAny(baseError)

			const result = serialized.toString()

			expect(result).toContain("Cause chain (1 errors)")
			expect(result).toContain("1. SimpleSerializedError")
			expect(result).toContain("Root")
		})

		test("should format error without name", () => {
			const serialized = SimpleSerializedError.fromAny("String error")

			const result = serialized.toString()

			expect(result).toBe("SimpleSerializedError [string]: String error")
		})
	})

	describe("edge cases", () => {
		test("should handle Error with empty message", () => {
			const error = new Error("")
			const serialized = SimpleSerializedError.fromAny(error)

			expect(serialized.message).toBe("")
		})

		test("should handle Error with undefined message", () => {
			const error = new Error()
			const serialized = SimpleSerializedError.fromAny(error)

			expect(serialized.message).toBe("")
		})

		test("should handle complex object values", () => {
			const complexObject = {
				nested: { value: 123 },
				array: [1, 2, 3],
				toString: () => "Complex object",
			}

			const serialized = SimpleSerializedError.fromAny(complexObject)

			expect(serialized.type).toBe("object")
			expect(serialized.message).toBe("Complex object")
		})

		test("should handle function values", () => {
			const func = function testFunction() {
				return "test"
			}

			const serialized = SimpleSerializedError.fromAny(func)

			expect(serialized.type).toBe("function")
			expect(serialized.message).toContain("testFunction")
		})
	})

	describe("equals method", () => {
		test("should return true for identical errors", () => {
			// Arrange
			const error1 = SimpleSerializedError.fromAny(
				new Error("Test error"),
			)
			const error2 = SimpleSerializedError.fromAny(
				new Error("Test error"),
			)

			// Act & Assert
			expect(error1.equals(error2)).toBe(true)
		})

		test("should return false for different error messages", () => {
			// Arrange
			const error1 = SimpleSerializedError.fromAny(
				new Error("Test error 1"),
			)
			const error2 = SimpleSerializedError.fromAny(
				new Error("Test error 2"),
			)

			// Act & Assert
			expect(error1.equals(error2)).toBe(false)
		})

		test("should return true for same reference", () => {
			// Arrange
			const error1 = SimpleSerializedError.fromAny(
				new Error("Test error"),
			)

			// Act & Assert
			expect(error1.equals(error1)).toBe(true)
		})

		test("should return false for different error names", () => {
			// Arrange
			const error1 = new Error("Test error")
			error1.name = "Error"
			const error2 = new Error("Test error")
			error2.name = "TypeError"

			const simpleError1 = SimpleSerializedError.fromAny(error1)
			const simpleError2 = SimpleSerializedError.fromAny(error2)

			// Act & Assert
			expect(simpleError1.equals(simpleError2)).toBe(false)
		})

		test("should return false for different error types", () => {
			// Arrange
			const error1 = SimpleSerializedError.fromAny("string error")
			const error2 = SimpleSerializedError.fromAny(123)

			// Act & Assert
			expect(error1.equals(error2)).toBe(false)
		})

		test("should handle errors with cause chains", () => {
			// Arrange
			const rootCause = new Error("Root cause")
			const baseError1 = new BaseError("Base error", rootCause)
			const baseError2 = new BaseError("Base error", rootCause)

			const error1 = SimpleSerializedError.fromAny(baseError1)
			const error2 = SimpleSerializedError.fromAny(baseError2)

			// Act & Assert
			expect(error1.equals(error2)).toBe(true)
		})

		test("should return false for different cause chains", () => {
			// Arrange
			const rootCause1 = new Error("Root cause 1")
			const rootCause2 = new Error("Root cause 2")
			const baseError1 = new BaseError("Base error", rootCause1)
			const baseError2 = new BaseError("Base error", rootCause2)

			const error1 = SimpleSerializedError.fromAny(baseError1)
			const error2 = SimpleSerializedError.fromAny(baseError2)

			// Act & Assert
			expect(error1.equals(error2)).toBe(false)
		})

		test("should return false for different cause chain lengths", () => {
			// Arrange
			const rootCause = new Error("Root cause")
			const baseError1 = new BaseError("Base error", rootCause)
			const baseError2 = new BaseError("Base error")

			const error1 = SimpleSerializedError.fromAny(baseError1)
			const error2 = SimpleSerializedError.fromAny(baseError2)

			// Act & Assert
			expect(error1.equals(error2)).toBe(false)
		})

		test("should handle non-error values", () => {
			// Arrange
			const error1 = SimpleSerializedError.fromAny("string error")
			const error2 = SimpleSerializedError.fromAny("string error")
			const error3 = SimpleSerializedError.fromAny(
				"different string error",
			)

			// Act & Assert
			expect(error1.equals(error2)).toBe(true)
			expect(error1.equals(error3)).toBe(false)
		})

		test("should handle null and undefined values correctly", () => {
			// Arrange
			const error1 = SimpleSerializedError.fromAny(null)
			const error2 = SimpleSerializedError.fromAny(null)
			const error3 = SimpleSerializedError.fromAny(undefined)

			// Act & Assert
			expect(error1.equals(error2)).toBe(true)
			expect(error1.equals(error3)).toBe(false)
		})

		test("should return true for deserialized identical errors", () => {
			// Arrange
			const originalError = SimpleSerializedError.fromAny("Test error")
			const serializedData =
				SimpleSerializedError.serializer.serialize(originalError)
			const deserializedError1 =
				SimpleSerializedError.serializer.deserialize(serializedData)
			const deserializedError2 =
				SimpleSerializedError.serializer.deserialize(serializedData)

			// Act & Assert
			expect(deserializedError1.equals(deserializedError2)).toBe(true)
		})

		test("should handle complex nested cause chains", () => {
			// Arrange
			const rootCause = new Error("Root cause")
			const middleCause = new BaseError("Middle cause", rootCause)
			const topError1 = new BaseError("Top error", middleCause)
			const topError2 = new BaseError("Top error", middleCause)

			const error1 = SimpleSerializedError.fromAny(topError1)
			const error2 = SimpleSerializedError.fromAny(topError2)

			// Act & Assert
			expect(error1.equals(error2)).toBe(true)
		})

		test("should return false for nested cause chains with different content", () => {
			// Arrange
			const rootCause1 = new Error("Root cause 1")
			const rootCause2 = new Error("Root cause 2")
			const middleCause1 = new BaseError("Middle cause", rootCause1)
			const middleCause2 = new BaseError("Middle cause", rootCause2)
			const topError1 = new BaseError("Top error", middleCause1)
			const topError2 = new BaseError("Top error", middleCause2)

			const error1 = SimpleSerializedError.fromAny(topError1)
			const error2 = SimpleSerializedError.fromAny(topError2)

			// Act & Assert
			expect(error1.equals(error2)).toBe(false)
		})
	})
})
