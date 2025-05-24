import { describe, expect, test, vi } from "vitest"
import { Serializer } from "./serializer"
import { SerializerTester, type TestData } from "./tester"

// Simple types for testing
interface SimpleOwned {
	id: number
	name: string
	active: boolean
	createdAt: Date
	tags: string[]
}

interface SimpleStored {
	id: number
	name: string
	active: boolean
	createdAt: string // Date stored as ISO string
	tags: string[]
}

// Mock serializer implementation
class MockSerializer implements Serializer<SimpleStored, SimpleOwned> {
	public readonly correctSerialization: boolean
	public readonly correctDeserialization: boolean

	public constructor({
		correctSerialization = true,
		correctDeserialization = true,
	}: {
		correctSerialization?: boolean
		correctDeserialization?: boolean
	} = {}) {
		this.correctSerialization = correctSerialization
		this.correctDeserialization = correctDeserialization
	}

	public readonly serialize = (owned: SimpleOwned): SimpleStored => {
		const result: SimpleStored = {
			id: owned.id,
			name: owned.name,
			active: owned.active,
			createdAt: owned.createdAt.toISOString(),
			tags: [...owned.tags],
		}

		// Introduce an error if not correct serialization
		if (!this.correctSerialization) {
			result.name = "WRONG_" + result.name
		}

		return result
	}

	public readonly deserializer = (stored: SimpleStored): SimpleOwned => {
		const result: SimpleOwned = {
			id: stored.id,
			name: stored.name,
			active: stored.active,
			createdAt: new Date(stored.createdAt),
			tags: [...stored.tags],
		}

		// Introduce an error if not correct deserialization
		if (!this.correctDeserialization) {
			result.id = -result.id
		}

		return result
	}
}

describe("SerializerTester", () => {
	// Sample test data
	const createTestData = (): TestData<SimpleStored, SimpleOwned> => ({
		storedExamples: [
			{
				id: 1,
				name: "item1",
				active: true,
				createdAt: "2023-01-01T00:00:00.000Z",
				tags: ["a", "b"],
			},
			{
				id: 2,
				name: "item2",
				active: false,
				createdAt: "2023-01-02T00:00:00.000Z",
				tags: [],
			},
		],
		ownedExamples: [
			{
				id: 3,
				name: "item3",
				active: true,
				createdAt: new Date("2023-01-03T00:00:00.000Z"),
				tags: ["c", "d"],
			},
			{
				id: 4,
				name: "item4",
				active: false,
				createdAt: new Date("2023-01-04T00:00:00.000Z"),
				tags: ["e"],
			},
		],
		pairExamples: [
			[
				{
					id: 5,
					name: "item5",
					active: true,
					createdAt: "2023-01-05T00:00:00.000Z",
					tags: ["f", "g"],
				},
				{
					id: 5,
					name: "item5",
					active: true,
					createdAt: new Date("2023-01-05T00:00:00.000Z"),
					tags: ["f", "g"],
				},
			],
			[
				{
					id: 6,
					name: "item6",
					active: false,
					createdAt: "2023-01-06T00:00:00.000Z",
					tags: [],
				},
				{
					id: 6,
					name: "item6",
					active: false,
					createdAt: new Date("2023-01-06T00:00:00.000Z"),
					tags: [],
				},
			],
		],
	})

	test("passes when serializer performs correct serialization and deserialization", () => {
		const testData = createTestData()
		const serializer = new MockSerializer()
		const tester = new SerializerTester({ testData, serializer })

		expect(() => tester.runAllTests()).not.toThrow()
	})

	test("detects invalid serialization in owned examples", () => {
		const testData = createTestData()
		const serializer = new MockSerializer({ correctSerialization: false })
		const tester = new SerializerTester({ testData, serializer })

		expect(() => tester.testSerialize()).toThrow()
	})

	test("detects invalid deserialization in stored examples", () => {
		const testData = createTestData()
		const serializer = new MockSerializer({ correctDeserialization: false })
		const tester = new SerializerTester({ testData, serializer })

		expect(() => tester.testDeserialize()).toThrow()
	})

	test("detects invalid round trip in owned examples", () => {
		const testData = createTestData()
		// Both operations are required for successful round trip
		const serializer = new MockSerializer({
			correctSerialization: true,
			correctDeserialization: false,
		})
		const tester = new SerializerTester({ testData, serializer })

		expect(() => tester.testRoundTrip()).toThrow()
	})

	test("detects invalid round trip in stored examples", () => {
		const testData = createTestData()
		// Both operations are required for successful round trip
		const serializer = new MockSerializer({
			correctSerialization: false,
			correctDeserialization: true,
		})
		const tester = new SerializerTester({ testData, serializer })

		expect(() => tester.testRoundTrip()).toThrow()
	})

	test("verifies specific test methods work independently", () => {
		const testData = createTestData()
		const goodSerializer = new MockSerializer()
		const badSerializerOnly = new MockSerializer({
			correctSerialization: false,
		})
		const badDeserializerOnly = new MockSerializer({
			correctDeserialization: false,
		})

		// Good serializer passes both tests
		const goodTester = new SerializerTester({
			testData,
			serializer: goodSerializer,
		})
		expect(() => goodTester.testSerialize()).not.toThrow()
		expect(() => goodTester.testDeserialize()).not.toThrow()

		// Bad serializer fails serialization but passes deserialization
		const badSerializeTester = new SerializerTester({
			testData,
			serializer: badSerializerOnly,
		})
		expect(() => badSerializeTester.testSerialize()).toThrow()
		expect(() => badSerializeTester.testDeserialize()).not.toThrow()

		// Bad deserializer fails deserialization but passes serialization
		const badDeserializeTester = new SerializerTester({
			testData,
			serializer: badDeserializerOnly,
		})
		expect(() => badDeserializeTester.testSerialize()).not.toThrow()
		expect(() => badDeserializeTester.testDeserialize()).toThrow()
	})

	describe("deepEqual", () => {
		// Need to access the private deepEqual method for testing
		// Create a test fixture that exposes it
		const createTesterWithExposedDeepEqual = (): {
			deepEqual: (a: unknown, b: unknown) => boolean
		} => {
			const testData = createTestData()
			const serializer = new MockSerializer()
			const tester = new SerializerTester({ testData, serializer })

			return {
				deepEqual: (a: unknown, b: unknown) => {
					let result = false
					try {
						// Use the assertEquivalent method and catch any errors
						// If no errors, the values are equal
						tester["assertEquivalent"](a, b, "Test comparison")
						result = true
					} catch {
						result = false
					}
					return result
				},
			}
		}

		test("handles primitive types correctly", () => {
			const { deepEqual } = createTesterWithExposedDeepEqual()

			expect(deepEqual(1, 1)).toBe(true)
			expect(deepEqual("test", "test")).toBe(true)
			expect(deepEqual(true, true)).toBe(true)
			expect(deepEqual(null, null)).toBe(true)
			expect(deepEqual(undefined, undefined)).toBe(true)

			expect(deepEqual(1, 2)).toBe(false)
			expect(deepEqual("test", "other")).toBe(false)
			expect(deepEqual(true, false)).toBe(false)
			expect(deepEqual(null, undefined)).toBe(false)
			expect(deepEqual(0, false)).toBe(false) // Strict equality
		})

		test("handles arrays correctly", () => {
			const { deepEqual } = createTesterWithExposedDeepEqual()

			expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true)
			expect(deepEqual(["a", "b"], ["a", "b"])).toBe(true)
			expect(deepEqual([[1, 2], 3], [[1, 2], 3])).toBe(true)

			expect(deepEqual([1, 2, 3], [1, 2, 4])).toBe(false)
			expect(deepEqual([1, 2, 3], [1, 2])).toBe(false)
			expect(deepEqual([1, 2], [2, 1])).toBe(false) // Order matters
		})

		test("handles Date objects correctly", () => {
			const { deepEqual } = createTesterWithExposedDeepEqual()

			const date1 = new Date("2023-01-01")
			const date2 = new Date("2023-01-01")
			const date3 = new Date("2023-02-01")

			expect(deepEqual(date1, date2)).toBe(true)
			expect(deepEqual(date1, date3)).toBe(false)

			// Date string vs Date object should not be equal
			expect(deepEqual("2023-01-01", date1)).toBe(false)
		})

		test("handles objects correctly", () => {
			const { deepEqual } = createTesterWithExposedDeepEqual()

			expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true)
			expect(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true) // Order doesn't matter
			expect(deepEqual({ a: { b: 1 } }, { a: { b: 1 } })).toBe(true)

			expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false)
			expect(deepEqual({ a: 1, b: 2 }, { a: 1 })).toBe(false)
			expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false)
		})

		test("handles complex nested structures", () => {
			const { deepEqual } = createTesterWithExposedDeepEqual()

			const complex1 = {
				id: 1,
				data: {
					name: "test",
					values: [1, 2, { inner: "value" }],
				},
				dates: [new Date("2023-01-01"), new Date("2023-02-01")],
			}

			const complex2 = {
				id: 1,
				data: {
					name: "test",
					values: [1, 2, { inner: "value" }],
				},
				dates: [new Date("2023-01-01"), new Date("2023-02-01")],
			}

			const complex3 = {
				id: 1,
				data: {
					name: "test",
					values: [1, 2, { inner: "different" }],
				},
				dates: [new Date("2023-01-01"), new Date("2023-02-01")],
			}

			expect(deepEqual(complex1, complex2)).toBe(true)
			expect(deepEqual(complex1, complex3)).toBe(false)
		})

		test("handles edge cases", () => {
			const { deepEqual } = createTesterWithExposedDeepEqual()

			// Empty collections
			expect(deepEqual({}, {})).toBe(true)
			expect(deepEqual([], [])).toBe(true)
			expect(deepEqual({}, [])).toBe(false)

			// Object with array vs array
			expect(deepEqual({ 0: "a", 1: "b", length: 2 }, ["a", "b"])).toBe(
				false,
			)

			// Handling null and undefined in objects
			expect(deepEqual({ a: null }, { a: null })).toBe(true)
			expect(deepEqual({ a: undefined }, { a: undefined })).toBe(true)
			expect(deepEqual({ a: null }, { a: undefined })).toBe(false)

			// Property existence
			expect(deepEqual({ a: undefined }, {})).toBe(false)

			// Special numeric values
			expect(deepEqual(NaN, NaN)).toBe(true) // NaN should be considered equal to itself
			expect(deepEqual(Infinity, Infinity)).toBe(true)
			expect(deepEqual(-0, 0)).toBe(true)
		})

		test("handles NaN values correctly", () => {
			const { deepEqual } = createTesterWithExposedDeepEqual()

			expect(deepEqual(NaN, NaN)).toBe(true)
			expect(deepEqual({ value: NaN }, { value: NaN })).toBe(true)
			expect(deepEqual([1, NaN, 3], [1, NaN, 3])).toBe(true)

			expect(deepEqual(NaN, 0)).toBe(false)
			expect(deepEqual(NaN, null)).toBe(false)
			expect(deepEqual(NaN, undefined)).toBe(false)
			expect(deepEqual({ value: NaN }, { value: 0 })).toBe(false)
			expect(deepEqual([1, NaN, 3], [1, 0, 3])).toBe(false)
		})
	})
})
