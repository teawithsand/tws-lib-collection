import { Atom, atom, createStore } from "jotai"
import { describe, expect, test } from "vitest"
import { z } from "zod"
import { FormAtomsBuilder } from "./builder"
import { FormErrorBag } from "./error"
import { FormZodValidatorFactory } from "./zodValidatorFactory"

interface TestFormData {
	name: string
	email: string
	age: number
	isActive: boolean
}

describe("FormAtomsBuilder", () => {
	test("should build complete form with validation and disabled conditions", async () => {
		const initialValues: TestFormData = {
			name: "John Doe",
			email: "john@example.com",
			age: 25,
			isActive: true,
		}

		const builder = FormAtomsBuilder.fromDefaultValues(initialValues)

		builder.setGlobalValidator((formValue) => {
			return atom((get) => {
				const data = get(formValue)
				const errors: string[] = []

				if (data.age < 18) {
					errors.push("User must be at least 18 years old")
				}

				return FormErrorBag.fromArray(errors)
			})
		})

		builder.setFieldValidator("email", (fieldValue) => {
			return atom((get) => {
				const email = get(fieldValue)
				const errors: string[] = []

				if (!email.includes("@")) {
					errors.push("Invalid email format")
				}

				return FormErrorBag.fromArray(errors)
			})
		})

		builder.setFieldValidator("name", (fieldValue) => {
			return atom((get) => {
				const name = get(fieldValue)
				const errors: string[] = []

				if (name.length < 2) {
					errors.push("Name must be at least 2 characters")
				}

				return FormErrorBag.fromArray(errors)
			})
		})

		builder.setFieldDisabledCondition("age", (fieldValue, formValue) => {
			return atom((get) => {
				const form = get(formValue)
				return !form.isActive
			})
		})

		const form = builder.buildForm()
		const store = createStore()

		const loadableState = store.get(form.submitPromiseLoadable)
		if (loadableState.state === "loading") {
			await new Promise((resolve) => setTimeout(resolve, 50))
		}

		expect(store.get(form.fields.name.value)).toBe("John Doe")
		expect(store.get(form.fields.email.value)).toBe("john@example.com")
		expect(store.get(form.fields.age.value)).toBe(25)
		expect(store.get(form.fields.isActive.value)).toBe(true)

		expect(store.get(form.fields.name.pristine)).toBe(true)
		expect(store.get(form.fields.email.pristine)).toBe(true)

		expect(
			(store.get(form.fields.email.validationErrors) as FormErrorBag)
				.isEmpty,
		).toBe(true)
		expect(
			(store.get(form.fields.name.validationErrors) as FormErrorBag)
				.isEmpty,
		).toBe(true)
		expect(
			(store.get(form.globalValidationErrors) as FormErrorBag).isEmpty,
		).toBe(true)
		expect(store.get(form.hasErrors)).toBe(false)

		expect(store.get(form.fields.age.disabled)).toBe(false)
		expect(store.get(form.fields.name.disabled)).toBe(false)

		const formData = store.get(form.data)
		expect(formData).toEqual(initialValues)

		store.set(form.fields.name.value, "Jane")
		expect(store.get(form.fields.name.value)).toBe("Jane")
		expect(store.get(form.fields.name.pristine)).toBe(false)

		store.set(form.fields.email.value, "invalid-email")
		expect(
			(store.get(form.fields.email.validationErrors) as FormErrorBag)
				.isEmpty,
		).toBe(false)
		expect(
			(store.get(form.fields.email.validationErrors) as FormErrorBag)
				.first,
		).toBe("Invalid email format")
		expect(store.get(form.hasErrors)).toBe(true)

		store.set(form.fields.name.value, "J")
		expect(
			(store.get(form.fields.name.validationErrors) as FormErrorBag)
				.isEmpty,
		).toBe(false)
		expect(
			(store.get(form.fields.name.validationErrors) as FormErrorBag)
				.first,
		).toBe("Name must be at least 2 characters")

		store.set(form.fields.age.value, 16)
		expect(
			(store.get(form.globalValidationErrors) as FormErrorBag).isEmpty,
		).toBe(false)
		expect(
			(store.get(form.globalValidationErrors) as FormErrorBag).first,
		).toBe("User must be at least 18 years old")

		store.set(form.fields.isActive.value, false)
		expect(store.get(form.fields.age.disabled)).toBe(true)

		const updatedFormData = store.get(form.data)
		expect(updatedFormData).toEqual({
			name: "J",
			email: "invalid-email",
			age: 16,
			isActive: false,
		})

		let submittedData: TestFormData | null = null
		const submitPromise = store.set(form.submit, async (data) => {
			submittedData = data
			await new Promise((resolve) => setTimeout(resolve, 10))
		})

		expect(store.get(form.fields.name.disabled)).toBe(true)
		expect((store.get(form.submitPromiseLoadable) as any).state).toBe(
			"loading",
		)

		await submitPromise

		await new Promise((resolve) => setTimeout(resolve, 10))

		expect(store.get(form.fields.name.disabled)).toBe(false)
		expect(store.get(form.fields.age.disabled)).toBe(true)
		expect((store.get(form.submitPromiseLoadable) as any).state).toBe(
			"hasData",
		)

		expect(submittedData).toEqual({
			name: "J",
			email: "invalid-email",
			age: 16,
			isActive: false,
		})

		store.set(form.fields.name.value, "Jane Doe")
		store.set(form.fields.email.value, "jane@example.com")
		store.set(form.fields.age.value, 30)

		expect(
			(store.get(form.fields.name.validationErrors) as FormErrorBag)
				.isEmpty,
		).toBe(true)
		expect(
			(store.get(form.fields.email.validationErrors) as FormErrorBag)
				.isEmpty,
		).toBe(true)
		expect(
			(store.get(form.globalValidationErrors) as FormErrorBag).isEmpty,
		).toBe(true)
		expect(store.get(form.hasErrors)).toBe(false)
	})

	test("should integrate with FormZodValidatorFactory for schema-based validation", () => {
		const initialValues: TestFormData = {
			name: "John Doe",
			email: "john@example.com",
			age: 25,
			isActive: true,
		}

		const schema = z.object({
			name: z.string().min(2, "Name must be at least 2 characters"),
			email: z.string().email("Invalid email format"),
			age: z.number().min(18, "Must be at least 18 years old"),
			isActive: z.boolean(),
		})

		const zodValidatorFactory = new FormZodValidatorFactory<
			TestFormData,
			any
		>({
			errorConverter: {
				convertFieldError: (issue, fieldName) => {
					if (issue.path.length > 0 && issue.path[0] === fieldName) {
						return issue.message
					}
					return null
				},
				convertGlobalError: (issue) => {
					if (issue.path.length === 0) {
						return issue.message
					}
					return null
				},
			},
			formData: {
				age: null,
				email: null,
				name: null,
				isActive: null,
			},
		})

		const builder = FormAtomsBuilder.fromDefaultValues(initialValues)

		builder.setFormValidators(({ formData }) => {
			const zodValidation = zodValidatorFactory.createValidationResult(
				schema,
				formData,
			)

			return {
				global: () => zodValidation.globalErrors,
				fields: {
					name: () => zodValidation.fieldErrors.name,
					email: () => zodValidation.fieldErrors.email,
					age: () => zodValidation.fieldErrors.age,
					isActive: () => zodValidation.fieldErrors.isActive,
				},
			}
		})

		const form = builder.buildForm()
		const store = createStore()

		expect(store.get(form.fields.name.value)).toBe("John Doe")
		expect(store.get(form.fields.email.value)).toBe("john@example.com")
		expect(store.get(form.fields.age.value)).toBe(25)

		expect(
			(store.get(form.fields.name.validationErrors) as FormErrorBag)
				.isEmpty,
		).toBe(true)
		expect(
			(store.get(form.fields.email.validationErrors) as FormErrorBag)
				.isEmpty,
		).toBe(true)
		expect(
			(store.get(form.globalValidationErrors) as FormErrorBag).isEmpty,
		).toBe(true)
		expect(store.get(form.hasErrors)).toBe(false)

		store.set(form.fields.name.value, "J")
		expect(
			(store.get(form.fields.name.validationErrors) as FormErrorBag)
				.isEmpty,
		).toBe(false)
		expect(
			(store.get(form.fields.name.validationErrors) as FormErrorBag)
				.first,
		).toBe("Name must be at least 2 characters")

		store.set(form.fields.email.value, "invalid-email")
		expect(
			(store.get(form.fields.email.validationErrors) as FormErrorBag)
				.isEmpty,
		).toBe(false)
		expect(
			(store.get(form.fields.email.validationErrors) as FormErrorBag)
				.first,
		).toBe("Invalid email format")

		store.set(form.fields.age.value, 16)
		expect(
			(store.get(form.fields.age.validationErrors) as FormErrorBag)
				.isEmpty,
		).toBe(false)
		expect(
			(store.get(form.fields.age.validationErrors) as FormErrorBag).first,
		).toBe("Must be at least 18 years old")

		expect(store.get(form.hasErrors)).toBe(true)

		store.set(form.fields.name.value, "Jane Doe")
		store.set(form.fields.email.value, "jane@example.com")
		store.set(form.fields.age.value, 30)

		expect(
			(store.get(form.fields.name.validationErrors) as FormErrorBag)
				.isEmpty,
		).toBe(true)
		expect(
			(store.get(form.fields.email.validationErrors) as FormErrorBag)
				.isEmpty,
		).toBe(true)
		expect(
			(store.get(form.fields.age.validationErrors) as FormErrorBag)
				.isEmpty,
		).toBe(true)
		expect(store.get(form.hasErrors)).toBe(false)
	})
})
