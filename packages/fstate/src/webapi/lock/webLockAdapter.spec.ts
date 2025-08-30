import { LockAlreadyHeldError, LockNotHeldError } from "@teawithsand/lngext"
import * as fc from "fast-check"
import { describe, expect, test } from "vitest"
import { WebLockAdapter } from "./webLockAdapter"

describe("WebLockAdapter", () => {
	test("should create instance with lock name", () => {
		const adapter = new WebLockAdapter("test-lock-create")
		expect(adapter).toBeDefined()
	})

	test("should initially not hold lock", () => {
		const adapter = new WebLockAdapter("test-lock-initial")
		expect(adapter.isHeld()).toBe(false)
	})

	test("should be able to lock and unlock", async () => {
		const adapter = new WebLockAdapter("test-lock-basic")

		await adapter.lock()
		expect(adapter.isHeld()).toBe(true)

		await adapter.unlock()
		expect(adapter.isHeld()).toBe(false)
	})

	test("should throw when trying to lock already held lock", async () => {
		const adapter = new WebLockAdapter("test-lock-double")

		await adapter.lock()
		await expect(adapter.lock()).rejects.toBeInstanceOf(
			LockAlreadyHeldError,
		)
	})

	test("should throw when trying to unlock non-held lock", async () => {
		const adapter = new WebLockAdapter("test-lock-unlock")

		await expect(adapter.unlock()).rejects.toBeInstanceOf(LockNotHeldError)
	})

	test("should provide mutual exclusion - critical section protection", async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.integer({ min: 2, max: 8 }),
				fc.integer({ min: 10, max: 50 }),
				async (workerCount, operationCount) => {
					const lockName = `critical-section-${Math.random().toString(36).substring(2)}`
					let criticalSectionCounter = 0
					let maxConcurrentAccess = 0
					let currentAccess = 0
					const results: number[] = []

					const workers = Array.from(
						{ length: workerCount },
						async (_, workerId) => {
							const adapter = new WebLockAdapter(lockName)
							for (let i = 0; i < operationCount; i++) {
								await adapter.lock()

								currentAccess++
								maxConcurrentAccess = Math.max(
									maxConcurrentAccess,
									currentAccess,
								)

								const localCounter = criticalSectionCounter
								await new Promise((resolve) =>
									setTimeout(resolve, 1),
								)
								criticalSectionCounter = localCounter + 1
								results.push(workerId)

								currentAccess--
								await adapter.unlock()
							}
						},
					)

					await Promise.all(workers)

					expect(maxConcurrentAccess).toBe(1)
					expect(criticalSectionCounter).toBe(
						workerCount * operationCount,
					)
					expect(results).toHaveLength(workerCount * operationCount)
				},
			),
			{ numRuns: 5 },
		)
	})
})
