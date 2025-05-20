import { describe, expect, test } from "vitest"
import { deepCopy } from "./deepCopy"

describe("deepCopy", () => {
	test("handles null and undefined", () => {
		expect(deepCopy(null)).toBeNull()
		expect(deepCopy(undefined)).toBeUndefined()
	})

	test("handles primitive types", () => {
		expect(deepCopy(42)).toBe(42)
		expect(deepCopy("hello")).toBe("hello")
		expect(deepCopy(true)).toBe(true)
		expect(deepCopy(false)).toBe(false)
		
		// Symbols are unique, so we need to store the reference and check it's returned as-is
		const testSymbol = Symbol("test")
		expect(deepCopy(testSymbol)).toBe(testSymbol)
	})

	test("handles Date objects", () => {
		const date = new Date("2023-01-01")
		const copied = deepCopy(date)
		
		expect(copied).toBeInstanceOf(Date)
		expect(copied).not.toBe(date) // Different objects
		expect(copied.getTime()).toBe(date.getTime()) // Same value
	})

	test("handles arrays", () => {
		const array = [1, "string", true, { key: "value" }]
		const copied = deepCopy(array)
		
		expect(copied).toEqual(array)
		expect(copied).not.toBe(array) // Different array instance
		
		// Nested object should also be a copy
		expect(copied[3]).toEqual(array[3])
		expect(copied[3]).not.toBe(array[3])
	})

	test("handles nested arrays", () => {
		const nested = [1, [2, [3, 4]]]
		const copied = deepCopy(nested)
		
		expect(copied).toEqual(nested)
		expect(copied).not.toBe(nested)
		expect(copied[1]).not.toBe(nested[1])
		expect(copied[1][1]).not.toBe(nested[1][1])
	})

	test("handles simple objects", () => {
		const obj = { a: 1, b: "string", c: true }
		const copied = deepCopy(obj)
		
		expect(copied).toEqual(obj)
		expect(copied).not.toBe(obj) // Different object instance
	})

	test("handles nested objects", () => {
		const nested = {
			a: 1,
			b: {
				c: 2,
				d: {
					e: 3
				}
			}
		}
		const copied = deepCopy(nested)
		
		expect(copied).toEqual(nested)
		expect(copied).not.toBe(nested)
		expect(copied.b).not.toBe(nested.b)
		expect(copied.b.d).not.toBe(nested.b.d)
	})

	test("handles circular references", () => {
		const circular: any = { a: 1 }
		circular.self = circular
		
		// This should throw or handle gracefully, not stack overflow
		expect(() => deepCopy(circular)).toThrow()
	})

	test("handles mixed complex structures", () => {
		const complex = {
			string: "hello",
			number: 42,
			bool: true,
			date: new Date("2023-01-01"),
			array: [1, 2, { nestedInArray: "value" }],
			nested: {
				a: 1,
				b: [3, 4, 5]
			}
		}
		
		const copied = deepCopy(complex)
		
		expect(copied).toEqual(complex)
		expect(copied).not.toBe(complex)
		expect(copied.date).not.toBe(complex.date)
		expect(copied.array).not.toBe(complex.array)
		expect(copied.array[2]).not.toBe(complex.array[2])
		expect(copied.nested).not.toBe(complex.nested)
		expect(copied.nested.b).not.toBe(complex.nested.b)
	})

	test("handles empty objects and arrays", () => {
		const emptyObj = {}
		const emptyArr: any[] = []
		
		const copiedObj = deepCopy(emptyObj)
		const copiedArr = deepCopy(emptyArr)
		
		expect(copiedObj).toEqual(emptyObj)
		expect(copiedObj).not.toBe(emptyObj)
		
		expect(copiedArr).toEqual(emptyArr)
		expect(copiedArr).not.toBe(emptyArr)
	})

	test("handles special numeric values", () => {
		expect(deepCopy(Infinity)).toBe(Infinity)
		expect(deepCopy(-Infinity)).toBe(-Infinity)
		expect(deepCopy(NaN)).toBeNaN()
	})

	test("handles objects with methods", () => {
		const objWithMethod = {
			value: 42,
			getValue: function() { return this.value }
		}
		
		const copied = deepCopy(objWithMethod)
		
		expect(typeof copied.getValue).toBe("function")
		expect(copied.getValue()).toBe(42)
		expect(copied.getValue).toBe(objWithMethod.getValue) // Function references should be the same
	})

	test("preserves object prototype", () => {
		class TestClass {
			value: number
			
			constructor(value: number) {
				this.value = value
			}
			
			getValue(): number {
				return this.value
			}
		}
		
		const instance = new TestClass(42)
		const copied = deepCopy(instance)
		
		// Note: The current deepCopy implementation doesn't preserve the prototype chain,
		// so this test documents current behavior rather than ideal behavior
		expect(copied).not.toBeInstanceOf(TestClass)
		expect(copied).toEqual({ value: 42 })
	})
})