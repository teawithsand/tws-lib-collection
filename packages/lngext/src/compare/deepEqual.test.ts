import { describe, expect, test } from "vitest"
import { Timestamp } from "../timestamp"
import { DeepEqualComparator } from "./deepEqualComparator"

describe("DeepEquals", () => {
	const comparator = new DeepEqualComparator()

	describe("primitives", () => {
		test("should return true for identical primitives", () => {
			expect(comparator.equals(1, 1)).toBe(true)
			expect(comparator.equals("hello", "hello")).toBe(true)
			expect(comparator.equals(true, true)).toBe(true)
			expect(comparator.equals(false, false)).toBe(true)
			expect(comparator.equals(null, null)).toBe(true)
			expect(comparator.equals(undefined, undefined)).toBe(true)
		})

		test("should return false for different primitives", () => {
			expect(comparator.equals(1, 2)).toBe(false)
			expect(comparator.equals("hello", "world")).toBe(false)
			expect(comparator.equals(true, false)).toBe(false)
			expect(comparator.equals(null, undefined)).toBe(false)
			expect(comparator.equals(0, false)).toBe(false)
			expect(comparator.equals("", false)).toBe(false)
		})

		test("should handle NaN correctly", () => {
			expect(comparator.equals(NaN, NaN)).toBe(true)
			expect(comparator.equals(NaN, 1)).toBe(false)
			expect(comparator.equals(1, NaN)).toBe(false)
		})

		test("should handle special numbers", () => {
			expect(comparator.equals(Infinity, Infinity)).toBe(true)
			expect(comparator.equals(-Infinity, -Infinity)).toBe(true)
			expect(comparator.equals(Infinity, -Infinity)).toBe(false)
			expect(comparator.equals(0, -0)).toBe(true)
		})
	})

	describe("objects", () => {
		test("should return true for identical empty objects", () => {
			expect(comparator.equals({}, {})).toBe(true)
		})

		test("should return true for objects with same properties", () => {
			const obj1 = { a: 1, b: "hello" }
			const obj2 = { a: 1, b: "hello" }
			expect(comparator.equals(obj1, obj2)).toBe(true)
		})

		test("should return true for objects with same properties in different order", () => {
			const obj1 = { a: 1, b: "hello" }
			const obj2 = { b: "hello", a: 1 }
			expect(comparator.equals(obj1, obj2)).toBe(true)
		})

		test("should return false for objects with different properties", () => {
			const obj1 = { a: 1, b: "hello" }
			const obj2 = { a: 1, b: "world" }
			expect(comparator.equals(obj1, obj2)).toBe(false)
		})

		test("should return false for objects with different number of properties", () => {
			const obj1 = { a: 1 }
			const obj2 = { a: 1, b: "hello" }
			expect(comparator.equals(obj1, obj2)).toBe(false)
		})

		test("should handle nested objects", () => {
			const obj1 = { a: { b: { c: 1 } } }
			const obj2 = { a: { b: { c: 1 } } }
			const obj3 = { a: { b: { c: 2 } } }
			expect(comparator.equals(obj1, obj2)).toBe(true)
			expect(comparator.equals(obj1, obj3)).toBe(false)
		})

		test("should handle objects with NaN values", () => {
			const obj1 = { value: NaN }
			const obj2 = { value: NaN }
			const obj3 = { value: 1 }
			expect(comparator.equals(obj1, obj2)).toBe(true)
			expect(comparator.equals(obj1, obj3)).toBe(false)
		})
	})

	describe("arrays", () => {
		test("should return true for identical empty arrays", () => {
			expect(comparator.equals([], [])).toBe(true)
		})

		test("should return true for arrays with same elements", () => {
			expect(comparator.equals([1, 2, 3], [1, 2, 3])).toBe(true)
			expect(comparator.equals(["a", "b"], ["a", "b"])).toBe(true)
		})

		test("should return false for arrays with different elements", () => {
			expect(comparator.equals([1, 2, 3], [1, 2, 4])).toBe(false)
			expect(comparator.equals(["a", "b"], ["a", "c"])).toBe(false)
		})

		test("should return false for arrays with different lengths", () => {
			expect(comparator.equals([1, 2], [1, 2, 3])).toBe(false)
			expect(comparator.equals([1, 2, 3], [1, 2])).toBe(false)
		})

		test("should return false for arrays with same elements in different order", () => {
			expect(comparator.equals([1, 2, 3], [3, 2, 1])).toBe(false)
		})

		test("should handle nested arrays", () => {
			expect(
				comparator.equals(
					[
						[1, 2],
						[3, 4],
					],
					[
						[1, 2],
						[3, 4],
					],
				),
			).toBe(true)
			expect(
				comparator.equals(
					[
						[1, 2],
						[3, 4],
					],
					[
						[1, 2],
						[3, 5],
					],
				),
			).toBe(false)
		})

		test("should handle arrays with objects", () => {
			const arr1 = [{ a: 1 }, { b: 2 }]
			const arr2 = [{ a: 1 }, { b: 2 }]
			const arr3 = [{ a: 1 }, { b: 3 }]
			expect(comparator.equals(arr1, arr2)).toBe(true)
			expect(comparator.equals(arr1, arr3)).toBe(false)
		})

		test("should handle arrays with NaN values", () => {
			expect(comparator.equals([NaN, 1, 2], [NaN, 1, 2])).toBe(true)
			expect(comparator.equals([NaN, 1, 2], [1, 1, 2])).toBe(false)
		})
	})

	describe("mixed types", () => {
		test("should return false for different types", () => {
			expect(comparator.equals({}, [])).toBe(false)
			expect(comparator.equals([], {})).toBe(false)
			expect(comparator.equals("1", 1)).toBe(false)
			expect(comparator.equals(true, 1)).toBe(false)
			expect(comparator.equals(null, {})).toBe(false)
			expect(comparator.equals(undefined, null)).toBe(false)
		})

		test("should handle complex nested structures", () => {
			const complex1 = {
				array: [1, { nested: "value" }, [2, 3]],
				object: { deep: { very: { nested: true } } },
				primitive: "test",
			}
			const complex2 = {
				array: [1, { nested: "value" }, [2, 3]],
				object: { deep: { very: { nested: true } } },
				primitive: "test",
			}
			const complex3 = {
				array: [1, { nested: "value" }, [2, 3]],
				object: { deep: { very: { nested: false } } },
				primitive: "test",
			}
			expect(comparator.equals(complex1, complex2)).toBe(true)
			expect(comparator.equals(complex1, complex3)).toBe(false)
		})
	})

	describe("Date objects", () => {
		test("should return true for dates with same time", () => {
			const date1 = new Date("2023-01-01T00:00:00.000Z")
			const date2 = new Date("2023-01-01T00:00:00.000Z")
			expect(comparator.equals(date1, date2)).toBe(true)
		})

		test("should return false for dates with different times", () => {
			const date1 = new Date("2023-01-01T00:00:00.000Z")
			const date2 = new Date("2023-01-02T00:00:00.000Z")
			expect(comparator.equals(date1, date2)).toBe(false)
		})

		test("should return false when comparing Date with non-Date", () => {
			const date = new Date("2023-01-01T00:00:00.000Z")
			expect(comparator.equals(date, "2023-01-01T00:00:00.000Z")).toBe(
				false,
			)
			expect(comparator.equals(date, 1672531200000)).toBe(false)
			expect(comparator.equals(date, {})).toBe(false)
		})
	})

	describe("RegExp objects", () => {
		test("should return true for identical regexes", () => {
			const regex1 = /test/gi
			const regex2 = /test/gi
			expect(comparator.equals(regex1, regex2)).toBe(true)
		})

		test("should return false for different regexes", () => {
			const regex1 = /test/gi
			const regex2 = /test/g
			const regex3 = /different/gi
			expect(comparator.equals(regex1, regex2)).toBe(false)
			expect(comparator.equals(regex1, regex3)).toBe(false)
		})

		test("should return false when comparing RegExp with non-RegExp", () => {
			const regex = /test/g
			expect(comparator.equals(regex, "test")).toBe(false)
			expect(comparator.equals(regex, {})).toBe(false)
		})
	})

	describe("Timestamp objects", () => {
		test("should return true for timestamps with same value", () => {
			const timestamp1 = Timestamp.fromNumber(1000)
			const timestamp2 = Timestamp.fromNumber(1000)
			expect(comparator.equals(timestamp1, timestamp2)).toBe(true)
		})

		test("should return false for timestamps with different values", () => {
			const timestamp1 = Timestamp.fromNumber(1000)
			const timestamp2 = Timestamp.fromNumber(2000)
			expect(comparator.equals(timestamp1, timestamp2)).toBe(false)
		})

		test("should return true for zero timestamps", () => {
			const timestamp1 = Timestamp.fromNumber(0)
			const timestamp2 = Timestamp.fromNumber(0)
			expect(comparator.equals(timestamp1, timestamp2)).toBe(true)
		})

		test("should return false when comparing Timestamp with non-Timestamp", () => {
			const timestamp = Timestamp.fromNumber(1000)
			expect(comparator.equals(timestamp, 1000)).toBe(false)
			expect(comparator.equals(timestamp, new Date(1000))).toBe(false)
			expect(comparator.equals(timestamp, {})).toBe(false)
		})

		test("should handle timestamps in complex structures", () => {
			const obj1 = {
				created: Timestamp.fromNumber(1000),
				data: [Timestamp.fromNumber(2000), "test"],
			}
			const obj2 = {
				created: Timestamp.fromNumber(1000),
				data: [Timestamp.fromNumber(2000), "test"],
			}
			const obj3 = {
				created: Timestamp.fromNumber(1000),
				data: [Timestamp.fromNumber(3000), "test"],
			}
			expect(comparator.equals(obj1, obj2)).toBe(true)
			expect(comparator.equals(obj1, obj3)).toBe(false)
		})
	})

	describe("circular references", () => {
		test("should handle simple circular references", () => {
			const obj1: any = { value: 1 }
			obj1.self = obj1
			const obj2: any = { value: 1 }
			obj2.self = obj2
			expect(comparator.equals(obj1, obj2)).toBe(true)
		})

		test("should handle different circular references", () => {
			const obj1: any = { value: 1 }
			obj1.self = obj1
			const obj2: any = { value: 2 }
			obj2.self = obj2
			expect(comparator.equals(obj1, obj2)).toBe(false)
		})

		test("should handle complex circular references", () => {
			const obj1: any = { a: { b: {} } }
			obj1.a.b.c = obj1
			const obj2: any = { a: { b: {} } }
			obj2.a.b.c = obj2
			expect(comparator.equals(obj1, obj2)).toBe(true)
		})

		test("should handle circular references in arrays", () => {
			const arr1: any[] = [1, 2]
			arr1.push(arr1)
			const arr2: any[] = [1, 2]
			arr2.push(arr2)
			expect(comparator.equals(arr1, arr2)).toBe(true)
		})
	})

	describe("edge cases", () => {
		test("should handle empty structures", () => {
			expect(comparator.equals({}, {})).toBe(true)
			expect(comparator.equals([], [])).toBe(true)
			expect(comparator.equals({}, [])).toBe(false)
		})

		test("should handle objects with null and undefined values", () => {
			expect(comparator.equals({ a: null }, { a: null })).toBe(true)
			expect(comparator.equals({ a: undefined }, { a: undefined })).toBe(
				true,
			)
			expect(comparator.equals({ a: null }, { a: undefined })).toBe(false)
		})

		test("should handle large numbers", () => {
			const large1 = Number.MAX_SAFE_INTEGER
			const large2 = Number.MAX_SAFE_INTEGER
			expect(comparator.equals(large1, large2)).toBe(true)
			expect(comparator.equals(large1, large1 + 1)).toBe(false)
		})

		test("should handle very deep nesting", () => {
			const createDeepObject = (depth: number): any => {
				if (depth === 0) return { value: "deep" }
				return { nested: createDeepObject(depth - 1) }
			}

			const deep1 = createDeepObject(10)
			const deep2 = createDeepObject(10)
			expect(comparator.equals(deep1, deep2)).toBe(true)
		})
	})
})
