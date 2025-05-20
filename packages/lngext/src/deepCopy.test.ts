import { describe, expect, test } from "vitest"
import { deepCopy } from "./deepCopy"

describe("deepCopy", () => {
	// Test primitive values
	test("should return same primitive values", () => {
		expect(deepCopy(null)).toBeNull()
		expect(deepCopy(undefined)).toBeUndefined()
		expect(deepCopy(42)).toBe(42)
		expect(deepCopy("hello")).toBe("hello")
		expect(deepCopy(true)).toBe(true)
		expect(deepCopy(false)).toBe(false)
	})

	test("should deep copy Date objects", () => {
		const date = new Date("2023-01-01")
		const copiedDate = deepCopy(date)

		expect(copiedDate).toEqual(date)
		expect(copiedDate).not.toBe(date)

		// Modify the copy and ensure the original isn't affected
		copiedDate.setFullYear(2024)
		expect(date.getFullYear()).toBe(2023)
	})

	test("should deep copy RegExp objects", () => {
		const regex = /test/gi
		const copiedRegex = deepCopy(regex)

		expect(copiedRegex).toEqual(regex)
		expect(copiedRegex).not.toBe(regex)
		expect(copiedRegex.source).toBe(regex.source)
		expect(copiedRegex.flags).toBe(regex.flags)
	})

	test("should deep copy Map objects", () => {
		const map = new Map<string, number>()
		map.set("one", 1)
		map.set("two", 2)

		const copiedMap = deepCopy(map)

		expect(copiedMap).toEqual(map)
		expect(copiedMap).not.toBe(map)

		// Modify the copy and ensure the original isn't affected
		copiedMap.set("two", 22)
		expect(map.get("two")).toBe(2)
	})

	test("should deep copy nested Map objects", () => {
		const nestedMap = new Map<string, Map<string, number>>()
		const innerMap = new Map<string, number>()
		innerMap.set("a", 1)
		nestedMap.set("inner", innerMap)

		const copiedNestedMap = deepCopy(nestedMap)

		expect(copiedNestedMap).toEqual(nestedMap)
		expect(copiedNestedMap).not.toBe(nestedMap)
		expect(copiedNestedMap.get("inner")).not.toBe(innerMap)

		// Modify the copy and ensure the original isn't affected
		copiedNestedMap.get("inner")?.set("a", 99)
		expect(innerMap.get("a")).toBe(1)
	})

	test("should deep copy Set objects", () => {
		const set = new Set<number>([1, 2, 3])
		const copiedSet = deepCopy(set)

		expect(copiedSet).toEqual(set)
		expect(copiedSet).not.toBe(set)

		// Modify the copy and ensure the original isn't affected
		copiedSet.add(4)
		expect(set.has(4)).toBe(false)
	})

	test("should deep copy nested Set objects", () => {
		const obj = {
			sets: [new Set<number>([1, 2]), new Set<string>(["a", "b"])] as [
				Set<number>,
				Set<string>,
			],
		}
		const copiedObj = deepCopy(obj)

		expect(copiedObj).toEqual(obj)
		expect(copiedObj.sets[0]).not.toBe(obj.sets[0])
		expect(copiedObj.sets[1]).not.toBe(obj.sets[1])

		// Modify the copy and ensure the original isn't affected
		;(copiedObj.sets[0] as Set<number>).add(3)
		;(copiedObj.sets[1] as Set<string>).add("c")
		expect((obj.sets[0] as Set<number>).has(3)).toBe(false)
		expect((obj.sets[1] as Set<string>).has("c")).toBe(false)
	})

	test("should deep copy arrays", () => {
		const array = [1, 2, 3]
		const copiedArray = deepCopy(array)

		expect(copiedArray).toEqual(array)
		expect(copiedArray).not.toBe(array)

		// Modify the copy and ensure the original isn't affected
		copiedArray.push(4)
		expect(array.length).toBe(3)
	})

	test("should deep copy nested arrays", () => {
		const nestedArray = [1, [2, 3], [4, [5, 6]]]
		const copiedNestedArray = deepCopy(nestedArray)

		expect(copiedNestedArray).toEqual(nestedArray)
		expect(copiedNestedArray).not.toBe(nestedArray)
		expect(copiedNestedArray[1]).not.toBe(nestedArray[1])
		expect(copiedNestedArray[2]).not.toBe(nestedArray[2])

		// Modify the copy and ensure the original isn't affected
		;(copiedNestedArray[1] as number[]).push(7)
		expect((nestedArray[1] as number[]).length).toBe(2)
	})

	test("should deep copy plain objects", () => {
		const object = { a: 1, b: "string", c: true }
		const copiedObject = deepCopy(object)

		expect(copiedObject).toEqual(object)
		expect(copiedObject).not.toBe(object)

		// Modify the copy and ensure the original isn't affected
		copiedObject.a = 2
		expect(object.a).toBe(1)
	})

	test("should deep copy nested objects", () => {
		const nestedObject = {
			a: 1,
			b: {
				c: 2,
				d: {
					e: 3,
				},
			},
		}
		const copiedNestedObject = deepCopy(nestedObject)

		expect(copiedNestedObject).toEqual(nestedObject)
		expect(copiedNestedObject).not.toBe(nestedObject)
		expect(copiedNestedObject.b).not.toBe(nestedObject.b)
		expect(copiedNestedObject.b.d).not.toBe(nestedObject.b.d)

		// Modify the copy and ensure the original isn't affected
		copiedNestedObject.b.c = 99
		copiedNestedObject.b.d.e = 100
		expect(nestedObject.b.c).toBe(2)
		expect(nestedObject.b.d.e).toBe(3)
	})

	test("should handle complex objects with mixed types", () => {
		const complexObject = {
			date: new Date("2023-01-01"),
			regex: /test/i,
			map: new Map([["key", "value"]]),
			set: new Set([1, 2, 3]),
			array: [1, 2, { nested: true }],
			object: {
				a: 1,
				b: {
					c: "string",
				},
			},
		}

		const copiedComplexObject = deepCopy(complexObject)

		expect(copiedComplexObject).toEqual(complexObject)
		expect(copiedComplexObject).not.toBe(complexObject)
		expect(copiedComplexObject.date).not.toBe(complexObject.date)
		expect(copiedComplexObject.regex).not.toBe(complexObject.regex)
		expect(copiedComplexObject.map).not.toBe(complexObject.map)
		expect(copiedComplexObject.set).not.toBe(complexObject.set)
		expect(copiedComplexObject.array).not.toBe(complexObject.array)
		expect(copiedComplexObject.object).not.toBe(complexObject.object)

		// Modify the copy and ensure the original isn't affected
		copiedComplexObject.date.setFullYear(2024)
		copiedComplexObject.map.set("key", "new value")
		copiedComplexObject.set.add(4)
		copiedComplexObject.array.push(4)
		copiedComplexObject.object.b.c = "modified"

		expect(complexObject.date.getFullYear()).toBe(2023)
		expect(complexObject.map.get("key")).toBe("value")
		expect(complexObject.set.has(4)).toBe(false)
		expect(complexObject.array.length).toBe(3)
		expect(complexObject.object.b.c).toBe("string")
	})

	test("should handle circular references by default", () => {
		const circular: Record<string, unknown> = { a: 1 }
		circular.self = circular

		// This should not cause a stack overflow
		expect(() => deepCopy(circular)).not.toThrow()
	})

	test("should throw with circular references when disallowCircularReferences is true", () => {
		const circular: Record<string, unknown> = { a: 1 }
		circular.self = circular

		// This should throw an error
		expect(() =>
			deepCopy(circular, { disallowCircularReferences: true }),
		).toThrow("Circular reference detected in object structure")
	})

	test("should handle functions", () => {
		const func = () => 42
		const objWithFunc = { method: func }
		const copiedObjWithFunc = deepCopy(objWithFunc)

		expect(copiedObjWithFunc.method).toBe(func)
	})
})
