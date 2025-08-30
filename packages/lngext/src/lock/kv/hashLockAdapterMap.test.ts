import { describe, expect, test, vi } from "vitest"
import type { LockAdapter, RwLockAdapter } from "../lock"
import { HashLockAdapterMap, HashRwLockAdapterMap } from "./hashLockAdapterMap"

describe("HashLockAdapterMap", () => {
	test("should throw error when lock adapters array is empty", () => {
		expect(() => new HashLockAdapterMap([])).toThrow(
			"Lock adapters array cannot be empty",
		)
	})

	test("should return the same lock adapter for the same key", () => {
		const mockLockAdapter1: LockAdapter = {
			lock: vi.fn(),
			unlock: vi.fn(),
		}
		const mockLockAdapter2: LockAdapter = {
			lock: vi.fn(),
			unlock: vi.fn(),
		}
		const lockAdapters = [mockLockAdapter1, mockLockAdapter2]
		const map = new HashLockAdapterMap(lockAdapters)

		const lock1 = map.getLock("test-key")
		const lock2 = map.getLock("test-key")

		expect(lock1).toBe(lock2)
	})

	test("should distribute keys across multiple lock adapters", () => {
		const mockLockAdapter1: LockAdapter = {
			lock: vi.fn(),
			unlock: vi.fn(),
		}
		const mockLockAdapter2: LockAdapter = {
			lock: vi.fn(),
			unlock: vi.fn(),
		}
		const lockAdapters = [mockLockAdapter1, mockLockAdapter2]
		const map = new HashLockAdapterMap(lockAdapters)

		const results = new Set<LockAdapter>()
		for (let i = 0; i < 20; i++) {
			const lock = map.getLock(`key-${i}`)
			results.add(lock)
		}

		expect(results.size).toBeGreaterThan(1)
		expect(results.has(mockLockAdapter1)).toBe(true)
		expect(results.has(mockLockAdapter2)).toBe(true)
	})

	test("should use prefix to affect distribution", () => {
		const mockLockAdapter1: LockAdapter = {
			lock: vi.fn(),
			unlock: vi.fn(),
		}
		const mockLockAdapter2: LockAdapter = {
			lock: vi.fn(),
			unlock: vi.fn(),
		}
		const lockAdapters = [mockLockAdapter1, mockLockAdapter2]
		const mapWithoutPrefix = new HashLockAdapterMap(lockAdapters)
		const mapWithPrefix = new HashLockAdapterMap(lockAdapters, "prefix-")

		const key = "test-key"
		const lockWithoutPrefix = mapWithoutPrefix.getLock(key)
		const lockWithPrefix = mapWithPrefix.getLock(key)

		expect(lockWithoutPrefix).toBeOneOf(lockAdapters)
		expect(lockWithPrefix).toBeOneOf(lockAdapters)
	})

	test("should handle single lock adapter", () => {
		const mockLockAdapter: LockAdapter = {
			lock: vi.fn(),
			unlock: vi.fn(),
		}
		const map = new HashLockAdapterMap([mockLockAdapter])

		const lock1 = map.getLock("key1")
		const lock2 = map.getLock("key2")

		expect(lock1).toBe(mockLockAdapter)
		expect(lock2).toBe(mockLockAdapter)
	})

	test("should handle empty string keys", () => {
		const mockLockAdapter: LockAdapter = {
			lock: vi.fn(),
			unlock: vi.fn(),
		}
		const map = new HashLockAdapterMap([mockLockAdapter])

		const lock = map.getLock("")

		expect(lock).toBe(mockLockAdapter)
	})
})

describe("HashRwLockAdapterMap", () => {
	test("should throw error when lock adapters array is empty", () => {
		expect(() => new HashRwLockAdapterMap([])).toThrow(
			"Lock adapters array cannot be empty",
		)
	})

	test("should return the same read-write lock adapter for the same key", () => {
		const mockReadLock1: LockAdapter = {
			lock: vi.fn(),
			unlock: vi.fn(),
		}
		const mockWriteLock1: LockAdapter = {
			lock: vi.fn(),
			unlock: vi.fn(),
		}
		const mockRwLockAdapter1: RwLockAdapter = {
			readLock: mockReadLock1,
			writeLock: mockWriteLock1,
		}
		const mockReadLock2: LockAdapter = {
			lock: vi.fn(),
			unlock: vi.fn(),
		}
		const mockWriteLock2: LockAdapter = {
			lock: vi.fn(),
			unlock: vi.fn(),
		}
		const mockRwLockAdapter2: RwLockAdapter = {
			readLock: mockReadLock2,
			writeLock: mockWriteLock2,
		}
		const lockAdapters = [mockRwLockAdapter1, mockRwLockAdapter2]
		const map = new HashRwLockAdapterMap(lockAdapters)

		const lock1 = map.getLock("test-key")
		const lock2 = map.getLock("test-key")

		expect(lock1).toBe(lock2)
	})

	test("should distribute keys across multiple read-write lock adapters", () => {
		const mockReadLock1: LockAdapter = {
			lock: vi.fn(),
			unlock: vi.fn(),
		}
		const mockWriteLock1: LockAdapter = {
			lock: vi.fn(),
			unlock: vi.fn(),
		}
		const mockRwLockAdapter1: RwLockAdapter = {
			readLock: mockReadLock1,
			writeLock: mockWriteLock1,
		}
		const mockReadLock2: LockAdapter = {
			lock: vi.fn(),
			unlock: vi.fn(),
		}
		const mockWriteLock2: LockAdapter = {
			lock: vi.fn(),
			unlock: vi.fn(),
		}
		const mockRwLockAdapter2: RwLockAdapter = {
			readLock: mockReadLock2,
			writeLock: mockWriteLock2,
		}
		const lockAdapters = [mockRwLockAdapter1, mockRwLockAdapter2]
		const map = new HashRwLockAdapterMap(lockAdapters)

		const results = new Set<RwLockAdapter>()
		for (let i = 0; i < 20; i++) {
			const lock = map.getLock(`key-${i}`)
			results.add(lock)
		}

		expect(results.size).toBeGreaterThan(1)
		expect(results.has(mockRwLockAdapter1)).toBe(true)
		expect(results.has(mockRwLockAdapter2)).toBe(true)
	})

	test("should use prefix to affect distribution", () => {
		const mockReadLock: LockAdapter = {
			lock: vi.fn(),
			unlock: vi.fn(),
		}
		const mockWriteLock: LockAdapter = {
			lock: vi.fn(),
			unlock: vi.fn(),
		}
		const mockRwLockAdapter1: RwLockAdapter = {
			readLock: mockReadLock,
			writeLock: mockWriteLock,
		}
		const mockRwLockAdapter2: RwLockAdapter = {
			readLock: mockReadLock,
			writeLock: mockWriteLock,
		}
		const lockAdapters = [mockRwLockAdapter1, mockRwLockAdapter2]
		const mapWithoutPrefix = new HashRwLockAdapterMap(lockAdapters)
		const mapWithPrefix = new HashRwLockAdapterMap(lockAdapters, "prefix-")

		const key = "test-key"
		const lockWithoutPrefix = mapWithoutPrefix.getLock(key)
		const lockWithPrefix = mapWithPrefix.getLock(key)

		expect(lockWithoutPrefix).toBeOneOf(lockAdapters)
		expect(lockWithPrefix).toBeOneOf(lockAdapters)
	})
})
