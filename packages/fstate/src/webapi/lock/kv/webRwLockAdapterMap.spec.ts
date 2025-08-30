import * as fc from "fast-check"
import { describe, expect, test } from "vitest"
import { WebRwLockAdapter } from "../webRwLockAdapter"
import { WebRwLockAdapterMap } from "./webRwLockAdapterMap"

// TODO(teawithsand): add read/write critical section tests here

describe("WebRwLockAdapterMap", () => {
	test("should create instance with key transform function", () => {
		const transform = (key: string) => `prefix_${key}`
		const map = new WebRwLockAdapterMap(transform)
		expect(map).toBeDefined()
	})

	test("should create instance without key transform function", () => {
		const map = new WebRwLockAdapterMap()
		expect(map).toBeDefined()
	})

	test("should use noop transformer by default", () => {
		const map = new WebRwLockAdapterMap()

		const lock = map.getLock("test-key")

		expect(lock).toBeInstanceOf(WebRwLockAdapter)
	})

	test("should return different rw lock instances for same key", () => {
		const transform = (key: string) => `test_${key}`
		const map = new WebRwLockAdapterMap(transform)

		const lock1 = map.getLock("test-rw-same")
		const lock2 = map.getLock("test-rw-same")

		expect(lock1).not.toBe(lock2)
		expect(lock1).toBeInstanceOf(WebRwLockAdapter)
		expect(lock2).toBeInstanceOf(WebRwLockAdapter)
	})

	test("should return different rw lock instances for different keys", () => {
		const transform = (key: string) => `test_${key}`
		const map = new WebRwLockAdapterMap(transform)

		const lock1 = map.getLock("test-rw-diff1")
		const lock2 = map.getLock("test-rw-diff2")

		expect(lock1).not.toBe(lock2)
		expect(lock1).toBeInstanceOf(WebRwLockAdapter)
		expect(lock2).toBeInstanceOf(WebRwLockAdapter)
	})

	test("should apply key transformation function", () => {
		const transformedKeys: string[] = []
		const transform = (key: string) => {
			const transformed = `rw_prefix_${key}_suffix`
			transformedKeys.push(transformed)
			return transformed
		}
		const map = new WebRwLockAdapterMap(transform)

		map.getLock("test-rw-transform")

		expect(transformedKeys).toContain("rw_prefix_test-rw-transform_suffix")
	})

	test("should call transform function for each getLock call", () => {
		let transformCallCount = 0
		const transform = (key: string) => {
			transformCallCount++
			return `rw_counted_${key}`
		}
		const map = new WebRwLockAdapterMap(transform)

		map.getLock("test-rw-count")
		map.getLock("test-rw-count")
		map.getLock("test-rw-count")

		expect(transformCallCount).toBe(3)
	})

	test("should handle property-based rw key transformation", () => {
		fc.assert(
			fc.property(
				fc.array(fc.string({ minLength: 1, maxLength: 20 }), {
					minLength: 1,
					maxLength: 10,
				}),
				(keys) => {
					const transform = (key: string) =>
						`rw_prop_${key.toLowerCase()}`
					const map = new WebRwLockAdapterMap(transform)

					for (const key of keys) {
						const lock = map.getLock(key)
						expect(lock).toBeInstanceOf(WebRwLockAdapter)
					}
				},
			),
			{ numRuns: 20 },
		)
	})

	test("should provide working read-write locks", async () => {
		const transform = (key: string) => `functional_${key}`
		const map = new WebRwLockAdapterMap(transform)

		const rwLock = map.getLock("test-functional")

		await rwLock.readLock.lock()
		await rwLock.readLock.unlock()

		await rwLock.writeLock.lock()
		await rwLock.writeLock.unlock()
	})
})
