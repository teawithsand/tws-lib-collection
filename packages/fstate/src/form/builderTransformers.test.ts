import { createStore } from "jotai"
import { describe, expect, test } from "vitest"
import { FormAtomsBuilder } from "./builder"

interface TestFormData {
	name: string
	count: number
}

describe("FormAtomsBuilder - Submit Transforms", () => {
	test("should apply global preSubmitMutator and persist changes", async () => {
		const initialValues: TestFormData = { name: "test", count: 5 }
		const builder = FormAtomsBuilder.fromDefaultValues(initialValues)

		builder.setPreSubmitMutator((data) => ({
			...data,
			name: data.name.toUpperCase(),
			count: data.count * 2,
		}))

		const form = builder.buildForm()
		const store = createStore()

		let submittedData: TestFormData | null = null
		await store.set(form.submit, async (data) => {
			submittedData = data
		})

		// Check that mutations were persisted to form
		expect(store.get(form.fields.name.value)).toBe("TEST")
		expect(store.get(form.fields.count.value)).toBe(10)

		// Check that callback received mutated data
		expect(submittedData).toEqual({ name: "TEST", count: 10 })
	})

	test("should apply global preSubmitMapper without persisting changes", async () => {
		const initialValues: TestFormData = { name: "test", count: 5 }
		const builder = FormAtomsBuilder.fromDefaultValues(initialValues)

		builder.setPreSubmitMapper((data) => ({
			...data,
			name: data.name.toUpperCase(),
			count: data.count * 2,
		}))

		const form = builder.buildForm()
		const store = createStore()

		let submittedData: TestFormData | null = null
		await store.set(form.submit, async (data) => {
			submittedData = data
		})

		// Check that form values remain unchanged
		expect(store.get(form.fields.name.value)).toBe("test")
		expect(store.get(form.fields.count.value)).toBe(5)

		// Check that callback received mapped data
		expect(submittedData).toEqual({ name: "TEST", count: 10 })
	})

	test("should apply per-field preSubmitMutators and persist changes", async () => {
		const initialValues: TestFormData = { name: "test", count: 5 }
		const builder = FormAtomsBuilder.fromDefaultValues(initialValues)

		builder.setFieldPreSubmitMutator("name", (value) => value.toUpperCase())
		builder.setFieldPreSubmitMutator("count", (value) => value * 3)

		const form = builder.buildForm()
		const store = createStore()

		let submittedData: TestFormData | null = null
		await store.set(form.submit, async (data) => {
			submittedData = data
		})

		// Check that mutations were persisted to form
		expect(store.get(form.fields.name.value)).toBe("TEST")
		expect(store.get(form.fields.count.value)).toBe(15)

		// Check that callback received mutated data
		expect(submittedData).toEqual({ name: "TEST", count: 15 })
	})

	test("should apply per-field preSubmitMappers without persisting changes", async () => {
		const initialValues: TestFormData = { name: "test", count: 5 }
		const builder = FormAtomsBuilder.fromDefaultValues(initialValues)

		builder.setFieldPreSubmitMapper("name", (value) => value.toUpperCase())
		builder.setFieldPreSubmitMapper("count", (value) => value * 3)

		const form = builder.buildForm()
		const store = createStore()

		let submittedData: TestFormData | null = null
		await store.set(form.submit, async (data) => {
			submittedData = data
		})

		// Check that form values remain unchanged
		expect(store.get(form.fields.name.value)).toBe("test")
		expect(store.get(form.fields.count.value)).toBe(5)

		// Check that callback received mapped data
		expect(submittedData).toEqual({ name: "TEST", count: 15 })
	})

	test("should apply transforms in correct order: field mutators -> global mutator -> field mappers -> global mapper", async () => {
		const initialValues: TestFormData = { name: "test", count: 1 }
		const builder = FormAtomsBuilder.fromDefaultValues(initialValues)

		builder.setFieldPreSubmitMutator("count", (value) => value + 1) // 1 -> 2
		builder.setPreSubmitMutator((data) => ({
			...data,
			count: data.count * 10,
		})) // 2 -> 20
		builder.setFieldPreSubmitMapper("count", (value) => value + 5) // 20 -> 25
		builder.setPreSubmitMapper((data) => ({
			...data,
			count: data.count * 2,
		})) // 25 -> 50

		const form = builder.buildForm()
		const store = createStore()

		let submittedData: TestFormData | null = null
		await store.set(form.submit, async (data) => {
			submittedData = data
		})

		// Check that only mutators were persisted (field mutator + global mutator)
		expect(store.get(form.fields.count.value)).toBe(20)

		// Check that callback received all transforms applied
		expect(submittedData!.count).toBe(50)
	})

	test("should handle mixed field and global transforms", async () => {
		const initialValues: TestFormData = { name: "hello", count: 2 }
		const builder = FormAtomsBuilder.fromDefaultValues(initialValues)

		builder.setFieldPreSubmitMutator("name", (value) => `${value}!`)
		builder.setPreSubmitMutator((data) => ({
			...data,
			count: data.count * 5,
		}))
		builder.setFieldPreSubmitMapper("name", (value) => value.toUpperCase())
		builder.setPreSubmitMapper((data) => ({
			...data,
			count: data.count + 100,
		}))

		const form = builder.buildForm()
		const store = createStore()

		let submittedData: TestFormData | null = null
		await store.set(form.submit, async (data) => {
			submittedData = data
		})

		// Check persisted mutations
		expect(store.get(form.fields.name.value)).toBe("hello!")
		expect(store.get(form.fields.count.value)).toBe(10)

		// Check final callback data with all transforms
		expect(submittedData).toEqual({ name: "HELLO!", count: 110 })
	})

	test("should verify step-by-step data transformation within submit function", async () => {
		const initialValues: TestFormData = { name: "start", count: 10 }
		const builder = FormAtomsBuilder.fromDefaultValues(initialValues)

		const transformationSteps: Array<{ step: string; data: TestFormData }> =
			[]

		// Track each transformation step
		builder.setFieldPreSubmitMutator("name", (value) => {
			const result = `${value}_field_mutated`
			transformationSteps.push({
				step: "field mutator",
				data: {
					name: result,
					count:
						transformationSteps.length > 0
							? transformationSteps[
									transformationSteps.length - 1
								].data.count
							: 10,
				},
			})
			return result
		})

		builder.setPreSubmitMutator((data) => {
			const result = { ...data, count: data.count + 5 }
			transformationSteps.push({ step: "global mutator", data: result })
			return result
		})

		builder.setFieldPreSubmitMapper("count", (value) => {
			const result = value * 2
			transformationSteps.push({
				step: "field mapper",
				data: {
					name: transformationSteps[transformationSteps.length - 1]
						.data.name,
					count: result,
				},
			})
			return result
		})

		builder.setPreSubmitMapper((data) => {
			const result = { ...data, name: `${data.name}_global_mapped` }
			transformationSteps.push({ step: "global mapper", data: result })
			return result
		})

		const form = builder.buildForm()
		const store = createStore()

		let submittedData: TestFormData | null = null
		await store.set(form.submit, async (data) => {
			submittedData = data
		})

		// Verify transformation sequence
		expect(transformationSteps).toHaveLength(4)
		expect(transformationSteps[0]).toEqual({
			step: "field mutator",
			data: { name: "start_field_mutated", count: 10 },
		})
		expect(transformationSteps[1]).toEqual({
			step: "global mutator",
			data: { name: "start_field_mutated", count: 15 },
		})
		expect(transformationSteps[2]).toEqual({
			step: "field mapper",
			data: { name: "start_field_mutated", count: 30 },
		})
		expect(transformationSteps[3]).toEqual({
			step: "global mapper",
			data: { name: "start_field_mutated_global_mapped", count: 30 },
		})

		// Verify final submitted data matches last transformation
		expect(submittedData).toEqual({
			name: "start_field_mutated_global_mapped",
			count: 30,
		})

		// Verify only mutators were persisted to form (not mappers)
		expect(store.get(form.fields.name.value)).toBe("start_field_mutated")
		expect(store.get(form.fields.count.value)).toBe(15)
	})
})
