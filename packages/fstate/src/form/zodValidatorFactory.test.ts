import { atom, createStore } from "jotai"
import { describe, expect, test } from "vitest"
import { z } from "zod"
import { FormErrorBag } from "./error"
import { FormDataBase } from "./internal/form"
import {
	FormZodErrorConverter,
	FormZodValidatorFactory,
} from "./zodValidatorFactory"

interface TestFormData extends FormDataBase {
	email: string
	age: number
	name: string
}

interface TestError {
	code: string
	message: string
	path?: string[]
}

const createTestConverter = (): FormZodErrorConverter<
	TestFormData,
	TestError
> => ({
	convertFieldError: (issue, fieldName) => {
		if (issue.path.length > 0 && issue.path[0] === fieldName) {
			return {
				code: issue.code,
				message: issue.message,
				path: issue.path.map(String),
			}
		}
		return null
	},
	convertGlobalError: (issue) => {
		if (issue.path.length === 0) {
			return { code: issue.code, message: issue.message }
		}
		return null
	},
})

const createSelectiveConverter = (): FormZodErrorConverter<
	TestFormData,
	TestError
> => ({
	convertFieldError: (issue, fieldName) => {
		if (fieldName === "email" && issue.code === "invalid_string") {
			return { code: "EMAIL_INVALID", message: "Invalid email format" }
		}
		if (fieldName === "age" && issue.code === "too_small") {
			return { code: "AGE_TOO_SMALL", message: "Age must be at least 18" }
		}
		return null
	},
	convertGlobalError: (issue) => {
		if (issue.code === "custom") {
			return { code: "GLOBAL_ERROR", message: "Global validation failed" }
		}
		return null
	},
})

const createTestSchema = () =>
	z.object({
		email: z.string().email(),
		age: z.number().min(18),
		name: z.string().min(1),
	})

describe("FormZodValidatorFactory", () => {
	test("should create validation result with correct structure", () => {
		const converter = createTestConverter()
		const factory = new FormZodValidatorFactory({
			errorConverter: converter,
			formData: { email: "", age: 0, name: "" } as TestFormData,
		})
		const schema = createTestSchema()
		const store = createStore()
		const formDataAtom = atom<TestFormData>({
			email: "test@example.com",
			age: 25,
			name: "John",
		})

		const result = factory.createValidationResult(schema, formDataAtom)

		expect(result).toHaveProperty("globalErrors")
		expect(result).toHaveProperty("fieldErrors")
		expect(result.fieldErrors).toHaveProperty("email")
		expect(result.fieldErrors).toHaveProperty("age")
		expect(result.fieldErrors).toHaveProperty("name")
	})

	test("should return empty error bags for valid data", () => {
		const converter = createTestConverter()
		const factory = new FormZodValidatorFactory({
			errorConverter: converter,
			formData: { email: "", age: 0, name: "" } satisfies TestFormData,
		})
		const schema = createTestSchema()
		const store = createStore()
		const formDataAtom = atom<TestFormData>({
			email: "test@example.com",
			age: 25,
			name: "John",
		})

		const result = factory.createValidationResult(schema, formDataAtom)

		const globalErrors = store.get(result.globalErrors)
		const emailErrors = store.get(result.fieldErrors.email)
		const ageErrors = store.get(result.fieldErrors.age)
		const nameErrors = store.get(result.fieldErrors.name)

		expect(globalErrors.isEmpty).toBe(true)
		expect(emailErrors.isEmpty).toBe(true)
		expect(ageErrors.isEmpty).toBe(true)
		expect(nameErrors.isEmpty).toBe(true)
	})

	test("should generate field errors for invalid data", () => {
		const converter = createTestConverter()
		const factory = new FormZodValidatorFactory({
			errorConverter: converter,
			formData: { email: "", age: 0, name: "" } as TestFormData,
		})
		const schema = createTestSchema()
		const store = createStore()
		const formDataAtom = atom<TestFormData>({
			email: "invalid-email",
			age: 16,
			name: "",
		})

		const result = factory.createValidationResult(schema, formDataAtom)

		const emailErrors = store.get(result.fieldErrors.email)
		const ageErrors = store.get(result.fieldErrors.age)
		const nameErrors = store.get(result.fieldErrors.name)

		expect(emailErrors.isEmpty).toBe(false)
		expect(ageErrors.isEmpty).toBe(false)
		expect(nameErrors.isEmpty).toBe(false)

		expect(emailErrors.errors).toHaveLength(1)
		expect(ageErrors.errors).toHaveLength(1)
		expect(nameErrors.errors).toHaveLength(1)
	})

	test("should handle selective error conversion", () => {
		const converter = createSelectiveConverter()
		const factory = new FormZodValidatorFactory({
			errorConverter: converter,
			formData: { email: "", age: 0, name: "" } as TestFormData,
		})
		const schema = createTestSchema()
		const store = createStore()
		const formDataAtom = atom<TestFormData>({
			email: "invalid-email",
			age: 16,
			name: "",
		})

		const result = factory.createValidationResult(schema, formDataAtom)

		const emailErrors = store.get(result.fieldErrors.email)
		const ageErrors = store.get(result.fieldErrors.age)
		const nameErrors = store.get(result.fieldErrors.name)

		expect(emailErrors.isEmpty).toBe(false)
		expect(emailErrors.first?.code).toBe("EMAIL_INVALID")
		expect(emailErrors.first?.message).toBe("Invalid email format")

		expect(ageErrors.isEmpty).toBe(false)
		expect(ageErrors.first?.code).toBe("AGE_TOO_SMALL")
		expect(ageErrors.first?.message).toBe("Age must be at least 18")

		expect(nameErrors.isEmpty).toBe(true)
	})

	test("should handle null return from converters", () => {
		const nullConverter: FormZodErrorConverter<TestFormData, TestError> = {
			convertFieldError: () => null,
			convertGlobalError: () => null,
		}
		const factory = new FormZodValidatorFactory({
			errorConverter: nullConverter,
			formData: { email: "", age: 0, name: "" } as TestFormData,
		})
		const schema = createTestSchema()
		const store = createStore()
		const formDataAtom = atom<TestFormData>({
			email: "invalid-email",
			age: 16,
			name: "",
		})

		const result = factory.createValidationResult(schema, formDataAtom)

		const globalErrors = store.get(result.globalErrors)
		const emailErrors = store.get(result.fieldErrors.email)

		expect(globalErrors.isEmpty).toBe(true)
		expect(emailErrors.isEmpty).toBe(true)
	})

	test("should handle dynamic field access via proxy", () => {
		const converter = createTestConverter()
		const factory = new FormZodValidatorFactory({
			errorConverter: converter,
			formData: { email: "", age: 0, name: "" } as TestFormData,
		})
		const schema = createTestSchema()
		const store = createStore()
		const formDataAtom = atom<TestFormData>({
			email: "invalid-email",
			age: 25,
			name: "John",
		})

		const result = factory.createValidationResult(schema, formDataAtom)

		const dynamicEmailErrors = store.get(result.fieldErrors["email"])
		const dynamicAgeErrors = store.get(result.fieldErrors["age"])

		expect(dynamicEmailErrors.isEmpty).toBe(false)
		expect(dynamicAgeErrors.isEmpty).toBe(true)
	})

	test("should handle global errors correctly", () => {
		const converter: FormZodErrorConverter<TestFormData, TestError> = {
			convertFieldError: () => null,
			convertGlobalError: (issue) => {
				if (issue.code === "custom") {
					return { code: "GLOBAL_CUSTOM", message: "Global error" }
				}
				return null
			},
		}

		const factory = new FormZodValidatorFactory({
			errorConverter: converter,
			formData: { email: "", age: 0, name: "" } as TestFormData,
		})
		const schema = z.custom<TestFormData>(() => false, {
			message: "Global validation failed",
		})
		const store = createStore()
		const formDataAtom = atom<TestFormData>({
			email: "test@example.com",
			age: 25,
			name: "John",
		})

		const result = factory.createValidationResult(schema, formDataAtom)

		const globalErrors = store.get(result.globalErrors)
		expect(globalErrors.isEmpty).toBe(false)
		expect(globalErrors.first?.code).toBe("GLOBAL_CUSTOM")
		expect(globalErrors.first?.message).toBe("Global error")
	})

	test("should update errors when form data changes", () => {
		const converter = createTestConverter()
		const factory = new FormZodValidatorFactory({
			errorConverter: converter,
			formData: { email: "", age: 0, name: "" } as TestFormData,
		})
		const schema = createTestSchema()
		const store = createStore()
		const formDataAtom = atom<TestFormData>({
			email: "invalid-email",
			age: 25,
			name: "John",
		})

		const result = factory.createValidationResult(schema, formDataAtom)

		let emailErrors = store.get(result.fieldErrors.email)
		expect(emailErrors.isEmpty).toBe(false)

		store.set(formDataAtom, {
			email: "valid@example.com",
			age: 25,
			name: "John",
		})

		emailErrors = store.get(result.fieldErrors.email)
		expect(emailErrors.isEmpty).toBe(true)
	})

	test("should handle reactive updates correctly", () => {
		const converter = createTestConverter()
		const factory = new FormZodValidatorFactory({
			errorConverter: converter,
			formData: { email: "", age: 0, name: "" } as TestFormData,
		})
		const schema = createTestSchema()
		const store = createStore()
		const formDataAtom = atom<TestFormData>({
			email: "invalid-email",
			age: 16,
			name: "John",
		})

		const result = factory.createValidationResult(schema, formDataAtom)
		const emailErrorsUpdates: FormErrorBag<TestError>[] = []

		store.sub(result.fieldErrors.email, () => {
			emailErrorsUpdates.push(store.get(result.fieldErrors.email))
		})

		const initialEmailErrors = store.get(result.fieldErrors.email)
		const initialAgeErrors = store.get(result.fieldErrors.age)
		expect(initialEmailErrors.isEmpty).toBe(false)
		expect(initialAgeErrors.isEmpty).toBe(false)

		store.set(formDataAtom, {
			email: "valid@example.com",
			age: 16,
			name: "John",
		})

		expect(emailErrorsUpdates).toHaveLength(1)
		expect(emailErrorsUpdates[0]?.isEmpty).toBe(true)

		const updatedAgeErrors = store.get(result.fieldErrors.age)
		expect(updatedAgeErrors.isEmpty).toBe(false)
	})
})
