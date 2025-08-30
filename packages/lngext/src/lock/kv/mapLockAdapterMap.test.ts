import { describe, expect, test, vi } from "vitest"
import type { LockAdapter, RwLockAdapter } from "../lock"
import { QueueLockAdapter } from "../queueLockAdapter"
import { QueueRwLockAdapter } from "../queueRwLockAdapter"
import {
	LockAdapterMapKeyNotFoundError,
	MapLockAdapterMap,
	MapRwLockAdapterMap,
} from "./mapLockAdapterMap"

describe("MapLockAdapterMap", () => {
	test("should return correct lock adapter for existing keys", () => {
		const mockLock1: LockAdapter = {
			lock: vi.fn(),
			unlock: vi.fn(),
		}
		const mockLock2: LockAdapter = {
			lock: vi.fn(),
			unlock: vi.fn(),
		}

		const lockMap = new Map([
			["key1", mockLock1],
			["key2", mockLock2],
		])
		const map = new MapLockAdapterMap(lockMap)

		expect(map.getLock("key1")).toBe(mockLock1)
		expect(map.getLock("key2")).toBe(mockLock2)
	})

	test("should create map using factory function", () => {
		const lockFactory = vi.fn(
			(): LockAdapter => ({
				lock: vi.fn(),
				unlock: vi.fn(),
			}),
		)

		const keys = ["key1", "key2"]
		const map = MapLockAdapterMap.create(lockFactory, keys)

		expect(lockFactory).toHaveBeenCalledTimes(2)
		expect(() => map.getLock("key1")).not.toThrow()
		expect(() => map.getLock("key2")).not.toThrow()
	})

	test("should throw for non-existent key", () => {
		const lockMap = new Map<string, LockAdapter>()
		const map = new MapLockAdapterMap(lockMap)

		expect(() => map.getLock("missing")).toThrow(
			LockAdapterMapKeyNotFoundError,
		)
	})

	test("should work with real QueueLockAdapter", () => {
		const map = MapLockAdapterMap.create(
			() => new QueueLockAdapter(),
			["test"],
		)

		const lock = map.getLock("test")
		expect(lock).toBeDefined()
	})
})

describe("MapRwLockAdapterMap", () => {
	test("should return correct read-write lock adapter for existing keys", () => {
		const mockRwLock: RwLockAdapter = {
			readLock: { lock: vi.fn(), unlock: vi.fn() },
			writeLock: { lock: vi.fn(), unlock: vi.fn() },
		}

		const lockMap = new Map([["key1", mockRwLock]])
		const map = new MapRwLockAdapterMap(lockMap)

		expect(map.getLock("key1")).toBe(mockRwLock)
	})

	test("should create map using factory function", () => {
		const rwLockFactory = vi.fn(
			(): RwLockAdapter => ({
				readLock: { lock: vi.fn(), unlock: vi.fn() },
				writeLock: { lock: vi.fn(), unlock: vi.fn() },
			}),
		)

		const keys = ["key1", "key2"]
		const map = MapRwLockAdapterMap.create(rwLockFactory, keys)

		expect(rwLockFactory).toHaveBeenCalledTimes(2)
		expect(() => map.getLock("key1")).not.toThrow()
		expect(() => map.getLock("key2")).not.toThrow()
	})

	test("should throw for non-existent key", () => {
		const lockMap = new Map<string, RwLockAdapter>()
		const map = new MapRwLockAdapterMap(lockMap)

		expect(() => map.getLock("missing")).toThrow(
			LockAdapterMapKeyNotFoundError,
		)
	})

	test("should work with real QueueRwLockAdapter", () => {
		const map = MapRwLockAdapterMap.create(
			() => new QueueRwLockAdapter(),
			["test"],
		)

		const rwLock = map.getLock("test")
		expect(rwLock).toBeDefined()
	})
})

describe("LockAdapterMapKeyNotFoundError", () => {
	test("should be an instance of Error", () => {
		const error = new LockAdapterMapKeyNotFoundError("Test message")

		expect(error).toBeInstanceOf(Error)
		expect(error.message).toBe("Test message")
		expect(error.name).toBe("LockAdapterMapKeyNotFoundError")
	})
})
