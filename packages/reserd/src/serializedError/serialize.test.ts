import { BaseError, Errors } from "@teawithsand/lngext"
import { describe, expect, test } from "vitest"
import { SerializedError } from "./serialize"

describe("SerializedError", () => {
	describe("SerializerReverse", () => {
		test("should serialize SerializedError to plain object", () => {
			const error = new Error("Test error")
			const serializedError = SerializedError.fromAny(error)

			const result = SerializedError.serializer.serialize(serializedError)

			expect(result).toEqual(serializedError.toPlainObject())
			expect(result).toHaveProperty("type", "object")
			expect(result).toHaveProperty("message", "Test error")
			expect(result).toHaveProperty("name", "Error")
		})

		test("should deserialize plain object to SerializedError with schema validation", () => {
			const plainObject = {
				type: "object",
				name: "TestError",
				message: "Test message",
				callStack: [
					{
						functionName: "testFunc",
						fileName: "test.js",
						lineNumber: 10,
						columnNumber: 5,
						raw: "at testFunc (test.js:10:5)",
					},
				],
				rawStack:
					"TestError: Test message\n    at testFunc (test.js:10:5)",
				causeChain: [],
			}

			const result = SerializedError.serializer.deserialize(plainObject)

			expect(result).toBeInstanceOf(SerializedError)
			expect(result.type).toBe("object")
			expect(result.name).toBe("TestError")
			expect(result.message).toBe("Test message")
			expect(result.callStack).toHaveLength(1)
			expect(result.causeChain).toHaveLength(0)
		})

		test("should validate and deserialize nested cause chain", () => {
			const plainObject = {
				type: "object",
				name: "TopError",
				message: "Top error",
				callStack: [],
				rawStack: null,
				causeChain: [
					{
						type: "object",
						name: "CauseError",
						message: "Cause error",
						callStack: [],
						rawStack: null,
						causeChain: [],
					},
				],
			}

			const result = SerializedError.serializer.deserialize(plainObject)

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
				SerializedError.serializer.deserialize(invalidObject),
			).toThrow()
		})

		test("should throw error for invalid stack frame schema", () => {
			const invalidObject = {
				type: "object",
				name: "TestError",
				message: "Test message",
				callStack: [
					{
						// missing required 'raw' field
						functionName: "testFunc",
						fileName: "test.js",
						lineNumber: 10,
						columnNumber: 5,
					},
				],
				rawStack: null,
				causeChain: [],
			}

			expect(() =>
				SerializedError.serializer.deserialize(invalidObject),
			).toThrow()
		})

		test("should handle round trip serialization correctly", () => {
			const originalError = new BaseError(
				"Original error",
				new Error("Root cause"),
			)
			const serialized = SerializedError.fromAny(originalError)

			// Serialize to plain object
			const plainObject = SerializedError.serializer.serialize(serialized)

			// Deserialize back to SerializedError
			const deserialized =
				SerializedError.serializer.deserialize(plainObject)

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

		test("should validate null values correctly", () => {
			const plainObject = {
				type: "string",
				name: null,
				message: "Simple error",
				callStack: [],
				rawStack: null,
				causeChain: [],
			}

			const result = SerializedError.serializer.deserialize(plainObject)

			expect(result.name).toBeNull()
			expect(result.rawStack).toBeNull()
		})

		test("should work with JSON serialization", () => {
			const error = new BaseError("Test error", new Error("Cause"))
			const serialized = SerializedError.fromAny(error)

			// Convert to JSON through SerializerReverse
			const plainObject = SerializedError.serializer.serialize(serialized)
			const json = JSON.stringify(plainObject)
			const parsedJson = JSON.parse(json)

			// Deserialize back
			const deserialized =
				SerializedError.serializer.deserialize(parsedJson)

			expect(deserialized.message).toBe("Test error")
			expect(deserialized.causeChain).toHaveLength(1)
			expect(deserialized.causeChain[0]?.message).toBe("Cause")
		})
	})
	describe("fromAny", () => {
		test("should serialize a standard Error", () => {
			const error = new Error("Test error message")
			error.name = "TestError"

			const serialized = SerializedError.fromAny(error)

			expect(serialized.type).toBe("object")
			expect(serialized.name).toBe("TestError")
			expect(serialized.message).toBe("Test error message")
			expect(serialized.causeChain).toEqual([])
			expect(serialized.callStack).toBeInstanceOf(Array)
			expect(serialized.rawStack).toBeTruthy()
		})

		test("should serialize a BaseError with cause", () => {
			const rootCause = new Error("Root cause")
			const baseError = new BaseError("Base error message", rootCause)

			const serialized = SerializedError.fromAny(baseError)

			expect(serialized.type).toBe("object")
			expect(serialized.name).toBe("BaseError")
			expect(serialized.message).toBe("Base error message")
			expect(serialized.causeChain).toHaveLength(1)
			expect(serialized.causeChain[0]?.message).toBe("Root cause")
		})

		test("should serialize BaseError with multiple nested causes", () => {
			const rootCause = new Error("Root cause")
			const middleCause = new BaseError("Middle cause", rootCause)
			const topError = new BaseError("Top error", middleCause)

			const serialized = SerializedError.fromAny(topError)

			expect(serialized.causeChain).toHaveLength(2)
			expect(serialized.causeChain[0]?.message).toBe("Middle cause")
			expect(serialized.causeChain[1]?.message).toBe("Root cause")
		})

		test("should serialize a string value", () => {
			const error = "Simple string error"

			const serialized = SerializedError.fromAny(error)

			expect(serialized.type).toBe("string")
			expect(serialized.name).toBeNull()
			expect(serialized.message).toBe("Simple string error")
			expect(serialized.causeChain).toEqual([])
			expect(serialized.callStack).toEqual([])
			expect(serialized.rawStack).toBeNull()
		})

		test("should serialize a number value", () => {
			const error = 42

			const serialized = SerializedError.fromAny(error)

			expect(serialized.type).toBe("number")
			expect(serialized.name).toBeNull()
			expect(serialized.message).toBe("42")
			expect(serialized.causeChain).toEqual([])
		})

		test("should serialize null value", () => {
			const serialized = SerializedError.fromAny(null)

			expect(serialized.type).toBe("object")
			expect(serialized.name).toBeNull()
			expect(serialized.message).toBe("null")
			expect(serialized.causeChain).toEqual([])
		})

		test("should serialize undefined value", () => {
			const serialized = SerializedError.fromAny(undefined)

			expect(serialized.type).toBe("undefined")
			expect(serialized.name).toBeNull()
			expect(serialized.message).toBe("undefined")
			expect(serialized.causeChain).toEqual([])
		})

		test("should serialize object with message property", () => {
			const error = {
				message: "Custom object error",
				customField: "value",
			}

			const serialized = SerializedError.fromAny(error)

			expect(serialized.type).toBe("object")
			expect(serialized.name).toBeNull()
			expect(serialized.message).toBe("Custom object error")
			expect(serialized.causeChain).toEqual([])
		})

		test("should serialize custom error type using Errors.makeErrorType", () => {
			const CustomError = Errors.makeErrorType("CustomError", BaseError)
			const error = new CustomError("Custom error message")

			const serialized = SerializedError.fromAny(error)

			expect(serialized.type).toBe("object")
			expect(serialized.name).toBe("CustomError")
			expect(serialized.message).toBe("Custom error message")
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

			const serialized = SerializedError.fromAny(error2)

			// The extractCauses method should detect the cycle and return both causes
			// but our serialization should handle it without infinite recursion
			expect(serialized.causeChain.length).toBeGreaterThan(0)
			expect(serialized.causeChain[0]?.message).toBe("Error 1")
		})
	})

	describe("toPlainObject and fromPlainObject", () => {
		test("should convert to plain object and back", () => {
			const originalError = new BaseError(
				"Test message",
				new Error("Cause"),
			)
			const serialized = SerializedError.fromAny(originalError)

			const plainObject = serialized.toPlainObject()
			const deserialized = SerializedError.fromPlainObject(plainObject)

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
			const serialized = SerializedError.fromAny(originalError)

			const json = JSON.stringify(serialized.toPlainObject())
			const parsed = JSON.parse(json)
			const deserialized = SerializedError.fromPlainObject(parsed)

			expect(deserialized.type).toBe(serialized.type)
			expect(deserialized.name).toBe(serialized.name)
			expect(deserialized.message).toBe(serialized.message)
			expect(deserialized.causeChain).toHaveLength(
				serialized.causeChain.length,
			)
		})

		test("should throw error for invalid object in fromPlainObject", () => {
			expect(() => SerializedError.fromPlainObject(null)).toThrow()
			expect(() => SerializedError.fromPlainObject("invalid")).toThrow()
			expect(() => SerializedError.fromPlainObject(123)).toThrow()
		})

		test("should handle empty or partial objects in fromPlainObject", () => {
			const deserialized = SerializedError.fromPlainObject({})

			expect(deserialized.type).toBe("unknown")
			expect(deserialized.name).toBeNull()
			expect(deserialized.message).toBe("Unknown error")
			expect(deserialized.causeChain).toEqual([])
			expect(deserialized.callStack).toEqual([])
		})
	})

	describe("toString", () => {
		test("should format simple error", () => {
			const error = new Error("Test message")
			error.name = "TestError"
			const serialized = SerializedError.fromAny(error)

			const result = serialized.toString()

			expect(result).toContain("SerializedError [object]")
			expect(result).toContain("(TestError)")
			expect(result).toContain("Test message")
		})

		test("should format error with cause chain", () => {
			const rootCause = new Error("Root")
			const baseError = new BaseError("Top", rootCause)
			const serialized = SerializedError.fromAny(baseError)

			const result = serialized.toString()

			expect(result).toContain("Cause chain (1 errors)")
			expect(result).toContain("1. SerializedError")
			expect(result).toContain("Root")
		})

		test("should format error without name", () => {
			const serialized = SerializedError.fromAny("String error")

			const result = serialized.toString()

			expect(result).toBe("SerializedError [string]: String error")
		})
	})

	describe("getFormattedStack", () => {
		test("should return raw stack if available", () => {
			const error = new Error("Test")
			const serialized = SerializedError.fromAny(error)

			const formattedStack = serialized.getFormattedStack()

			expect(formattedStack).toBe(error.stack)
		})

		test("should format stack from callStack array when no raw stack", () => {
			const serialized = SerializedError.fromAny("Test")
			// Manually set some call stack frames for testing
			Object.defineProperty(serialized, "callStack", {
				value: [
					{
						functionName: "testFunction",
						fileName: "test.js",
						lineNumber: 10,
						columnNumber: 5,
						raw: "at testFunction (test.js:10:5)",
					},
				],
				writable: false,
			})

			const formattedStack = serialized.getFormattedStack()

			expect(formattedStack).toContain("Test")
			expect(formattedStack).toContain("at testFunction (test.js:10:5)")
		})

		test("should return null when no stack information available", () => {
			const serialized = SerializedError.fromAny("Test")

			const formattedStack = serialized.getFormattedStack()

			expect(formattedStack).toBeNull()
		})
	})

	describe("edge cases", () => {
		test("should handle Error with empty message", () => {
			const error = new Error("")
			const serialized = SerializedError.fromAny(error)

			expect(serialized.message).toBe("")
		})

		test("should handle Error with undefined message", () => {
			const error = new Error()
			const serialized = SerializedError.fromAny(error)

			expect(serialized.message).toBe("")
		})

		test("should handle complex object values", () => {
			const complexObject = {
				nested: { value: 123 },
				array: [1, 2, 3],
				toString: () => "Complex object",
			}

			const serialized = SerializedError.fromAny(complexObject)

			expect(serialized.type).toBe("object")
			expect(serialized.message).toBe("Complex object")
		})

		test("should handle function values", () => {
			const func = function testFunction() {
				return "test"
			}

			const serialized = SerializedError.fromAny(func)

			expect(serialized.type).toBe("function")
			expect(serialized.message).toContain("testFunction")
		})
	})
})
