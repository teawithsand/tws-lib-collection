import { describe, expect, test } from "vitest"
import {
	MetadataBag,
	MetadataLoadingResult,
	MetadataLoadingResultType,
} from "./durationBag" // Adjust import as needed

// Helper to create OK results easily
const ok = (d: number): MetadataLoadingResult => ({
	type: MetadataLoadingResultType.OK,
	duration: d,
})

describe("MetadataBag", () => {
	test("correctly sets length", () => {
		const bag = new MetadataBag([ok(100), ok(200), ok(300)])
		expect(bag.length).toBe(3)
	})

	test("returns correct durations with getDuration", () => {
		const durations: (MetadataLoadingResult | null)[] = [
			ok(100),
			null,
			ok(300),
		]
		const bag = new MetadataBag(durations)
		expect(bag.getDuration(0)).toBe(100)
		expect(bag.getDuration(1)).toBeNull()
		expect(bag.getDuration(2)).toBe(300)
		expect(bag.getDuration(3)).toBeNull() // out of bounds
	})

	test("computes cumulative durations with getDurationToIndex correctly", () => {
		const bag = new MetadataBag([ok(100), ok(200), ok(300)])

		expect(bag.getDurationToIndex(0, false)).toBe(0)
		expect(bag.getDurationToIndex(0, true)).toBe(100)
		expect(bag.getDurationToIndex(1, false)).toBe(100)
		expect(bag.getDurationToIndex(1, true)).toBe(300)
		expect(bag.getDurationToIndex(2, false)).toBe(300)
		expect(bag.getDurationToIndex(2, true)).toBe(600)
	})

	test("getDurationToIndex returns null only if invalid duration accessed", () => {
		const bag = new MetadataBag([ok(100), null, ok(300)])

		expect(bag.getDurationToIndex(0, true)).toBe(100)
		expect(bag.getDurationToIndex(1, false)).toBe(100)
		expect(bag.getDurationToIndex(1, true)).toBeNull()
		expect(bag.getDurationToIndex(2, false)).toBeNull()
	})

	test("returns 0 total duration for empty bag", () => {
		const bag = new MetadataBag([])
		expect(bag.duration).toBe(0)
	})

	test("calculates total duration correctly", () => {
		const bag = new MetadataBag([ok(100), ok(200), ok(300)])
		expect(bag.duration).toBe(600)
	})

	test("returns null total duration if last duration is invalid", () => {
		const bag = new MetadataBag([ok(100), ok(200), null])
		expect(bag.duration).toBeNull()
	})

	test("getIndexFromPosition returns correct index without accessing invalid durations", () => {
		const bag = new MetadataBag([ok(100), null, ok(300)])

		expect(bag.getIndexFromPosition(50)).toBe(0)
		expect(bag.getIndexFromPosition(99)).toBe(0)
		expect(bag.getIndexFromPosition(100)).toBe(0)
		expect(bag.getIndexFromPosition(101)).toBeNull()
	})

	test("isDone is true only if all durations are valid", () => {
		expect(new MetadataBag([ok(100), ok(200), ok(300)]).isDone).toBe(true)
		expect(new MetadataBag([ok(100), null, ok(300)]).isDone).toBe(false)
		expect(new MetadataBag([]).isDone).toBe(true)
	})

	test("getDurationToIndex returns 0 if index < 0", () => {
		const bag = new MetadataBag([ok(100), ok(200)])
		expect(bag.getDurationToIndex(-1, false)).toBe(0)
		expect(bag.getDurationToIndex(-1, true)).toBe(0)
	})

	test("getDurationToIndex returns prefix sum if index > length and exclusive", () => {
		const bag = new MetadataBag([ok(100), ok(200)])
		expect(bag.getDurationToIndex(10, false)).toBe(300)
	})

	test("getDurationToIndex returns null if index > length and inclusive (invalid access)", () => {
		const bag = new MetadataBag([ok(100), ok(200)])
		expect(bag.getDurationToIndex(10, true)).toBeNull()
	})

	test("handle zero durations correctly", () => {
		const bag = new MetadataBag([ok(0), ok(0), ok(0)])
		expect(bag.duration).toBe(0)
		expect(bag.isDone).toBe(true)
		expect(bag.getDurationToIndex(2, true)).toBe(0)
		expect(bag.getIndexFromPosition(0)).toBe(0)
	})

	test("handle all null durations gracefully", () => {
		const bag = new MetadataBag([null, null, null])
		expect(bag.length).toBe(3)
		expect(bag.isDone).toBe(false)
		expect(bag.duration).toBeNull()
		expect(bag.getDurationToIndex(0, false)).toBe(0)
		expect(bag.getDurationToIndex(0, true)).toBeNull()
		expect(bag.getIndexFromPosition(0)).toBeNull()
	})

	test("negative durations are invalid only when accessed inclusively", () => {
		const bag = new MetadataBag([ok(100), ok(-1), ok(200)])

		expect(bag.isDone).toBe(false)

		expect(bag.getDurationToIndex(1, false)).toBe(100)
		expect(bag.getDurationToIndex(1, true)).toBeNull()
		expect(bag.getDurationToIndex(0, true)).toBe(100)
		expect(bag.getIndexFromPosition(50)).toBe(0)
		expect(bag.getIndexFromPosition(150)).toBeNull()
	})

	test("NaN durations are invalid only when accessed inclusively", () => {
		const bag = new MetadataBag([ok(100), ok(NaN), ok(200)])

		expect(bag.isDone).toBe(false)

		expect(bag.getDurationToIndex(1, false)).toBe(100)
		expect(bag.getDurationToIndex(1, true)).toBeNull()
		expect(bag.getDurationToIndex(0, true)).toBe(100)
		expect(bag.getIndexFromPosition(50)).toBe(0)
		expect(bag.getIndexFromPosition(150)).toBeNull()
	})

	test("getIndexFromPosition returns last index if position exactly matches cumulative duration", () => {
		const bag = new MetadataBag([ok(10), ok(20), ok(30)])
		// cumulative sums: 10, 30, 60

		expect(bag.getIndexFromPosition(10)).toBe(0) // <= first duration
		expect(bag.getIndexFromPosition(30)).toBe(1)
		expect(bag.getIndexFromPosition(60)).toBe(2)

		// position beyond total duration returns length
		expect(bag.getIndexFromPosition(61)).toBe(bag.length)
	})

	test("getIndexFromPosition returns null if any involved duration is invalid", () => {
		const bag = new MetadataBag([ok(10), null, ok(30)])
		expect(bag.getIndexFromPosition(5)).toBe(0)
		expect(bag.getIndexFromPosition(15)).toBeNull()
	})

	test("large array with mixed valid and invalid entries", () => {
		const arr: (MetadataLoadingResult | null)[] = []
		for (let i = 0; i < 1000; i++) {
			arr.push(i % 10 === 0 ? null : ok(i))
		}
		const bag = new MetadataBag(arr)
		expect(bag.length).toBe(1000)
		expect(bag.isDone).toBe(false)
		expect(bag.duration).toBeNull()

		// Check getDuration for some entries
		expect(bag.getDuration(0)).toBeNull()
		expect(bag.getDuration(1)).toBe(1)
		expect(bag.getDuration(999)).toBe(999)
	})

	test("constructor ignores negative and infinite durations, marking as invalid", () => {
		const arr: (MetadataLoadingResult | null)[] = [
			ok(10),
			{ type: MetadataLoadingResultType.OK, duration: -1 },
			{ type: MetadataLoadingResultType.OK, duration: Infinity },
			ok(20),
		]
		const bag = new MetadataBag(arr)

		expect(bag.length).toBe(4)
		expect(bag.isDone).toBe(false)
		expect(bag.getDuration(1)).toBeNull()
		expect(bag.getDuration(2)).toBeNull()
		expect(bag.getDuration(0)).toBe(10)
		expect(bag.getDuration(3)).toBe(20)
	})

	test("getDurationToIndex throws no errors on empty bag", () => {
		const bag = new MetadataBag([])
		expect(bag.getDurationToIndex(0)).toBe(0)
		expect(bag.getDurationToIndex(5)).toBe(0)
	})

	test("getIndexFromPosition returns length for position exactly total duration", () => {
		const bag = new MetadataBag([ok(10), ok(20)])
		expect(bag.duration).toBe(30)
		expect(bag.getIndexFromPosition(30)).toBe(1)
	})

	test("handles zero-length durations mixed with valid durations", () => {
		const bag = new MetadataBag([ok(0), ok(0), ok(5), ok(0)])
		expect(bag.isDone).toBe(true)
		expect(bag.duration).toBe(5)
		expect(bag.getDurationToIndex(2, true)).toBe(5)
		expect(bag.getIndexFromPosition(0)).toBe(0)
		expect(bag.getIndexFromPosition(4.9)).toBe(2)
	})

	test("getDurationToIndex clamps out-of-bounds indices correctly", () => {
		const bag = new MetadataBag([ok(7), ok(8), ok(9)])
		expect(bag.getDurationToIndex(-1)).toBe(0)
		expect(bag.getDurationToIndex(100, false)).toBe(24)
		expect(bag.getDurationToIndex(100, true)).toBeNull()
	})

	test("constructor treats invalid durations as null", () => {
		const invalidResults: (MetadataLoadingResult | null)[] = [
			{ type: MetadataLoadingResultType.OK, duration: -5 }, // negative duration
			{ type: MetadataLoadingResultType.OK, duration: Infinity }, // infinite duration
			{ type: MetadataLoadingResultType.OK, duration: NaN }, // NaN duration
			{ type: MetadataLoadingResultType.ERROR, error: new Error("fail") }, // error result
			null, // null entry
		]

		const bag = new MetadataBag(invalidResults)

		expect(bag.length).toBe(invalidResults.length)
		// All invalid durations treated as null for duration access
		for (let i = 0; i < invalidResults.length; i++) {
			expect(bag.getDuration(i)).toBeNull()
		}
		// Bag is not done because some durations are invalid/null
		expect(bag.isDone).toBe(false)
		// Total duration is null due to invalid entries
		expect(bag.duration).toBeNull()
	})

	test("getDuration returns null for error types", () => {
		const results: (MetadataLoadingResult | null)[] = [
			{ type: MetadataLoadingResultType.ERROR, error: new Error("fail") },
			{ type: MetadataLoadingResultType.OK, duration: 10 },
		]
		const bag = new MetadataBag(results)

		expect(bag.getDuration(0)).toBeNull()
		expect(bag.getDuration(1)).toBe(10)
	})

	test("getIndexFromPosition returns null if any duration in prefix sums is invalid", () => {
		// The second duration is invalid (null), so must fail
		const results: (MetadataLoadingResult | null)[] = [
			{ type: MetadataLoadingResultType.OK, duration: 5 },
			null,
			{ type: MetadataLoadingResultType.OK, duration: 10 },
		]
		const bag = new MetadataBag(results)

		expect(bag.getIndexFromPosition(0)).toBe(0)
		// Position falling into invalid duration range returns null
		expect(bag.getIndexFromPosition(6)).toBeNull()
		// Position beyond total durations also returns null
		expect(bag.getIndexFromPosition(20)).toBeNull()
	})

	test("getDurationToIndex returns null if prefix sums invalid due to error/invalid durations", () => {
		const results: (MetadataLoadingResult | null)[] = [
			{ type: MetadataLoadingResultType.OK, duration: 5 },
			{
				type: MetadataLoadingResultType.ERROR,
				error: "some error",
			},
			{ type: MetadataLoadingResultType.OK, duration: 10 },
		]
		const bag = new MetadataBag(results)

		// Index 0 inclusive should work
		expect(bag.getDurationToIndex(0, true)).toBe(5)
		// Index 1 exclusive is sum before second duration; valid
		expect(bag.getDurationToIndex(1, false)).toBe(5)
		// Index 1 inclusive is invalid due to error duration -> null
		expect(bag.getDurationToIndex(1, true)).toBeNull()
		// Index 2 exclusive and inclusive fail because prefix sums invalid
		expect(bag.getDurationToIndex(2, false)).toBeNull()
		expect(bag.getDurationToIndex(2, true)).toBeNull()
	})

	test("constructor gracefully handles empty and null-only input", () => {
		expect(new MetadataBag([]).length).toBe(0)
		expect(new MetadataBag([]).duration).toBe(0)
		expect(new MetadataBag([]).isDone).toBe(true)

		const onlyNullBag = new MetadataBag([null, null])
		expect(onlyNullBag.length).toBe(2)
		expect(onlyNullBag.isDone).toBe(false)
		expect(onlyNullBag.duration).toBeNull()
	})

	test("getDurationToIndex handles out of bounds indices correctly", () => {
		const bag = new MetadataBag([
			{ type: MetadataLoadingResultType.OK, duration: 5 },
			{ type: MetadataLoadingResultType.OK, duration: 10 },
		])
		// Negative index returns 0
		expect(bag.getDurationToIndex(-5)).toBe(0)
		expect(bag.getDurationToIndex(-5, true)).toBe(0)

		// Index greater than length returns prefix sum or null (when inclusive)
		expect(bag.getDurationToIndex(100, false)).toBe(15) // exclusive sum of all
		expect(bag.getDurationToIndex(100, true)).toBeNull() // inclusive invalid index
	})
})
