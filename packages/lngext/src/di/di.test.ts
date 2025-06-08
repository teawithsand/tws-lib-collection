import { describe, expect, test } from "vitest"

import { DIBuilder, DIContents, DIDefinitionObject, DIError } from "."

interface TestDIContents extends DIContents {
	serviceA: string
	serviceB: number
	serviceC: boolean // A boolean value
	serviceD: string[] // An array of strings
}

const defObject: DIDefinitionObject<TestDIContents> = {
	serviceA: undefined,
	serviceB: undefined,
	serviceC: undefined,
	serviceD: undefined,
}

describe("Advanced DIBuilder Tests", () => {
	test("should allow factory dependencies resolving correctly", async () => {
		const diBuilder = DIBuilder.create<TestDIContents>()
			.setFactory("serviceA", async () => "Value A")
			.setFactory("serviceB", async () => 42)
			.setFactory("serviceC", async (di) => di.get("serviceB") > 0)

		const di = await diBuilder.build()

		expect(di.get("serviceC")).toBe(true)
	})

	test("should reuse existing instances between factories", async () => {
		const diBuilder = DIBuilder.create<TestDIContents>()
			.setFactory("serviceA", async () => "Value A")
			.setFactory("serviceB", async (di) => di.get("serviceA").length)

		const di = await diBuilder.build()

		expect(di.get("serviceB")).toBe(7)
	})

	test("should throw DIError on accessing undefined services", () => {
		const diBuilder = DIBuilder.create<TestDIContents>()
			.setFactory("serviceA", async () => "Value A")
			.setValue("serviceB", 42)

		expect(() =>
			diBuilder.assertAllDefinedWithDefinitionObject(defObject),
		).toThrow(DIError)
	})

	test("should throw while asserting incomplete setup with assertAllDefinedWithDefinitionObject", () => {
		const diBuilder = DIBuilder.create<TestDIContents>().setFactory(
			"serviceA",
			async () => "Value A",
		)

		expect(() =>
			diBuilder.assertAllDefinedWithDefinitionObject(defObject),
		).toThrow(DIError)
	})

	test("should handle multiple value types and verify outputs", async () => {
		const diBuilder = DIBuilder.create<TestDIContents>()
			.setValue("serviceA", "Testing Value A")
			.setValue("serviceB", 100)
			.setValue("serviceC", true)
			.setValue("serviceD", ["Item 1", "Item 2"])

		const di = await diBuilder.build()

		expect(di.get("serviceA")).toBe("Testing Value A")
		expect(di.get("serviceB")).toBe(100)
		expect(di.get("serviceC")).toBe(true)
		expect(di.get("serviceD")).toEqual(["Item 1", "Item 2"])
	})

	test("should throw DIError when trying to get non-existent service", async () => {
		const diBuilder = DIBuilder.create<TestDIContents>().setValue(
			"serviceA",
			"Test",
		)

		const di = await diBuilder.build()

		expect(() => di.get("serviceB")).toThrow(DIError)
	})

	test("should handle factory throwing errors during build", async () => {
		const diBuilder = DIBuilder.create<TestDIContents>().setFactory(
			"serviceA",
			async () => {
				throw new Error("Factory error")
			},
		)

		await expect(diBuilder.build()).rejects.toThrow(DIError)
	})

	test("should clone builder correctly", async () => {
		const originalBuilder = DIBuilder.create<TestDIContents>()
			.setValue("serviceA", "Original")
			.setFactory("serviceB", async () => 42)

		const clonedBuilder = originalBuilder.clone().setValue("serviceC", true)

		const originalDI = await originalBuilder.build()
		const clonedDI = await clonedBuilder.build()

		expect(originalDI.get("serviceA")).toBe("Original")
		expect(originalDI.get("serviceB")).toBe(42)
		expect(() => originalDI.get("serviceC")).toThrow(DIError)

		expect(clonedDI.get("serviceA")).toBe("Original")
		expect(clonedDI.get("serviceB")).toBe(42)
		expect(clonedDI.get("serviceC")).toBe(true)
	})

	test("should handle assertAllDefinesWithKeyofArray correctly", () => {
		const diBuilder = DIBuilder.create<TestDIContents>()
			.setValue("serviceA", "Test")
			.setValue("serviceB", 42)

		expect(() =>
			diBuilder.assertAllDefinesWithKeyofArray(["serviceA", "serviceB"]),
		).not.toThrow()

		expect(() =>
			diBuilder.assertAllDefinesWithKeyofArray([
				"serviceA",
				"serviceB",
				"serviceC",
			]),
		).toThrow(DIError)
	})

	test("should respect factory execution order", async () => {
		const executionOrder: string[] = []

		const diBuilder = DIBuilder.create<TestDIContents>()
			.setValue("serviceA", "Value A") // setValue gets order -1, should execute first
			.setFactory("serviceB", async () => {
				executionOrder.push("serviceB")
				return 42
			})
			.setFactory("serviceC", async () => {
				executionOrder.push("serviceC")
				return true
			})
			.setFactory("serviceD", async (di) => {
				executionOrder.push("serviceD")
				// This depends on serviceA, but should still execute after other factories
				return [di.get("serviceA")]
			})

		await diBuilder.build()

		// serviceB should execute before serviceC and serviceD due to order
		expect(executionOrder.indexOf("serviceB")).toBeLessThan(
			executionOrder.indexOf("serviceC"),
		)
		expect(executionOrder.indexOf("serviceC")).toBeLessThan(
			executionOrder.indexOf("serviceD"),
		)
	})

	test("should handle async factory dependencies correctly", async () => {
		const diBuilder = DIBuilder.create<TestDIContents>()
			.setFactory("serviceA", async () => {
				// Simulate async work
				await new Promise((resolve) => setTimeout(resolve, 10))
				return "Async Value A"
			})
			.setFactory("serviceB", async (di) => {
				// This should wait for serviceA to complete
				const serviceA = di.get("serviceA")
				return serviceA.length
			})

		const di = await diBuilder.build()

		expect(di.get("serviceA")).toBe("Async Value A")
		expect(di.get("serviceB")).toBe(13)
	})
})
