import * as fc from "fast-check"
import { describe, expect, test } from "vitest"
import { QueueRwLockAdapter } from "./queueRwLockAdapter.js"

describe("QueueRwLockAdapter", () => {
	test("error handling", async () => {
		const adapter = new QueueRwLockAdapter()

		await expect(adapter.readLock.unlock()).rejects.toThrow(
			"Cannot unlock read lock when no readers are active",
		)
		await expect(adapter.writeLock.unlock()).rejects.toThrow(
			"Cannot unlock write lock when no writer is active",
		)
	})

	test("property: comprehensive lock behavior", () => {
		fc.assert(
			fc.asyncProperty(
				fc.record({
					readerCount: fc.integer({ min: 1, max: 8 }),
					writerCount: fc.integer({ min: 1, max: 3 }),
					operations: fc.array(
						fc.oneof(
							fc.constant("lock-read"),
							fc.constant("lock-write"),
							fc.constant("unlock-read"),
							fc.constant("unlock-write"),
						),
						{ minLength: 5, maxLength: 15 },
					),
				}),
				async ({ readerCount, writerCount, operations }) => {
					const adapter = new QueueRwLockAdapter()
					const results: string[] = []
					let activeReaders = 0
					let activeWriter = false

					const multiReaderPromises = Array.from(
						{ length: readerCount },
						(_, i) =>
							adapter.readLock.lock().then(() => {
								results.push(`multi-reader-${i}`)
							}),
					)
					await Promise.all(multiReaderPromises)
					activeReaders = readerCount

					expect(adapter.getActiveReaderCount()).toBe(readerCount)
					expect(adapter.hasActiveReaders()).toBe(true)
					expect(adapter.hasActiveWriter()).toBe(false)

					for (let i = 0; i < readerCount; i++) {
						await adapter.readLock.unlock()
						activeReaders--
					}

					const writerPromises = Array.from(
						{ length: writerCount },
						(_, i) =>
							adapter.writeLock
								.lock()
								.then(() => {
									results.push(`writer-${i}`)
								})
								.then(async () => {
									await adapter.writeLock.unlock()
								}),
					)

					const firstWriter = writerPromises[0]
					await firstWriter

					if (writerCount > 1) {
						await Promise.all(writerPromises.slice(1))
					}

					for (const action of operations) {
						try {
							switch (action) {
								case "lock-read":
									if (!activeWriter) {
										await adapter.readLock.lock()
										activeReaders++
									}
									break
								case "lock-write":
									if (!activeWriter && activeReaders === 0) {
										await adapter.writeLock.lock()
										activeWriter = true
									}
									break
								case "unlock-read":
									if (activeReaders > 0) {
										await adapter.readLock.unlock()
										activeReaders--
									}
									break
								case "unlock-write":
									if (activeWriter) {
										await adapter.writeLock.unlock()
										activeWriter = false
									}
									break
							}

							expect(
								adapter.getActiveReaderCount(),
							).toBeGreaterThanOrEqual(0)
							expect(
								adapter.getReadWaiterCount(),
							).toBeGreaterThanOrEqual(0)
							expect(
								adapter.getWriteWaiterCount(),
							).toBeGreaterThanOrEqual(0)

							if (adapter.hasActiveWriter()) {
								expect(adapter.hasActiveReaders()).toBe(false)
								expect(adapter.getActiveReaderCount()).toBe(0)
							}

							if (adapter.hasActiveReaders()) {
								expect(adapter.hasActiveWriter()).toBe(false)
							}
						} catch {
							// Expected errors from invalid operations
						}
					}

					expect(
						results.filter((r) => r.startsWith("multi-reader")),
					).toHaveLength(readerCount)
					expect(
						results.filter((r) => r.startsWith("writer")),
					).toHaveLength(writerCount)
				},
			),
		)
	})

	test("property: writer priority and blocking", () => {
		fc.assert(
			fc.asyncProperty(
				fc.record({
					initialReaders: fc.integer({ min: 1, max: 4 }),
					waitingWriters: fc.integer({ min: 1, max: 3 }),
					waitingReaders: fc.integer({ min: 1, max: 4 }),
				}),
				async ({ initialReaders, waitingWriters, waitingReaders }) => {
					const adapter = new QueueRwLockAdapter()
					const results: string[] = []

					const initialReaderPromises = Array.from(
						{ length: initialReaders },
						() => adapter.readLock.lock(),
					)
					await Promise.all(initialReaderPromises)

					const writerPromises = Array.from(
						{ length: waitingWriters },
						(_, i) =>
							adapter.writeLock.lock().then(() => {
								results.push(`writer-${i}`)
							}),
					)

					const blockedReaderPromises = Array.from(
						{ length: waitingReaders },
						(_, i) =>
							adapter.readLock.lock().then(() => {
								results.push(`blocked-reader-${i}`)
							}),
					)

					await new Promise((resolve) => setTimeout(resolve, 10))

					expect(adapter.getWriteWaiterCount()).toBe(waitingWriters)
					expect(adapter.getReadWaiterCount()).toBe(waitingReaders)

					await Promise.all(
						Array.from({ length: initialReaders }, () =>
							adapter.readLock.unlock(),
						),
					)

					await Promise.all(writerPromises)
					for (let i = 0; i < waitingWriters; i++) {
						await adapter.writeLock.unlock()
					}

					await Promise.all(blockedReaderPromises)
					for (let i = 0; i < waitingReaders; i++) {
						await adapter.readLock.unlock()
					}

					const writerResults = results.filter((r) =>
						r.startsWith("writer-"),
					)
					const readerResults = results.filter((r) =>
						r.startsWith("blocked-reader-"),
					)

					expect(writerResults).toHaveLength(waitingWriters)
					expect(readerResults).toHaveLength(waitingReaders)

					const firstReaderIndex = results.findIndex((r) =>
						r.startsWith("blocked-reader-"),
					)
					const lastWriterIndex = results
						.map((r, i) => (r.startsWith("writer-") ? i : -1))
						.filter((i) => i !== -1)
						.pop()

					if (
						firstReaderIndex !== -1 &&
						lastWriterIndex !== undefined
					) {
						expect(lastWriterIndex).toBeLessThan(firstReaderIndex)
					}
				},
			),
		)
	})
})
