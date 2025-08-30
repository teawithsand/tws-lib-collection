import { describe, expect, test, vi } from "vitest"
import type { LockAdapter, RwLockAdapter } from "../lock"
import type { LockAdapterMap, RwLockAdapterMap } from "./lockAdapterMap"
import {
	PrefixLockAdapterMap,
	PrefixRwLockAdapterMap,
} from "./prefixLockAdapterMap"

describe("PrefixLockAdapterMap", () => {
	test("should add prefix to key and delegate to wrapped map", () => {
		const mockLockAdapter: LockAdapter = {
			lock: vi.fn(),
			unlock: vi.fn(),
		}
		const mockWrappedMap: LockAdapterMap = {
			getLock: vi.fn().mockReturnValue(mockLockAdapter),
		}
		const prefix = "test-prefix-"
		const map = new PrefixLockAdapterMap(mockWrappedMap, prefix)

		const result = map.getLock("mykey")

		expect(mockWrappedMap.getLock).toHaveBeenCalledWith("test-prefix-mykey")
		expect(result).toBe(mockLockAdapter)
	})

	test("should handle empty prefix", () => {
		const mockLockAdapter: LockAdapter = {
			lock: vi.fn(),
			unlock: vi.fn(),
		}
		const mockWrappedMap: LockAdapterMap = {
			getLock: vi.fn().mockReturnValue(mockLockAdapter),
		}
		const map = new PrefixLockAdapterMap(mockWrappedMap, "")

		map.getLock("mykey")

		expect(mockWrappedMap.getLock).toHaveBeenCalledWith("mykey")
	})

	test("should handle special characters in prefix and key", () => {
		const mockLockAdapter: LockAdapter = {
			lock: vi.fn(),
			unlock: vi.fn(),
		}
		const mockWrappedMap: LockAdapterMap = {
			getLock: vi.fn().mockReturnValue(mockLockAdapter),
		}
		const prefix = "namespace:env/"
		const map = new PrefixLockAdapterMap(mockWrappedMap, prefix)

		map.getLock("user-123.data")

		expect(mockWrappedMap.getLock).toHaveBeenCalledWith(
			"namespace:env/user-123.data",
		)
	})
})

describe("PrefixRwLockAdapterMap", () => {
	test("should add prefix to key and delegate to wrapped map", () => {
		const mockReadLock: LockAdapter = {
			lock: vi.fn(),
			unlock: vi.fn(),
		}
		const mockWriteLock: LockAdapter = {
			lock: vi.fn(),
			unlock: vi.fn(),
		}
		const mockRwLockAdapter: RwLockAdapter = {
			readLock: mockReadLock,
			writeLock: mockWriteLock,
		}
		const mockWrappedMap: RwLockAdapterMap = {
			getLock: vi.fn().mockReturnValue(mockRwLockAdapter),
		}
		const prefix = "rw-prefix-"
		const map = new PrefixRwLockAdapterMap(mockWrappedMap, prefix)

		const result = map.getLock("mykey")

		expect(mockWrappedMap.getLock).toHaveBeenCalledWith("rw-prefix-mykey")
		expect(result).toBe(mockRwLockAdapter)
	})

	test("should handle empty prefix", () => {
		const mockReadLock: LockAdapter = {
			lock: vi.fn(),
			unlock: vi.fn(),
		}
		const mockWriteLock: LockAdapter = {
			lock: vi.fn(),
			unlock: vi.fn(),
		}
		const mockRwLockAdapter: RwLockAdapter = {
			readLock: mockReadLock,
			writeLock: mockWriteLock,
		}
		const mockWrappedMap: RwLockAdapterMap = {
			getLock: vi.fn().mockReturnValue(mockRwLockAdapter),
		}
		const map = new PrefixRwLockAdapterMap(mockWrappedMap, "")

		map.getLock("mykey")

		expect(mockWrappedMap.getLock).toHaveBeenCalledWith("mykey")
	})
})
