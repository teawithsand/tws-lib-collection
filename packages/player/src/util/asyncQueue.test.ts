import fc from "fast-check"
import { describe, expect, test } from "vitest"
import { AsyncTaskQueue } from "./asyncQueue" // adjust import path as needed

describe("AsyncTaskQueue", () => {
	test("executes tasks in order", async () => {
		const queue = new AsyncTaskQueue()

		const results: number[] = []

		queue.enqueue(async () => {
			await new Promise((r) => setTimeout(r, 50))
			results.push(1)
		})

		queue.enqueue(async () => {
			results.push(2)
		})

		queue.enqueue(async () => {
			results.push(3)
		})

		await queue.idlePromise()

		expect(results).toEqual([1, 2, 3])
	})

	test("queueLength reflects number of queued tasks", async () => {
		const queue = new AsyncTaskQueue()

		expect(queue.queueLength).toBe(0)

		queue.enqueue(async () => {
			await new Promise((r) => setTimeout(r, 100))
		})

		// First task starts immediately, queue is empty
		expect(queue.queueLength).toBe(0)

		queue.enqueue(async () => {
			await new Promise((r) => setTimeout(r, 100))
		})

		// Second task is queued while first is running
		expect(queue.queueLength).toBe(1)

		await queue.idlePromise()

		expect(queue.queueLength).toBe(0)
	})

	test("clear removes all queued but not started tasks", async () => {
		const queue = new AsyncTaskQueue()

		const results: number[] = []

		queue.enqueue(async () => {
			results.push(1)
			await new Promise((r) => setTimeout(r, 50))
		})

		queue.enqueue(async () => {
			results.push(2) // this should be cleared and never run
		})

		queue.enqueue(async () => {
			results.push(3) // this too
		})

		// Let first task start running, then clear
		await new Promise((r) => setTimeout(r, 10))
		queue.clear()

		await queue.idlePromise()

		expect(results).toEqual([1])
		expect(queue.queueLength).toBe(0)
	})

	test("enqueue returns promise that resolves with task result", async () => {
		const queue = new AsyncTaskQueue()

		const task = () => Promise.resolve(42)

		const result = await queue.enqueue(task)

		expect(result).toBe(42)
	})

	test("enqueue returns promise that rejects if task throws", async () => {
		const queue = new AsyncTaskQueue()

		const error = new Error("fail")

		const task = () => Promise.reject(error)

		await expect(queue.enqueue(task)).rejects.toThrowError(error)
	})

	test("idlePromise resolves immediately if queue empty and not running", async () => {
		const queue = new AsyncTaskQueue()

		await expect(queue.idlePromise()).resolves.toBeUndefined()
	})

	test("idlePromise waits until all tasks complete", async () => {
		const queue = new AsyncTaskQueue()

		let done = false

		queue.enqueue(async () => {
			await new Promise((r) => setTimeout(r, 50))
			done = true
		})

		await queue.idlePromise()

		expect(done).toBe(true)
	})

	test("tasks run in enqueued order", async () => {
		await fc.assert(
			fc.asyncProperty(
				// Generate arrays of positive integers (task delays in ms)
				fc.array(fc.integer({ min: 0, max: 20 }), { maxLength: 20 }),
				async (delays) => {
					const queue = new AsyncTaskQueue()

					const results: number[] = []

					// Enqueue tasks with delay[i], pushing the index i into results when done
					for (let i = 0; i < delays.length; i++) {
						const delay = delays[i]
						queue.enqueue(async () => {
							await new Promise((r) => setTimeout(r, delay))
							results.push(i)
						})
					}

					// Wait for all to complete
					await queue.idlePromise()

					// The results array must be exactly [0, 1, 2, ..., delays.length - 1]
					expect(results).toEqual(
						Array.from({ length: delays.length }, (_, i) => i),
					)
				},
			),
			{
				numRuns: 10,
			},
		)
	})

	test("isRunning is false initially", () => {
		const queue = new AsyncTaskQueue()
		expect(queue.isRunning).toBe(false)
	})

	test("isRunning becomes true while a task is running", async () => {
		const queue = new AsyncTaskQueue()

		let resolveTask: () => void
		const taskStarted = new Promise<void>((resolve) => {
			resolveTask = resolve
		})

		queue.enqueue(async () => {
			// Signal task started
			resolveTask!()
			await new Promise((r) => setTimeout(r, 50))
		})

		await taskStarted

		// At this point task is running, so isRunning should be true
		expect(queue.isRunning).toBe(true)

		// Wait for completion
		await queue.idlePromise()

		// After all done, isRunning should be false
		expect(queue.isRunning).toBe(false)
	})

	test("isRunning is false once idlePromise has resolved", async () => {
		const queue = new AsyncTaskQueue()

		let resolveTask: () => void
		const taskStarted = new Promise<void>((resolve) => {
			resolveTask = resolve
		})

		queue.enqueue(async () => {
			resolveTask!()
			// simulate some async work
			await new Promise((r) => setTimeout(r, 20))
		})

		// Wait until task starts running
		await taskStarted

		// While task is running, isRunning should be true
		expect(queue.isRunning).toBe(true)

		// Wait for all tasks to complete
		await queue.idlePromise()

		// After idlePromise resolves, isRunning should be false
		expect(queue.isRunning).toBe(false)
	})
})
