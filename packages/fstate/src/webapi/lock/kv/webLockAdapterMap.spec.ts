import * as fc from "fast-check"
import { describe, expect, test } from "vitest"
import { WebLockAdapter } from "../webLockAdapter"
import { WebLockAdapterMap } from "./webLockAdapterMap"

// TODO(teawithsand): add critical section tests here

describe("WebLockAdapterMap", () => {
	test("should create instance with key transform function", () => {
		const transform = (key: string) => `prefix_${key}`
		const map = new WebLockAdapterMap(transform)
		expect(map).toBeDefined()
	})

	test("should create instance without key transform function", () => {
		const map = new WebLockAdapterMap()
		expect(map).toBeDefined()
	})

	test("should use noop transformer by default", () => {
		const map = new WebLockAdapterMap()

		const lock = map.getLock("test-key")

		expect(lock).toBeInstanceOf(WebLockAdapter)
	})

	test("should return different lock instances for same key", () => {
		const transform = (key: string) => `test_${key}`
		const map = new WebLockAdapterMap(transform)

		const lock1 = map.getLock("test-key-same")
		const lock2 = map.getLock("test-key-same")

		expect(lock1).not.toBe(lock2)
		expect(lock1).toBeInstanceOf(WebLockAdapter)
		expect(lock2).toBeInstanceOf(WebLockAdapter)
	})

	test("should return different lock instances for different keys", () => {
		const transform = (key: string) => `test_${key}`
		const map = new WebLockAdapterMap(transform)

		const lock1 = map.getLock("test-key-diff1")
		const lock2 = map.getLock("test-key-diff2")

		expect(lock1).not.toBe(lock2)
		expect(lock1).toBeInstanceOf(WebLockAdapter)
		expect(lock2).toBeInstanceOf(WebLockAdapter)
	})

	test("should apply key transformation function", () => {
		const transformedKeys: string[] = []
		const transform = (key: string) => {
			const transformed = `prefix_${key}_suffix`
			transformedKeys.push(transformed)
			return transformed
		}
		const map = new WebLockAdapterMap(transform)

		map.getLock("test-key-transform")

		expect(transformedKeys).toContain("prefix_test-key-transform_suffix")
	})

	test("should call transform function for each getLock call", () => {
		let transformCallCount = 0
		const transform = (key: string) => {
			transformCallCount++
			return `counted_${key}`
		}
		const map = new WebLockAdapterMap(transform)

		map.getLock("test-key-count")
		map.getLock("test-key-count")
		map.getLock("test-key-count")

		expect(transformCallCount).toBe(3)
	})

	test("should handle property-based key transformation", () => {
		fc.assert(
			fc.property(
				fc.array(fc.string({ minLength: 1, maxLength: 20 }), {
					minLength: 1,
					maxLength: 10,
				}),
				(keys) => {
					const transform = (key: string) =>
						`prop_${key.toUpperCase()}`
					const map = new WebLockAdapterMap(transform)

					for (const key of keys) {
						const lock = map.getLock(key)
						expect(lock).toBeInstanceOf(WebLockAdapter)
					}
				},
			),
			{ numRuns: 20 },
		)
	})
})
