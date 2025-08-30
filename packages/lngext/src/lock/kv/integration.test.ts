import { describe, expect, test, vi } from "vitest"
import type { LockAdapter } from "../lock"
import { HashLockAdapterMap } from "./hashLockAdapterMap"
import { PrefixLockAdapterMap } from "./prefixLockAdapterMap"
import { SingleLockAdapterMap } from "./singleLockAdapterMap"

describe("LockAdapterMap Integration", () => {
	test("should work with nested wrapping: Prefix -> Hash -> Single", () => {
		const mockLockAdapter1: LockAdapter = {
			lock: vi.fn(),
			unlock: vi.fn(),
		}
		const mockLockAdapter2: LockAdapter = {
			lock: vi.fn(),
			unlock: vi.fn(),
		}

		const hashMap = new HashLockAdapterMap([
			mockLockAdapter1,
			mockLockAdapter2,
		])

		const prefixMap = new PrefixLockAdapterMap(hashMap, "namespace:")

		const lock1 = prefixMap.getLock("user-123")
		const lock2 = prefixMap.getLock("user-123")
		const lock3 = prefixMap.getLock("user-456")

		expect(lock1).toBe(lock2)
		expect(lock1).toBeOneOf([mockLockAdapter1, mockLockAdapter2])
		expect(lock3).toBeOneOf([mockLockAdapter1, mockLockAdapter2])
	})

	test("should demonstrate consistent key mapping across calls", () => {
		const mockLockAdapter1: LockAdapter = {
			lock: vi.fn(),
			unlock: vi.fn(),
		}
		const mockLockAdapter2: LockAdapter = {
			lock: vi.fn(),
			unlock: vi.fn(),
		}
		const hashMap = new HashLockAdapterMap([
			mockLockAdapter1,
			mockLockAdapter2,
		])

		const testKeys = ["key1", "key2", "key3", "key4", "key5"]
		const firstResults = testKeys.map((key) => hashMap.getLock(key))
		const secondResults = testKeys.map((key) => hashMap.getLock(key))

		for (let i = 0; i < testKeys.length; i++) {
			expect(firstResults[i]).toBe(secondResults[i])
		}
	})

	test("should show prefix isolation", () => {
		const mockLockAdapter: LockAdapter = {
			lock: vi.fn(),
			unlock: vi.fn(),
		}
		const baseMap = new SingleLockAdapterMap(mockLockAdapter)

		const userMap = new PrefixLockAdapterMap(baseMap, "user:")
		const adminMap = new PrefixLockAdapterMap(baseMap, "admin:")

		const userLock = userMap.getLock("123")
		const adminLock = adminMap.getLock("123")

		expect(userLock).toBe(mockLockAdapter)
		expect(adminLock).toBe(mockLockAdapter)
		expect(userLock).toBe(adminLock)
	})
})
