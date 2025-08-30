import { describe, expect, test, vi } from "vitest"
import type { LockAdapter, RwLockAdapter } from "../lock"
import type { LockAdapterMap, RwLockAdapterMap } from "./lockAdapterMap"
import {
	TransformLockAdapterMap,
	TransformRwLockAdapterMap,
} from "./transformLockAdapterMap"

describe("TransformLockAdapterMap", () => {
	test("should transform key before calling inner map", () => {
		const mockLockAdapter: LockAdapter = {
			lock: vi.fn(),
			unlock: vi.fn(),
		}

		const mockInnerMap: LockAdapterMap = {
			getLock: vi.fn().mockReturnValue(mockLockAdapter),
		}

		const transform = (key: string) => `prefix_${key}`
		const transformMap = new TransformLockAdapterMap(
			mockInnerMap,
			transform,
		)

		const result = transformMap.getLock("test-key")

		expect(mockInnerMap.getLock).toHaveBeenCalledWith("prefix_test-key")
		expect(result).toBe(mockLockAdapter)
	})

	test("should return lock adapter from inner map", () => {
		const mockLockAdapter: LockAdapter = {
			lock: vi.fn(),
			unlock: vi.fn(),
		}

		const mockInnerMap: LockAdapterMap = {
			getLock: vi.fn().mockReturnValue(mockLockAdapter),
		}

		const transform = (key: string) => key.toUpperCase()
		const transformMap = new TransformLockAdapterMap(
			mockInnerMap,
			transform,
		)

		const result = transformMap.getLock("test")

		expect(result).toBe(mockLockAdapter)
	})

	test("should apply transform function correctly", () => {
		const mockLockAdapter: LockAdapter = {
			lock: vi.fn(),
			unlock: vi.fn(),
		}

		const mockInnerMap: LockAdapterMap = {
			getLock: vi.fn().mockReturnValue(mockLockAdapter),
		}

		const transform = (key: string) => key.split("").reverse().join("")
		const transformMap = new TransformLockAdapterMap(
			mockInnerMap,
			transform,
		)

		transformMap.getLock("abc")

		expect(mockInnerMap.getLock).toHaveBeenCalledWith("cba")
	})
})

describe("TransformRwLockAdapterMap", () => {
	test("should transform key before calling inner map", () => {
		const mockRwLockAdapter: RwLockAdapter = {
			readLock: {
				lock: vi.fn(),
				unlock: vi.fn(),
			},
			writeLock: {
				lock: vi.fn(),
				unlock: vi.fn(),
			},
		}

		const mockInnerMap: RwLockAdapterMap = {
			getLock: vi.fn().mockReturnValue(mockRwLockAdapter),
		}

		const transform = (key: string) => `prefix_${key}`
		const transformMap = new TransformRwLockAdapterMap(
			mockInnerMap,
			transform,
		)

		const result = transformMap.getLock("test-key")

		expect(mockInnerMap.getLock).toHaveBeenCalledWith("prefix_test-key")
		expect(result).toBe(mockRwLockAdapter)
	})

	test("should return rw lock adapter from inner map", () => {
		const mockRwLockAdapter: RwLockAdapter = {
			readLock: {
				lock: vi.fn(),
				unlock: vi.fn(),
			},
			writeLock: {
				lock: vi.fn(),
				unlock: vi.fn(),
			},
		}

		const mockInnerMap: RwLockAdapterMap = {
			getLock: vi.fn().mockReturnValue(mockRwLockAdapter),
		}

		const transform = (key: string) => key.toUpperCase()
		const transformMap = new TransformRwLockAdapterMap(
			mockInnerMap,
			transform,
		)

		const result = transformMap.getLock("test")

		expect(result).toBe(mockRwLockAdapter)
	})

	test("should apply transform function correctly", () => {
		const mockRwLockAdapter: RwLockAdapter = {
			readLock: {
				lock: vi.fn(),
				unlock: vi.fn(),
			},
			writeLock: {
				lock: vi.fn(),
				unlock: vi.fn(),
			},
		}

		const mockInnerMap: RwLockAdapterMap = {
			getLock: vi.fn().mockReturnValue(mockRwLockAdapter),
		}

		const transform = (key: string) => key.split("").reverse().join("")
		const transformMap = new TransformRwLockAdapterMap(
			mockInnerMap,
			transform,
		)

		transformMap.getLock("abc")

		expect(mockInnerMap.getLock).toHaveBeenCalledWith("cba")
	})
})
