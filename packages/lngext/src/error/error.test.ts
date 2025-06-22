import { describe, expect, test } from "vitest"
import { BaseError, Errors, StackFrame } from "./error"

describe("BaseError", () => {
	test("should create error with message and no cause", () => {
		class TestError extends BaseError {
			constructor(message: string, cause?: any) {
				super(message, cause)
				this.name = "TestError"
			}
		}

		const error = new TestError("Test message")

		expect(error.message).toBe("Test message")
		expect(error.cause).toBeNull()
		expect(error.name).toBe("TestError")
		expect(error).toBeInstanceOf(Error)
		expect(error).toBeInstanceOf(BaseError)
	})

	test("should create error with message and cause", () => {
		class TestError extends BaseError {
			constructor(message: string, cause?: any) {
				super(message, cause)
				this.name = "TestError"
			}
		}

		const originalError = new Error("Original error")
		const error = new TestError("Test message", originalError)

		expect(error.message).toBe("Test message")
		expect(error.cause).toBe(originalError)
		expect(error.name).toBe("TestError")
	})
})

describe("Errors.makeErrorType", () => {
	test("should create error type with custom name", () => {
		class CustomBaseError extends BaseError {
			constructor(message: string, cause?: any) {
				super(message, cause)
			}
		}

		const ValidationError = Errors.makeErrorType(
			"ValidationError",
			CustomBaseError,
		)
		const error = new ValidationError("Validation failed")

		expect(error.name).toBe("ValidationError")
		expect(error.message).toBe("Validation failed")
		expect(error).toBeInstanceOf(Error)
		expect(error).toBeInstanceOf(BaseError)
		expect(error).toBeInstanceOf(CustomBaseError)
		expect(error).toBeInstanceOf(ValidationError)
	})

	test("should create error type that maintains instanceof checks", () => {
		class NetworkError extends BaseError {
			constructor(
				message: string,
				public readonly statusCode: number,
				cause?: any,
			) {
				super(message, cause)
			}
		}

		const HttpError = Errors.makeErrorType("HttpError", NetworkError)
		const NotFoundError = Errors.makeErrorType("NotFoundError", HttpError)

		const error = new NotFoundError("Resource not found", 404)

		expect(error).toBeInstanceOf(Error)
		expect(error).toBeInstanceOf(BaseError)
		expect(error).toBeInstanceOf(NetworkError)
		expect(error).toBeInstanceOf(HttpError)
		expect(error).toBeInstanceOf(NotFoundError)
		expect(error.name).toBe("NotFoundError")
		expect(error.statusCode).toBe(404)
	})

	test("should create multiple distinct error types", () => {
		class AppError extends BaseError {
			constructor(message: string, cause?: any) {
				super(message, cause)
			}
		}

		const DatabaseError = Errors.makeErrorType("DatabaseError", AppError)
		const ValidationError = Errors.makeErrorType(
			"ValidationError",
			AppError,
		)

		const dbError = new DatabaseError("DB connection failed")
		const validationError = new ValidationError("Invalid input")

		expect(dbError).toBeInstanceOf(DatabaseError)
		expect(dbError).not.toBeInstanceOf(ValidationError)
		expect(validationError).toBeInstanceOf(ValidationError)
		expect(validationError).not.toBeInstanceOf(DatabaseError)

		expect(dbError.name).toBe("DatabaseError")
		expect(validationError.name).toBe("ValidationError")
	})

	test("should preserve custom properties and methods", () => {
		class RichError extends BaseError {
			constructor(
				message: string,
				public readonly code: string,
				public readonly context: Record<string, any> = {},
				cause?: any,
			) {
				super(message, cause)
			}

			public readonly getFullInfo = () => ({
				name: this.name,
				message: this.message,
				code: this.code,
				context: this.context,
			})
		}

		const BusinessError = Errors.makeErrorType("BusinessError", RichError)
		const error = new BusinessError("Business rule violated", "BR001", {
			userId: 123,
		})

		expect(error.code).toBe("BR001")
		expect(error.context).toEqual({ userId: 123 })
		expect(error.getFullInfo()).toEqual({
			name: "BusinessError",
			message: "Business rule violated",
			code: "BR001",
			context: { userId: 123 },
		})
	})
})

describe("Errors.extractCauses", () => {
	test("should extract single cause", () => {
		class TestError extends BaseError {
			constructor(message: string, cause?: any) {
				super(message, cause)
			}
		}

		const rootCause = new Error("Root cause")
		const error = new TestError("Main error", rootCause)

		const causes = Errors.extractCauses(error)

		expect(causes).toHaveLength(1)
		expect(causes[0]).toBe(rootCause)
	})

	test("should extract multiple causes in chain", () => {
		class TestError extends BaseError {
			constructor(message: string, cause?: any) {
				super(message, cause)
			}
		}

		const rootCause = new Error("Root cause")
		const middleCause = new TestError("Middle cause", rootCause)
		const error = new TestError("Main error", middleCause)

		const causes = Errors.extractCauses(error)

		expect(causes).toHaveLength(2)
		expect(causes[0]).toBe(middleCause)
		expect(causes[1]).toBe(rootCause)
	})

	test("should handle error with no cause", () => {
		class TestError extends BaseError {
			constructor(message: string, cause?: any) {
				super(message, cause)
			}
		}

		const error = new TestError("Main error")
		const causes = Errors.extractCauses(error)

		expect(causes).toHaveLength(0)
	})

	test("should handle error with null cause", () => {
		class TestError extends BaseError {
			constructor(message: string, cause?: any) {
				super(message, cause)
			}
		}

		const error = new TestError("Main error", null)
		const causes = Errors.extractCauses(error)

		expect(causes).toHaveLength(0)
	})

	test("should handle error with undefined cause", () => {
		class TestError extends BaseError {
			constructor(message: string, cause?: any) {
				super(message, cause)
			}
		}

		const error = new TestError("Main error", undefined)
		const causes = Errors.extractCauses(error)

		expect(causes).toHaveLength(0)
	})

	test("should handle self-referencing error", () => {
		class TestError extends BaseError {
			constructor(message: string, cause?: any) {
				super(message, cause)
			}
		}

		const error = new TestError("Self-referencing error")
		// Create self-reference
		;(error as any).cause = error

		const causes = Errors.extractCauses(error)

		expect(causes).toHaveLength(0)
	})

	test("should handle cyclic error chain", () => {
		class TestError extends BaseError {
			constructor(message: string, cause?: any) {
				super(message, cause)
			}
		}

		const error1 = new TestError("Error 1")
		const error2 = new TestError("Error 2", error1)
		const error3 = new TestError("Error 3", error2)

		// Create cycle: error1 -> error2 -> error3 -> error2
		;(error1 as any).cause = error2

		const causes = Errors.extractCauses(error3)

		expect(causes).toHaveLength(2)
		expect(causes[0]).toBe(error2)
		expect(causes[1]).toBe(error1)
	})

	test("should handle cycle at any point in chain", () => {
		class TestError extends BaseError {
			constructor(message: string, cause?: any) {
				super(message, cause)
			}
		}

		const rootError = new Error("Root error")
		const error1 = new TestError("Error 1", rootError)
		const error2 = new TestError("Error 2", error1)
		const error3 = new TestError("Error 3", error2)

		// Create cycle: error1 points back to error2
		;(error1 as any).cause = error2

		const causes = Errors.extractCauses(error3)

		expect(causes).toHaveLength(2)
		expect(causes[0]).toBe(error2)
		expect(causes[1]).toBe(error1)
	})

	test("should handle non-error causes", () => {
		class TestError extends BaseError {
			constructor(message: string, cause?: any) {
				super(message, cause)
			}
		}

		const stringCause = "String cause"
		const objectCause = { type: "object", message: "Object cause" }
		const numberCause = 42

		const error1 = new TestError("Error 1", numberCause)
		const error2 = new TestError("Error 2", objectCause)
		const error3 = new TestError("Error 3", stringCause)
		const mainError = new TestError("Main error", error3)

		// Chain: mainError -> error3 -> stringCause
		;(error3 as any).cause = error2
		;(error2 as any).cause = error1

		const causes = Errors.extractCauses(mainError)

		expect(causes).toHaveLength(4)
		expect(causes[0]).toBe(error3)
		expect(causes[1]).toBe(error2)
		expect(causes[2]).toBe(error1)
		expect(causes[3]).toBe(numberCause)
	})

	test("should handle deep cause chain", () => {
		class TestError extends BaseError {
			constructor(message: string, cause?: any) {
				super(message, cause)
			}
		}

		// Create a deep chain of 10 errors
		let currentError: any = new Error("Root cause")
		for (let i = 1; i <= 10; i++) {
			currentError = new TestError(`Error ${i}`, currentError)
		}

		const causes = Errors.extractCauses(currentError)

		expect(causes).toHaveLength(10)
		expect(causes[9].message).toBe("Root cause")
		expect(causes[0].message).toBe("Error 9")
	})
})

describe("BaseError stack trace", () => {
	test("should have stack trace starting at custom error constructor (V8 environments)", () => {
		class StackError extends BaseError {
			constructor(message: string, cause?: any) {
				super(message, cause)
				this.name = "StackError"
			}
		}

		const error = new StackError("Stack trace test")
		// Only check if stack exists and starts with the custom error name
		expect(typeof error.stack).toBe("string")
		if (error.stack) {
			// Should start with error name and message
			expect(error.stack.startsWith("StackError: Stack trace test")).toBe(
				true,
			)
			// Should include this test file in the stack trace (file name)
			expect(error.stack.includes("error.test.ts")).toBe(true)
		}
	})
})

describe("Errors.makeErrorTypeWithData", () => {
	test("should create error with data and no extractor", () => {
		const DataError = Errors.makeErrorTypeWithData<
			{ code: number },
			typeof BaseError
		>("DataError", BaseError)
		const err = new DataError("msg", { code: 42 })
		expect(err).toBeInstanceOf(DataError)
		expect(err.name).toBe("DataError")
		expect(err.data).toEqual({ code: 42 })
		expect(err.message).toBe("msg")
	})

	test("should create error with data and extractor for base error", () => {
		class NeedsDataError extends BaseError {
			public readonly baseField: string
			constructor(message: string, baseField: string, cause?: any) {
				super(message, cause)
				this.baseField = baseField
			}
		}
		const DataError = Errors.makeErrorTypeWithData<
			{ code: number; baseField: string },
			typeof NeedsDataError
		>("DataError", NeedsDataError, (data) => data.baseField)
		const err = new DataError("msg", { code: 1, baseField: "abc" })
		expect(err).toBeInstanceOf(DataError)
		expect(err).toBeInstanceOf(NeedsDataError)
		expect((err as NeedsDataError).baseField).toBe("abc")
		expect(err.data).toEqual({ code: 1, baseField: "abc" })
	})

	test("should merge data from cause if cause is same error type", () => {
		const DataError = Errors.makeErrorTypeWithData<
			{ a: number; b?: number },
			typeof BaseError
		>("DataError", BaseError)
		const err1 = new DataError("msg1", { a: 1, b: 2 })
		const err2 = new DataError("msg2", { a: 3 }, err1)
		expect(err2.data).toEqual({ a: 3, b: 2 })
	})

	test("should not merge data from cause if cause is different error type", () => {
		const DataError = Errors.makeErrorTypeWithData<
			{ a: number },
			typeof BaseError
		>("DataError", BaseError)
		const OtherError = Errors.makeErrorTypeWithData<
			{ b: number },
			typeof BaseError
		>("OtherError", BaseError)
		const err1 = new OtherError("msg1", { b: 2 })
		const err2 = new DataError("msg2", { a: 3 }, err1)
		expect(err2.data).toEqual({ a: 3 })
	})

	test("should support inheritance with extractor", () => {
		class NeedsDataError extends BaseError {
			public readonly baseField: string
			constructor(message: string, baseField: string, cause?: any) {
				super(message, cause)
				this.baseField = baseField
			}
		}
		const DataError = Errors.makeErrorTypeWithData<
			{ code: number; baseField: string },
			typeof NeedsDataError
		>("DataError", NeedsDataError, (data) => data.baseField)
		const MoreDataError = Errors.makeErrorTypeWithData<
			{ code: number; baseField: string; extra: string },
			typeof DataError
		>("MoreDataError", DataError, (data) => ({
			code: data.code,
			baseField: data.baseField,
		}))
		const err = new MoreDataError("msg", {
			code: 5,
			baseField: "x",
			extra: "y",
		})
		expect(err).toBeInstanceOf(MoreDataError)
		expect(err).toBeInstanceOf(DataError)
		expect((err as NeedsDataError).baseField).toBe("x")
		expect(err.data).toEqual({ code: 5, baseField: "x", extra: "y" })
	})
})
