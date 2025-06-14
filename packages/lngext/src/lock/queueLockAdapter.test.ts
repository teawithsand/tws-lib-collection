import * as fc from "fast-check"
import { describe, expect, test } from "vitest"
import { QueueLockAdapter } from "./queueLockAdapter.js"

describe("QueueLockAdapter", () => {
	test("should acquire lock immediately when not held", async () => {
		const adapter = new QueueLockAdapter()

		await adapter.lock()

		expect(adapter.isHeld()).toBe(true)
		expect(adapter.getWaiterCount()).toBe(0)
	})

	test("should queue multiple waiters and grant lock in FIFO order", async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.integer({ min: 2, max: 10 }),
				async (waiterCount) => {
					const adapter = new QueueLockAdapter()
					const executionOrder: number[] = []

					await adapter.lock()
					expect(adapter.isHeld()).toBe(true)

					const waiterPromises = Array.from(
						{ length: waiterCount },
						(_, index) =>
							adapter.lock().then(() => {
								executionOrder.push(index)
								return adapter.unlock()
							}),
					)

					await adapter.unlock()

					await Promise.all(waiterPromises)

					expect(executionOrder).toEqual(
						Array.from({ length: waiterCount }, (_, i) => i),
					)
					expect(adapter.isHeld()).toBe(false)
					expect(adapter.getWaiterCount()).toBe(0)
				},
			),
			{ numRuns: 20 },
		)
	})

	test("should throw error when unlocking non-held lock", async () => {
		const adapter = new QueueLockAdapter()

		await expect(adapter.unlock()).rejects.toThrow(
			"Cannot unlock a lock that is not currently held",
		)
		expect(adapter.isHeld()).toBe(false)
	})

	test("should maintain correct waiter count", async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.integer({ min: 1, max: 5 }),
				async (waiterCount) => {
					const adapter = new QueueLockAdapter()
					await adapter.lock()

					const waiterPromises = Array.from(
						{ length: waiterCount },
						() => adapter.lock(),
					)

					await new Promise((resolve) => setTimeout(resolve, 1))

					expect(adapter.getWaiterCount()).toBe(waiterCount)
					expect(adapter.isHeld()).toBe(true)

					await adapter.unlock()
					await Promise.all(
						waiterPromises.map(async (promise, index) => {
							await promise
							if (index < waiterPromises.length - 1) {
								await adapter.unlock()
							}
						}),
					)
				},
			),
			{ numRuns: 10 },
		)
	})

	test("should handle concurrent lock/unlock operations correctly", async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.integer({ min: 3, max: 8 }),
				async (operationCount) => {
					// Arrange
					const adapter = new QueueLockAdapter()
					let currentLockHolder = -1
					let violations = 0

					const operations = Array.from(
						{ length: operationCount },
						async (_, index) => {
							await adapter.lock()

							const previousHolder = currentLockHolder
							currentLockHolder = index

							await new Promise((resolve) =>
								setTimeout(resolve, 5),
							)

							if (
								previousHolder !== -1 &&
								currentLockHolder !== index
							) {
								violations++
							}

							currentLockHolder = -1
							await adapter.unlock()
						},
					)

					await Promise.all(operations)

					expect(violations).toBe(0)
					expect(adapter.isHeld()).toBe(false)
					expect(adapter.getWaiterCount()).toBe(0)
				},
			),
			{ numRuns: 15 },
		)
	})
})
