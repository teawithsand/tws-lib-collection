import { describe, expect, test } from "vitest"
import { Result, ResultType, ResultVariant } from "./result"

describe("Result", () => {
	describe("creation", () => {
		test("should create a success result", () => {
			const result = Result.ok<number, string>(42)
			expect(result.isSuccess()).toBe(true)
			expect(result.isFailure()).toBe(false)
			expect(result.type).toBe(ResultType.Ok)
			expect(result.unwrap()).toBe(42)
		})

		test("should create an error result", () => {
			const errorMsg = "Something went wrong"
			const result = Result.error<number, string>(errorMsg)
			expect(result.isSuccess()).toBe(false)
			expect(result.isFailure()).toBe(true)
			expect(result.type).toBe(ResultType.Error)
			expect(() => result.unwrap()).toThrow(errorMsg)
			expect(result.unwrapError()).toBe(errorMsg)
		})
	})

	describe("fromType", () => {
		test("should create a success result from ResultVariant", () => {
			const variant: ResultVariant<number, string> = {
				type: ResultType.Ok,
				value: 42,
			}
			const result = Result.fromType(variant)
			expect(result.isSuccess()).toBe(true)
			expect(result.unwrap()).toBe(42)
		})

		test("should create an error result from ResultVariant", () => {
			const errorMsg = "Something went wrong"
			const variant: ResultVariant<number, string> = {
				type: ResultType.Error,
				error: errorMsg,
			}
			const result = Result.fromType(variant)
			expect(result.isFailure()).toBe(true)
			expect(result.unwrapError()).toBe(errorMsg)
		})
	})

	describe("unwrapOr", () => {
		test("should return value for success result", () => {
			const result = Result.ok<number, string>(42)
			expect(result.unwrapOr(100)).toBe(42)
		})

		test("should return default value for error result", () => {
			const result = Result.error<number, string>("error")
			expect(result.unwrapOr(100)).toBe(100)
		})
	})

	describe("unwrapOrElse", () => {
		test("should return value for success result", () => {
			const result = Result.ok<number, string>(42)
			expect(result.unwrapOrElse((e) => e.length)).toBe(42)
		})

		test("should return fallback result for error result", () => {
			const result = Result.error<number, string>("error")
			expect(result.unwrapOrElse((e) => e.length)).toBe(5)
		})
	})

	describe("unwrapError", () => {
		test("should throw for success result", () => {
			const result = Result.ok<number, string>(42)
			expect(() => result.unwrapError()).toThrow()
		})

		test("should return error for error result", () => {
			const errorMsg = "Something went wrong"
			const result = Result.error<number, string>(errorMsg)
			expect(result.unwrapError()).toBe(errorMsg)
		})
	})

	describe("map", () => {
		test("should transform value for success result", () => {
			const result = Result.ok<number, string>(42)
			const mapped = result.map((x) => x.toString())
			expect(mapped.unwrap()).toBe("42")
		})

		test("should carry error for error result", () => {
			const errorMsg = "Something went wrong"
			const result = Result.error<number, string>(errorMsg)
			const mapped = result.map((x) => x.toString())
			expect(mapped.isFailure()).toBe(true)
			expect(mapped.unwrapError()).toBe(errorMsg)
		})
	})

	describe("mapError", () => {
		test("should carry value for success result", () => {
			const result = Result.ok<number, string>(42)
			const mapped = result.mapError((e) => new Error(e))
			expect(mapped.isSuccess()).toBe(true)
			expect(mapped.unwrap()).toBe(42)
		})

		test("should transform error for error result", () => {
			const result = Result.error<number, string>("error")
			const mapped = result.mapError((e) => new Error(e))
			expect(mapped.isFailure()).toBe(true)
			expect(mapped.unwrapError()).toBeInstanceOf(Error)
			expect(mapped.unwrapError().message).toBe("error")
		})
	})

	describe("andThen", () => {
		test("should chain success results", () => {
			const result = Result.ok<number, string>(42)
			const chained = result.andThen((x) =>
				Result.ok<string, string>(x.toString()),
			)
			expect(chained.isSuccess()).toBe(true)
			expect(chained.unwrap()).toBe("42")
		})

		test("should short-circuit on first error result", () => {
			const errorMsg = "First error"
			const result = Result.error<number, string>(errorMsg)
			const chained = result.andThen((x) =>
				Result.ok<string, string>(x.toString()),
			)
			expect(chained.isFailure()).toBe(true)
			expect(chained.unwrapError()).toBe(errorMsg)
		})

		test("should propagate errors from chained function", () => {
			const result = Result.ok<number, string>(42)
			const errorMsg = "Second error"
			const chained = result.andThen((x) =>
				Result.error<string, string>(errorMsg),
			)
			expect(chained.isFailure()).toBe(true)
			expect(chained.unwrapError()).toBe(errorMsg)
		})
	})

	describe("orElse", () => {
		test("should not call recovery for success result", () => {
			const result = Result.ok<number, string>(42)
			const recovered = result.orElse((e) => Result.ok(e.length))
			expect(recovered.isSuccess()).toBe(true)
			expect(recovered.unwrap()).toBe(42)
		})

		test("should call recovery for error result", () => {
			const result = Result.error<number, string>("error")
			const recovered = result.orElse((e) => Result.ok(e.length))
			expect(recovered.isSuccess()).toBe(true)
			expect(recovered.unwrap()).toBe(5)
		})

		test("should propagate errors from recovery function", () => {
			const result = Result.error<number, string>("error")
			const errorMsg = "Recovery error"
			const recovered = result.orElse((e) => Result.error(errorMsg))
			expect(recovered.isFailure()).toBe(true)
			expect(recovered.unwrapError()).toBe(errorMsg)
		})
	})

	describe("toType", () => {
		test("should convert success result to ResultVariant", () => {
			const result = Result.ok<number, string>(42)
			const variant = result.toType()
			expect(variant.type).toBe(ResultType.Ok)
			expect("value" in variant).toBe(true)
			expect(variant.type === ResultType.Ok && variant.value).toBe(42)
		})

		test("should convert error result to ResultVariant", () => {
			const errorMsg = "Something went wrong"
			const result = Result.error<number, string>(errorMsg)
			const variant = result.toType()
			expect(variant.type).toBe(ResultType.Error)
			expect("error" in variant).toBe(true)
			expect(variant.type === ResultType.Error && variant.error).toBe(
				errorMsg,
			)
		})
	})

	describe("match", () => {
		test("should call ok handler for success result", () => {
			const result = Result.ok<number, string>(42)
			const matched = result.match({
				ok: (value) => `Success: ${value}`,
				error: (err) => `Error: ${err}`,
			})
			expect(matched).toBe("Success: 42")
		})

		test("should call error handler for error result", () => {
			const result = Result.error<number, string>("Something went wrong")
			const matched = result.match({
				ok: (value) => `Success: ${value}`,
				error: (err) => `Error: ${err}`,
			})
			expect(matched).toBe("Error: Something went wrong")
		})
	})

	describe("type property", () => {
		test("should return Ok for success result", () => {
			const result = Result.ok<number, string>(42)
			expect(result.type).toBe(ResultType.Ok)
		})

		test("should return Error for error result", () => {
			const result = Result.error<number, string>("error")
			expect(result.type).toBe(ResultType.Error)
		})
	})

	describe("complex scenarios", () => {
		test("should handle chaining multiple operations", () => {
			// This test demonstrates a more complex pipeline of Result operations
			const parseNumber = (input: string): Result<number, string> => {
				const num = Number(input)
				return isNaN(num)
					? Result.error(`Could not parse '${input}' as number`)
					: Result.ok(num)
			}

			const divide = (a: number, b: number): Result<number, string> => {
				return b === 0
					? Result.error("Division by zero")
					: Result.ok(a / b)
			}

			// Test successful path
			const success = parseNumber("10")
				.andThen((a) => parseNumber("2").andThen((b) => divide(a, b)))
				.map((result) => result * 2)

			expect(success.isSuccess()).toBe(true)
			expect(success.unwrap()).toBe(10)

			// Test error path - invalid first number
			const errorPath1 = parseNumber("invalid")
				.andThen((a) => parseNumber("2").andThen((b) => divide(a, b)))
				.map((result) => result * 2)

			expect(errorPath1.isFailure()).toBe(true)
			expect(errorPath1.unwrapError()).toContain(
				"Could not parse 'invalid' as number",
			)

			// Test error path - division by zero
			const errorPath2 = parseNumber("10")
				.andThen((a) => parseNumber("0").andThen((b) => divide(a, b)))
				.map((result) => result * 2)

			expect(errorPath2.isFailure()).toBe(true)
			expect(errorPath2.unwrapError()).toBe("Division by zero")
		})
	})
})
