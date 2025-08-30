import {
	LockAlreadyHeldError,
	ReadLockNotHeldError,
	WriteLockNotHeldError,
} from "@teawithsand/lngext"
import * as fc from "fast-check"
import { describe, expect, test } from "vitest"
import { WebRwLockAdapter } from "./webRwLockAdapter"

describe("WebRwLockAdapter", () => {
	test("should create instance with lock name", () => {
		const adapter = new WebRwLockAdapter("test-rw-create")
		expect(adapter).toBeDefined()
	})

	test("should provide readLock and writeLock", () => {
		const adapter = new WebRwLockAdapter("test-rw-provide")
		expect(adapter.readLock).toBeDefined()
		expect(adapter.writeLock).toBeDefined()
		expect(adapter.readLock).not.toBe(adapter.writeLock)
	})

	test("should be able to acquire and release read lock", async () => {
		const adapter = new WebRwLockAdapter("test-rw-read")

		await adapter.readLock.lock()
		await adapter.readLock.unlock()
	})

	test("should be able to acquire and release write lock", async () => {
		const adapter = new WebRwLockAdapter("test-rw-write")

		await adapter.writeLock.lock()
		await adapter.writeLock.unlock()
	})

	test("should throw when trying to lock already held read lock", async () => {
		const adapter = new WebRwLockAdapter("test-rw-double-read")

		await adapter.readLock.lock()
		await expect(adapter.readLock.lock()).rejects.toBeInstanceOf(
			LockAlreadyHeldError,
		)
	})

	test("should throw when trying to lock already held write lock", async () => {
		const adapter = new WebRwLockAdapter("test-rw-double-write")

		await adapter.writeLock.lock()
		await expect(adapter.writeLock.lock()).rejects.toBeInstanceOf(
			LockAlreadyHeldError,
		)
	})

	test("should throw when trying to unlock non-held read lock", async () => {
		const adapter = new WebRwLockAdapter("test-rw-unlock-read")

		await expect(adapter.readLock.unlock()).rejects.toBeInstanceOf(
			ReadLockNotHeldError,
		)
	})

	test("should throw when trying to unlock non-held write lock", async () => {
		const adapter = new WebRwLockAdapter("test-rw-unlock-write")

		await expect(adapter.writeLock.unlock()).rejects.toBeInstanceOf(
			WriteLockNotHeldError,
		)
	})

	test("should provide reader-writer exclusion - multiple readers, exclusive writer", async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.integer({ min: 2, max: 4 }),
				fc.integer({ min: 1, max: 2 }),
				async (readerCount, writerCount) => {
					const lockName = `rw-test-${Math.random().toString(36).substring(2)}`
					let sharedResource = 0
					const results: string[] = []

					const readers = Array.from(
						{ length: readerCount },
						async (_, readerId) => {
							const adapter = new WebRwLockAdapter(lockName)
							await adapter.readLock.lock()

							const value = sharedResource
							await new Promise((resolve) =>
								setTimeout(resolve, 2),
							)
							expect(sharedResource).toBe(value)
							results.push(`reader-${readerId}`)

							await adapter.readLock.unlock()
						},
					)

					const writers = Array.from(
						{ length: writerCount },
						async (_, writerId) => {
							const adapter = new WebRwLockAdapter(lockName)
							await adapter.writeLock.lock()

							const oldValue = sharedResource
							await new Promise((resolve) =>
								setTimeout(resolve, 2),
							)
							sharedResource = oldValue + 1
							results.push(`writer-${writerId}`)

							await adapter.writeLock.unlock()
						},
					)

					await Promise.all([...readers, ...writers])

					expect(sharedResource).toBe(writerCount)
					expect(results).toHaveLength(readerCount + writerCount)
				},
			),
			{ numRuns: 3 },
		)
	})
})
