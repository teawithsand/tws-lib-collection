import { SerializerUtil } from "@teawithsand/reserd"
import { beforeEach, describe, expect, test } from "vitest"
import { z } from "zod"
import { createStore, JotaiStore } from "../../libs"
import { ConfigSpec } from "../types"
import { ConfigAtomsHelper } from "./configAtomsImpl"

type Values = {
	a: string
	b: number
}

const typeSpec: ConfigSpec<Values> = {
	a: {
		defaultValue: "",
		serializer: SerializerUtil.fromZodSchema(z.string()),
	},
	b: {
		defaultValue: 0,
		serializer: SerializerUtil.fromZodSchema(z.number()),
	},
}

describe("ConfigAtomsHelper", () => {
	let helper: ConfigAtomsHelper<Values>
	let store: JotaiStore

	beforeEach(() => {
		store = createStore()
		helper = new ConfigAtomsHelper({
			spec: typeSpec,
			store,
		})
	})

	test("initially atoms have default values", async () => {
		const consistentA = await store.get(helper.consistentAtoms.a)
		const consistentB = await store.get(helper.consistentAtoms.b)
		expect(consistentA).toBe(typeSpec.a.defaultValue)
		expect(consistentB).toBe(typeSpec.b.defaultValue)

		expect(store.get(helper.eventuallyConsistentAtoms.a)).toBe(
			typeSpec.a.defaultValue,
		)
		expect(store.get(helper.eventuallyConsistentAtoms.b)).toBe(
			typeSpec.b.defaultValue,
		)
	})

	test("consistent atoms are set when promise resolves", async () => {
		// Arrange
		const newValue = "new-string-value"
		const resolvedPromise = Promise.resolve(newValue)

		// Act
		helper.loadValue("a", resolvedPromise)

		// Assert
		const consistentValue = await store.get(helper.consistentAtoms.a)
		expect(consistentValue).toBe(newValue)
	})

	test("consistent atoms are set when promise rejects", async () => {
		// Arrange
		const error = new Error("Test error")
		const rejectedPromise = Promise.reject(error)

		// Act
		helper.loadValue("a", rejectedPromise)

		// Assert
		await expect(store.get(helper.consistentAtoms.a)).rejects.toThrow(
			"Test error",
		)
	})

	test("inconsistent atoms are set when promise resolves", async () => {
		// Arrange
		const newValue = 42
		const resolvedPromise = Promise.resolve(newValue)

		// Act
		helper.loadValue("b", resolvedPromise)
		await resolvedPromise
		await new Promise((resolve) => setTimeout(resolve, 10))

		// Assert - eventually consistent atom should be updated to the new value
		expect(store.get(helper.eventuallyConsistentAtoms.b)).toBe(newValue)
	})

	test("inconsistent atoms are skipped when promise rejects", async () => {
		// Arrange
		const originalValue = store.get(helper.eventuallyConsistentAtoms.a)
		const error = new Error("Test error")
		const rejectedPromise = Promise.reject(error)

		// Act
		helper.loadValue("a", rejectedPromise)
		await rejectedPromise.catch(() => {})
		await new Promise((resolve) => setTimeout(resolve, 0))

		// Assert
		expect(store.get(helper.eventuallyConsistentAtoms.a)).toBe(
			originalValue,
		)
	})
})
