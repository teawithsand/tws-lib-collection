import * as fc from "fast-check"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import {
	InvalidSleepTimeError,
	Promises,
	SleepCancelledError,
} from "./promises"

describe("Promises", () => {
	describe("latePromise", () => {
		test("should resolve promise when resolver is called", async () => {
			const [promise, resolve] = Promises.latePromise<string>()

			const testValue = "test value"
			resolve(testValue)

			await expect(promise).resolves.toBe(testValue)
		})

		test("should reject promise when rejector is called", async () => {
			const [promise, , reject] = Promises.latePromise<string>()

			const testError = new Error("test error")
			reject(testError)

			await expect(promise).rejects.toBe(testError)
		})

		test("should resolve immediately when resolver called before awaiting", async () => {
			const [promise, resolve] = Promises.latePromise<number>()

			resolve(42)

			await expect(promise).resolves.toBe(42)
		})

		test("should reject immediately when rejector called before awaiting", async () => {
			const [promise, , reject] = Promises.latePromise<number>()

			const error = new Error("early error")
			reject(error)

			await expect(promise).rejects.toBe(error)
		})

		test("should only settle with the first resolution", async () => {
			const [promise, resolve] = Promises.latePromise<string>()

			resolve("first")
			resolve("second")

			await expect(promise).resolves.toBe("first")
		})

		test("should only settle with the first rejection", async () => {
			const [promise, , reject] = Promises.latePromise<string>()

			const firstError = new Error("first")
			const secondError = new Error("second")

			reject(firstError)
			reject(secondError)

			await expect(promise).rejects.toBe(firstError)
		})

		test("should prioritize rejection over subsequent resolution", async () => {
			const [promise, resolve, reject] = Promises.latePromise<string>()

			const error = new Error("error")
			reject(error)
			resolve("value")

			await expect(promise).rejects.toBe(error)
		})

		test("should prioritize resolution over subsequent rejection", async () => {
			const [promise, resolve, reject] = Promises.latePromise<string>()

			resolve("value")
			reject(new Error("error"))

			await expect(promise).resolves.toBe("value")
		})

		test("should work with different types", async () => {
			const [numberPromise, resolveNumber] =
				Promises.latePromise<number>()
			const [objectPromise, resolveObject] = Promises.latePromise<{
				key: string
			}>()
			const [nullPromise, resolveNull] = Promises.latePromise<null>()

			resolveNumber(123)
			resolveObject({ key: "value" })
			resolveNull(null)

			await expect(numberPromise).resolves.toBe(123)
			await expect(objectPromise).resolves.toEqual({ key: "value" })
			await expect(nullPromise).resolves.toBe(null)
		})
	})

	describe("dummyCatch", () => {
		test("should always resolve to undefined for resolved promises", async () => {
			const resolvedPromise = Promise.resolve("success")

			await expect(
				Promises.dummyCatch(resolvedPromise),
			).resolves.toBeUndefined()
		})

		test("should always resolve to undefined for rejected promises", async () => {
			const rejectedPromise = Promise.reject(new Error("test error"))

			await expect(
				Promises.dummyCatch(rejectedPromise),
			).resolves.toBeUndefined()
		})

		test("should always resolve to undefined for promises that throw", async () => {
			const throwingPromise = Promise.resolve().then(() => {
				throw new Error("thrown error")
			})

			await expect(
				Promises.dummyCatch(throwingPromise),
			).resolves.toBeUndefined()
		})

		test("should work with promises of different types", async () => {
			const stringPromise = Promise.resolve("string")
			const numberPromise = Promise.resolve(42)
			const objectPromise = Promise.resolve({ key: "value" })

			await expect(
				Promises.dummyCatch(stringPromise),
			).resolves.toBeUndefined()
			await expect(
				Promises.dummyCatch(numberPromise),
			).resolves.toBeUndefined()
			await expect(
				Promises.dummyCatch(objectPromise),
			).resolves.toBeUndefined()
		})
	})

	describe("dummyCatchVoid", () => {
		test("should return undefined immediately", () => {
			const promise = Promise.resolve("test")

			const result = Promises.dummyCatchVoid(promise)

			expect(result).toBeUndefined()
		})

		test("should not throw for rejected promises", () => {
			const rejectedPromise = Promise.reject(new Error("test error"))

			expect(() => Promises.dummyCatchVoid(rejectedPromise)).not.toThrow()
		})

		test("should not throw for resolved promises", () => {
			const resolvedPromise = Promise.resolve("success")

			expect(() => Promises.dummyCatchVoid(resolvedPromise)).not.toThrow()
		})

		test("should not throw for promises of different types", () => {
			const stringPromise = Promise.resolve("string")
			const numberPromise = Promise.resolve(42)
			const rejectedPromise = Promise.reject(new Error("error"))

			expect(() => {
				Promises.dummyCatchVoid(stringPromise)
				Promises.dummyCatchVoid(numberPromise)
				Promises.dummyCatchVoid(rejectedPromise)
			}).not.toThrow()
		})
	})

	describe("simpleSleep", () => {
		beforeEach(() => {
			vi.useFakeTimers()
		})

		afterEach(() => {
			vi.useRealTimers()
		})

		test("should resolve after the specified time elapses", async () => {
			const sleepPromise = Promises.simpleSleep(1000)

			vi.advanceTimersByTime(1000)

			await expect(sleepPromise).resolves.toBeUndefined()
		})

		test("should not resolve before specified time elapses", async () => {
			const sleepPromise = Promises.simpleSleep(1000)
			let resolved = false

			sleepPromise.then(() => {
				resolved = true
			})

			vi.advanceTimersByTime(999)
			await Promise.resolve()

			expect(resolved).toBe(false)
		})

		test("should throw InvalidSleepTimeError for negative time", () => {
			expect(() => Promises.simpleSleep(-1)).toThrow(
				InvalidSleepTimeError,
			)
			expect(() => Promises.simpleSleep(-100)).toThrow(
				InvalidSleepTimeError,
			)
		})

		test("should throw InvalidSleepTimeError for infinite time", () => {
			expect(() => Promises.simpleSleep(Infinity)).toThrow(
				InvalidSleepTimeError,
			)
			expect(() => Promises.simpleSleep(-Infinity)).toThrow(
				InvalidSleepTimeError,
			)
		})

		test("should throw InvalidSleepTimeError for NaN", () => {
			expect(() => Promises.simpleSleep(NaN)).toThrow(
				InvalidSleepTimeError,
			)
		})

		test("should resolve immediately with zero time", async () => {
			const sleepPromise = Promises.simpleSleep(0)

			vi.advanceTimersByTime(0)

			await expect(sleepPromise).resolves.toBeUndefined()
		})

		test("should accept any valid time value", () => {
			fc.assert(
				fc.property(
					fc.integer({ min: 0, max: 10000 }),
					(timeMillis) => {
						expect(() =>
							Promises.simpleSleep(timeMillis),
						).not.toThrow()
					},
				),
			)
		})

		test("should reject invalid time values", () => {
			fc.assert(
				fc.property(
					fc.oneof(
						fc.float({
							min: Math.fround(-1000),
							max: Math.fround(-0.1),
						}),
						fc.constant(Infinity),
						fc.constant(-Infinity),
						fc.constant(NaN),
					),
					(invalidTime) => {
						expect(() => Promises.simpleSleep(invalidTime)).toThrow(
							InvalidSleepTimeError,
						)
					},
				),
			)
		})
	})

	describe("sleep", () => {
		beforeEach(() => {
			vi.useFakeTimers()
		})

		afterEach(() => {
			vi.useRealTimers()
		})

		test("should return object with promise and cancel function", () => {
			const sleepResult = Promises.sleep(1000)

			expect(sleepResult).toHaveProperty("promise")
			expect(sleepResult).toHaveProperty("cancel")
			expect(typeof sleepResult.cancel).toBe("function")
			expect(sleepResult.promise).toBeInstanceOf(Promise)
		})

		test("should resolve after the specified time elapses", async () => {
			const sleepResult = Promises.sleep(1000)

			vi.advanceTimersByTime(1000)

			await expect(sleepResult.promise).resolves.toBeUndefined()
		})

		test("should not resolve before the specified time elapses", async () => {
			const sleepResult = Promises.sleep(1000)
			let resolved = false

			sleepResult.promise.then(() => {
				resolved = true
			})

			vi.advanceTimersByTime(999)
			await Promise.resolve()

			expect(resolved).toBe(false)
		})

		test("should reject with SleepCancelledError when cancelled before completion", async () => {
			const sleepResult = Promises.sleep(1000)

			sleepResult.cancel()

			await expect(sleepResult.promise).rejects.toThrow(
				SleepCancelledError,
			)
		})

		test("should reject with SleepCancelledError when cancelled during sleep", async () => {
			const sleepResult = Promises.sleep(1000)

			vi.advanceTimersByTime(500)
			sleepResult.cancel()

			await expect(sleepResult.promise).rejects.toThrow(
				SleepCancelledError,
			)
		})

		test("should not throw when cancelled after completion", async () => {
			const sleepResult = Promises.sleep(1000)

			vi.advanceTimersByTime(1000)
			await sleepResult.promise

			expect(() => sleepResult.cancel()).not.toThrow()
		})

		test("should not throw when cancelled multiple times", async () => {
			const sleepResult = Promises.sleep(1000)

			sleepResult.cancel()

			expect(() => sleepResult.cancel()).not.toThrow()
			expect(() => sleepResult.cancel()).not.toThrow()

			await expect(sleepResult.promise).rejects.toThrow(
				SleepCancelledError,
			)
		})

		test("should throw InvalidSleepTimeError for negative time", () => {
			expect(() => Promises.sleep(-1)).toThrow(InvalidSleepTimeError)
			expect(() => Promises.sleep(-100)).toThrow(InvalidSleepTimeError)
		})

		test("should throw InvalidSleepTimeError for infinite time", () => {
			expect(() => Promises.sleep(Infinity)).toThrow(
				InvalidSleepTimeError,
			)
			expect(() => Promises.sleep(-Infinity)).toThrow(
				InvalidSleepTimeError,
			)
		})

		test("should throw InvalidSleepTimeError for NaN", () => {
			expect(() => Promises.sleep(NaN)).toThrow(InvalidSleepTimeError)
		})

		test("should resolve immediately with zero time", async () => {
			const sleepResult = Promises.sleep(0)

			vi.advanceTimersByTime(0)

			await expect(sleepResult.promise).resolves.toBeUndefined()
		})

		test("should return proper structure for valid time values", () => {
			fc.assert(
				fc.property(
					fc.integer({ min: 0, max: 10000 }),
					(timeMillis) => {
						const sleepResult = Promises.sleep(timeMillis)
						expect(sleepResult).toHaveProperty("promise")
						expect(sleepResult).toHaveProperty("cancel")
						expect(typeof sleepResult.cancel).toBe("function")
						expect(sleepResult.promise).toBeInstanceOf(Promise)
					},
				),
			)
		})

		test("should reject invalid time values", () => {
			fc.assert(
				fc.property(
					fc.oneof(
						fc.float({
							min: Math.fround(-1000),
							max: Math.fround(-0.1),
						}),
						fc.constant(Infinity),
						fc.constant(-Infinity),
						fc.constant(NaN),
					),
					(invalidTime) => {
						expect(() => Promises.sleep(invalidTime)).toThrow(
							InvalidSleepTimeError,
						)
					},
				),
			)
		})
	})
})
