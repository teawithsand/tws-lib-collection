import { describe, expect, test, vi } from "vitest"
import type { LockAdapter, RwLockAdapter } from "../lock"
import {
	SingleLockAdapterMap,
	SingleRwLockAdapterMap,
} from "./singleLockAdapterMap"

describe("SingleLockAdapterMap", () => {
	test("should always return the same lock adapter", () => {
		const mockLockAdapter: LockAdapter = {
			lock: vi.fn(),
			unlock: vi.fn(),
		}
		const map = new SingleLockAdapterMap(mockLockAdapter)

		const lock1 = map.getLock("key1")
		const lock2 = map.getLock("key2")
		const lock3 = map.getLock("different-key")

		expect(lock1).toBe(mockLockAdapter)
		expect(lock2).toBe(mockLockAdapter)
		expect(lock3).toBe(mockLockAdapter)
		expect(lock1).toBe(lock2)
		expect(lock2).toBe(lock3)
	})
})

describe("SingleRwLockAdapterMap", () => {
	test("should always return the same read-write lock adapter", () => {
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
		const map = new SingleRwLockAdapterMap(mockRwLockAdapter)

		const lock1 = map.getLock("key1")
		const lock2 = map.getLock("key2")
		const lock3 = map.getLock("different-key")

		expect(lock1).toBe(mockRwLockAdapter)
		expect(lock2).toBe(mockRwLockAdapter)
		expect(lock3).toBe(mockRwLockAdapter)
		expect(lock1).toBe(lock2)
		expect(lock2).toBe(lock3)
	})
})
