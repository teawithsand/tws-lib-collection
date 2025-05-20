import { describe, expect, test } from "vitest"
import { Flux } from "./flux"

describe("Flux", () => {
	describe("construction", () => {
		test("of() should create a Flux from an iterable", () => {
			// Test with array
			const fluxFromArray = Flux.of([1, 2, 3])
			expect(fluxFromArray.toArray()).toEqual([1, 2, 3])

			// Test with Set
			const set = new Set([1, 2, 3])
			const fluxFromSet = Flux.of(set)
			expect(fluxFromSet.toArray()).toEqual([1, 2, 3])

			// Test with custom iterable
			const customIterable = {
				*[Symbol.iterator]() {
					yield 1
					yield 2
					yield 3
				},
			}
			const fluxFromCustom = Flux.of(customIterable)
			expect(fluxFromCustom.toArray()).toEqual([1, 2, 3])
		})

		test("from() should create a Flux from multiple arguments", () => {
			const flux = Flux.from(1, 2, 3)
			expect(flux.toArray()).toEqual([1, 2, 3])
		})

		test("empty() should create an empty Flux", () => {
			const flux = Flux.empty()
			expect(flux.toArray()).toEqual([])
			expect(flux.isEmpty()).toBe(true)
		})
	})

	describe("transformations", () => {
		test("map() should transform each value", () => {
			const flux = Flux.from(1, 2, 3)
			const mapped = flux.map((x) => x * 2)
			expect(mapped.toArray()).toEqual([2, 4, 6])
		})

		test("filter() should filter values based on predicate", () => {
			const flux = Flux.from(1, 2, 3, 4, 5)
			const filtered = flux.filter((x) => x % 2 === 0)
			expect(filtered.toArray()).toEqual([2, 4])
		})

		test("flatMap() should flatten nested Fluxes", () => {
			const flux = Flux.from(1, 2, 3)
			const flattened = flux.flatMap((x) => Flux.from(x, x * 10))
			expect(flattened.toArray()).toEqual([1, 10, 2, 20, 3, 30])
		})

		test("take() should limit the number of elements", () => {
			const flux = Flux.from(1, 2, 3, 4, 5)
			const taken = flux.take(3)
			expect(taken.toArray()).toEqual([1, 2, 3])
		})

		test("take() with zero count should return empty Flux", () => {
			const flux = Flux.from(1, 2, 3)
			const taken = flux.take(0)
			expect(taken.isEmpty()).toBe(true)
		})

		test("take() with count larger than elements should return all elements", () => {
			const flux = Flux.from(1, 2, 3)
			const taken = flux.take(10)
			expect(taken.toArray()).toEqual([1, 2, 3])
		})

		test("skip() should skip a number of elements", () => {
			const flux = Flux.from(1, 2, 3, 4, 5)
			const skipped = flux.skip(2)
			expect(skipped.toArray()).toEqual([3, 4, 5])
		})

		test("skip() with zero count should return all elements", () => {
			const flux = Flux.from(1, 2, 3)
			const skipped = flux.skip(0)
			expect(skipped.toArray()).toEqual([1, 2, 3])
		})

		test("skip() with count larger than elements should return empty Flux", () => {
			const flux = Flux.from(1, 2, 3)
			const skipped = flux.skip(5)
			expect(skipped.isEmpty()).toBe(true)
		})

		test("concat() should combine two Fluxes", () => {
			const flux1 = Flux.from(1, 2)
			const flux2 = Flux.from(3, 4)
			const combined = flux1.concat(flux2)
			expect(combined.toArray()).toEqual([1, 2, 3, 4])
		})

		test("concat() with empty Flux should not change elements", () => {
			const flux = Flux.from(1, 2, 3)
			const empty = Flux.empty<number>()

			const combinedRight = flux.concat(empty)
			expect(combinedRight.toArray()).toEqual([1, 2, 3])

			const combinedLeft = empty.concat(flux)
			expect(combinedLeft.toArray()).toEqual([1, 2, 3])
		})
	})

	describe("terminal operations", () => {
		test("forEach() should execute action for each element", () => {
			const flux = Flux.from(1, 2, 3)
			const results: number[] = []

			flux.forEach((x) => results.push(x * 2))
			expect(results).toEqual([2, 4, 6])
		})

		test("find() should return the first matching element", () => {
			const flux = Flux.from(1, 2, 3, 4, 5)

			const found = flux.find((x) => x > 3)
			expect(found).toBe(4)
		})

		test("find() should return undefined if no match is found", () => {
			const flux = Flux.from(1, 2, 3)

			const notFound = flux.find((x) => x > 10)
			expect(notFound).toBeUndefined()
		})

		test("some() should return true if any element matches predicate", () => {
			const flux = Flux.from(1, 2, 3)

			const hasEven = flux.some((x) => x % 2 === 0)
			const hasNegative = flux.some((x) => x < 0)

			expect(hasEven).toBe(true)
			expect(hasNegative).toBe(false)
		})

		test("every() should return true if all elements match predicate", () => {
			const flux = Flux.from(2, 4, 6)

			const allEven = flux.every((x) => x % 2 === 0)
			const allPositive = flux.every((x) => x > 0)
			const allLessThanFive = flux.every((x) => x < 5)

			expect(allEven).toBe(true)
			expect(allPositive).toBe(true)
			expect(allLessThanFive).toBe(false)
		})

		test("reduce() should combine elements into single value", () => {
			const flux = Flux.from(1, 2, 3, 4)

			const sum = flux.reduce((acc, val) => acc + val, 0)
			const product = flux.reduce((acc, val) => acc * val, 1)

			expect(sum).toBe(10)
			expect(product).toBe(24)
		})

		test("reduce() should return initial value for empty Flux", () => {
			const empty = Flux.empty<number>()

			const sum = empty.reduce((acc, val) => acc + val, 0)
			expect(sum).toBe(0)
		})

		test("count() should return the number of elements", () => {
			const flux = Flux.from(1, 2, 3)
			const empty = Flux.empty<number>()

			expect(flux.count()).toBe(3)
			expect(empty.count()).toBe(0)
		})

		test("isEmpty() should check if Flux has elements", () => {
			const flux = Flux.from(1, 2, 3)
			const empty = Flux.empty<number>()

			expect(flux.isEmpty()).toBe(false)
			expect(empty.isEmpty()).toBe(true)
		})
	})

	describe("chaining operations", () => {
		test("should support method chaining", () => {
			const flux = Flux.from(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)

			const result = flux
				.filter((x) => x % 2 === 0) // [2, 4, 6, 8, 10]
				.map((x) => x * 10) // [20, 40, 60, 80, 100]
				.take(3) // [20, 40, 60]
				.reduce((acc, val) => acc + val, 0)

			expect(result).toBe(120)
		})

		test("should handle empty results in the middle of a chain", () => {
			const flux = Flux.from(1, 2, 3, 4, 5)

			const result = flux
				.filter((x) => x > 10) // Empty result
				.map((x) => x * 2) // Still empty
				.toArray()

			expect(result).toEqual([])
		})
	})

	describe("lazy evaluation", () => {
		test("operations should not be executed until terminal operation", () => {
			const executed: string[] = []

			const flux = Flux.from(1, 2, 3)
				.map((x) => {
					executed.push(`map ${x}`)
					return x * 10
				})
				.filter((x) => {
					executed.push(`filter ${x}`)
					return x > 10
				})

			// No terminal operation yet, so nothing should be executed
			expect(executed).toEqual([])

			// Trigger evaluation with toArray()
			const result = flux.toArray()

			// Operations should be executed in correct order for each element
			expect(executed).toEqual([
				"map 1",
				"filter 10",
				"map 2",
				"filter 20",
				"map 3",
				"filter 30",
			])
			expect(result).toEqual([20, 30])
		})

		test("should process elements one-by-one in sequence", () => {
			const processed: string[] = []

			Flux.from(1, 2, 3)
				.map((x) => {
					processed.push(`map1 ${x}`)
					return x
				})
				.map((x) => {
					processed.push(`map2 ${x}`)
					return x
				})
				.forEach((x) => {
					processed.push(`forEach ${x}`)
				})

			expect(processed).toEqual([
				"map1 1",
				"map2 1",
				"forEach 1",
				"map1 2",
				"map2 2",
				"forEach 2",
				"map1 3",
				"map2 3",
				"forEach 3",
			])
		})
	})

	describe("edge cases", () => {
		test("should handle infinite iterables with take()", () => {
			// Create an infinite iterable of natural numbers
			function* naturalNumbers() {
				let n = 1
				while (true) {
					yield n++
				}
			}

			const infiniteFlux = Flux.of(naturalNumbers())
			const firstFive = infiniteFlux.take(5).toArray()

			expect(firstFive).toEqual([1, 2, 3, 4, 5])
		})
	})

	describe("loop()", () => {
		test("should create an infinite flux by repeating values", () => {
			const flux = Flux.from(1, 2, 3)
			const looped = flux.loop()

			// Take more elements than original flux had to verify looping
			const firstEight = looped.take(8).toArray()

			expect(firstEight).toEqual([1, 2, 3, 1, 2, 3, 1, 2])
		})

		test("should handle empty flux correctly", () => {
			const empty = Flux.empty<number>()
			const looped = empty.loop()

			expect(looped.toArray()).toEqual([])
		})

		test("should handle single element flux correctly", () => {
			const single = Flux.from(42)
			const looped = single.loop()

			const repeated = looped.take(5).toArray()
			expect(repeated).toEqual([42, 42, 42, 42, 42])
		})

		test("loop and other operations should compose correctly", () => {
			const flux = Flux.from(1, 2)

			const result = flux
				.loop()
				.map((x) => x * 10)
				.take(5)
				.toArray()

			expect(result).toEqual([10, 20, 10, 20, 10])
		})
	})

	describe("last()", () => {
		test("should return the last element of a flux", () => {
			const flux = Flux.from(1, 2, 3, 4, 5)
			expect(flux.last()).toBe(5)
		})

		test("should return undefined for an empty flux", () => {
			const empty = Flux.empty<number>()
			expect(empty.last()).toBeUndefined()
		})

		test("should return the single element for a singleton flux", () => {
			const singleton = Flux.from(42)
			expect(singleton.last()).toBe(42)
		})

		test("should work correctly with other operations", () => {
			const flux = Flux.from(1, 2, 3, 4, 5)

			const lastEven = flux.filter((x) => x % 2 === 0).last()

			expect(lastEven).toBe(4)
		})

		test("should handle transformed fluxes correctly", () => {
			const flux = Flux.from(1, 2, 3)
			const doubled = flux.map((x) => x * 2)

			expect(doubled.last()).toBe(6)
		})
	})
})
