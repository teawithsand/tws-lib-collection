import { describe, expect, test, vi } from "vitest"
import { ReleaseHelper, ReleaseHelperError } from "./releaseHelper"

describe("ReleaseHelper", () => {
	describe("addAsync", () => {
		test("should add async releaser to stack", async () => {
			const helper = new ReleaseHelper()
			const mockReleaser = vi.fn().mockResolvedValue(undefined)

			helper.addAsync("test-tag", mockReleaser)

			await helper.release()

			expect(mockReleaser).toHaveBeenCalledOnce()
		})

		test("should handle multiple async releasers", async () => {
			const helper = new ReleaseHelper()
			const mockReleaser1 = vi.fn().mockResolvedValue(undefined)
			const mockReleaser2 = vi.fn().mockResolvedValue(undefined)

			helper.addAsync("tag-1", mockReleaser1)
			helper.addAsync("tag-2", mockReleaser2)

			await helper.release()

			expect(mockReleaser1).toHaveBeenCalledOnce()
			expect(mockReleaser2).toHaveBeenCalledOnce()
		})
	})

	describe("add (deprecated)", () => {
		test("should work as alias for addAsync", async () => {
			const helper = new ReleaseHelper()
			const mockReleaser = vi.fn().mockResolvedValue(undefined)

			helper.add("test-tag", mockReleaser)

			await helper.release()

			expect(mockReleaser).toHaveBeenCalledOnce()
		})
	})

	describe("addSync", () => {
		test("should add sync releaser to stack", async () => {
			const helper = new ReleaseHelper()
			const mockReleaser = vi.fn()

			helper.addSync("test-tag", mockReleaser)

			await helper.release()

			expect(mockReleaser).toHaveBeenCalledOnce()
		})

		test("should handle multiple sync releasers", async () => {
			const helper = new ReleaseHelper()
			const mockReleaser1 = vi.fn()
			const mockReleaser2 = vi.fn()

			helper.addSync("tag-1", mockReleaser1)
			helper.addSync("tag-2", mockReleaser2)

			await helper.release()

			expect(mockReleaser1).toHaveBeenCalledOnce()
			expect(mockReleaser2).toHaveBeenCalledOnce()
		})
	})

	describe("mixed releasers", () => {
		test("should handle both sync and async releasers", async () => {
			const helper = new ReleaseHelper()
			const syncMock = vi.fn()
			const asyncMock = vi.fn().mockResolvedValue(undefined)

			helper.addSync("sync-tag", syncMock)
			helper.addAsync("async-tag", asyncMock)

			await helper.release()

			expect(syncMock).toHaveBeenCalledOnce()
			expect(asyncMock).toHaveBeenCalledOnce()
		})
	})

	describe("execution order", () => {
		test("should execute releasers in LIFO order (stack behavior)", async () => {
			const helper = new ReleaseHelper()
			const executionOrder: string[] = []

			const releaser1 = vi.fn(() => executionOrder.push("first"))
			const releaser2 = vi.fn(() => executionOrder.push("second"))
			const releaser3 = vi.fn(() => executionOrder.push("third"))

			helper.addSync("first", releaser1)
			helper.addSync("second", releaser2)
			helper.addSync("third", releaser3)

			await helper.release()

			expect(executionOrder).toEqual(["third", "second", "first"])
		})

		test("should execute async releasers in LIFO order", async () => {
			const helper = new ReleaseHelper()
			const executionOrder: string[] = []

			const releaser1 = vi.fn().mockImplementation(async () => {
				await new Promise((resolve) => setTimeout(resolve, 10))
				executionOrder.push("first")
			})
			const releaser2 = vi.fn().mockImplementation(async () => {
				await new Promise((resolve) => setTimeout(resolve, 5))
				executionOrder.push("second")
			})
			const releaser3 = vi.fn().mockImplementation(async () => {
				executionOrder.push("third")
			})

			helper.addAsync("first", releaser1)
			helper.addAsync("second", releaser2)
			helper.addAsync("third", releaser3)

			await helper.release()

			expect(executionOrder).toEqual(["third", "second", "first"])
		})
	})

	describe("release", () => {
		test("should complete successfully with no releasers", async () => {
			const helper = new ReleaseHelper()

			await expect(helper.release()).resolves.toBeUndefined()
		})

		test("should clear the stack after release", async () => {
			const helper = new ReleaseHelper()
			const mockReleaser = vi.fn().mockResolvedValue(undefined)

			helper.addAsync("test-tag", mockReleaser)
			await helper.release()

			// Second release should not call the releaser again
			mockReleaser.mockClear()
			await helper.release()

			expect(mockReleaser).not.toHaveBeenCalled()
		})

		test("should throw ReleaseHelperError when a releaser fails", async () => {
			const helper = new ReleaseHelper()
			const error = new Error("Releaser failed")
			const failingReleaser = vi.fn().mockRejectedValue(error)

			helper.addAsync("failing-tag", failingReleaser)

			await expect(helper.release()).rejects.toThrow(ReleaseHelperError)
		})

		test("should throw ReleaseHelperError with correct message for single failure", async () => {
			const helper = new ReleaseHelper()
			const error = new Error("Releaser failed")
			const failingReleaser = vi.fn().mockRejectedValue(error)

			helper.addAsync("failing-tag", failingReleaser)

			try {
				await helper.release()
				expect.fail("Expected ReleaseHelperError to be thrown")
			} catch (thrownError) {
				expect(thrownError).toBeInstanceOf(ReleaseHelperError)
				const releaseError = thrownError as InstanceType<
					typeof ReleaseHelperError
				>
				expect(releaseError.message).toBe(
					"1 releaser(s) failed; See error data for more details; Setting 1st error as cause",
				)
				expect(releaseError.data).toEqual([error])
				expect(releaseError.cause).toBe(error)
			}
		})

		test("should throw ReleaseHelperError with correct message for multiple failures", async () => {
			const helper = new ReleaseHelper()
			const error1 = new Error("First failure")
			const error2 = new Error("Second failure")
			const failingReleaser1 = vi.fn().mockRejectedValue(error1)
			const failingReleaser2 = vi.fn().mockRejectedValue(error2)

			helper.addAsync("failing-tag-1", failingReleaser1)
			helper.addAsync("failing-tag-2", failingReleaser2)

			try {
				await helper.release()
				expect.fail("Expected ReleaseHelperError to be thrown")
			} catch (thrownError) {
				expect(thrownError).toBeInstanceOf(ReleaseHelperError)
				const releaseError = thrownError as InstanceType<
					typeof ReleaseHelperError
				>
				expect(releaseError.message).toBe(
					"2 releaser(s) failed; See error data for more details; Setting 1st error as cause",
				)
				expect(releaseError.data).toEqual([error2, error1]) // LIFO order
				expect(releaseError.cause).toBe(error2) // First error encountered (due to LIFO)
			}
		})

		test("should execute all releasers even when some fail", async () => {
			const helper = new ReleaseHelper()
			const successReleaser = vi.fn().mockResolvedValue(undefined)
			const failingReleaser = vi
				.fn()
				.mockRejectedValue(new Error("Failed"))

			helper.addAsync("success-tag", successReleaser)
			helper.addAsync("failing-tag", failingReleaser)

			await expect(helper.release()).rejects.toThrow(ReleaseHelperError)

			expect(successReleaser).toHaveBeenCalledOnce()
			expect(failingReleaser).toHaveBeenCalledOnce()
		})

		test("should handle sync releaser failures", async () => {
			const helper = new ReleaseHelper()
			const error = new Error("Sync releaser failed")
			const failingSyncReleaser = vi.fn().mockImplementation(() => {
				throw error
			})

			helper.addSync("failing-sync-tag", failingSyncReleaser)

			try {
				await helper.release()
				expect.fail("Expected ReleaseHelperError to be thrown")
			} catch (thrownError) {
				expect(thrownError).toBeInstanceOf(ReleaseHelperError)
				const releaseError = thrownError as InstanceType<
					typeof ReleaseHelperError
				>
				expect(releaseError.data).toEqual([error])
				expect(releaseError.cause).toBe(error)
			}
		})
	})

	describe("releaseNoThrow", () => {
		test("should return empty array when no releasers are present", async () => {
			const helper = new ReleaseHelper()

			const errors = await helper.releaseNoThrow()

			expect(errors).toEqual([])
		})

		test("should return empty array when all releasers succeed", async () => {
			const helper = new ReleaseHelper()
			const mockReleaser1 = vi.fn().mockResolvedValue(undefined)
			const mockReleaser2 = vi.fn().mockResolvedValue(undefined)

			helper.addAsync("tag-1", mockReleaser1)
			helper.addAsync("tag-2", mockReleaser2)

			const errors = await helper.releaseNoThrow()

			expect(errors).toEqual([])
			expect(mockReleaser1).toHaveBeenCalledOnce()
			expect(mockReleaser2).toHaveBeenCalledOnce()
		})

		test("should return array of errors when releasers fail", async () => {
			const helper = new ReleaseHelper()
			const error1 = new Error("First error")
			const error2 = new Error("Second error")
			const failingReleaser1 = vi.fn().mockRejectedValue(error1)
			const failingReleaser2 = vi.fn().mockRejectedValue(error2)

			helper.addAsync("tag-1", failingReleaser1)
			helper.addAsync("tag-2", failingReleaser2)

			const errors = await helper.releaseNoThrow()

			expect(errors).toEqual([error2, error1]) // LIFO order
		})

		test("should continue execution after errors and return all errors", async () => {
			const helper = new ReleaseHelper()
			const successReleaser = vi.fn().mockResolvedValue(undefined)
			const error = new Error("Failed")
			const failingReleaser = vi.fn().mockRejectedValue(error)

			helper.addAsync("success-tag", successReleaser)
			helper.addAsync("failing-tag", failingReleaser)

			const errors = await helper.releaseNoThrow()

			expect(errors).toEqual([error])
			expect(successReleaser).toHaveBeenCalledOnce()
			expect(failingReleaser).toHaveBeenCalledOnce()
		})

		test("should clear the stack after releaseNoThrow", async () => {
			const helper = new ReleaseHelper()
			const mockReleaser = vi.fn().mockResolvedValue(undefined)

			helper.addAsync("test-tag", mockReleaser)
			await helper.releaseNoThrow()

			// Second call should not execute the releaser again
			mockReleaser.mockClear()
			const errors = await helper.releaseNoThrow()

			expect(errors).toEqual([])
			expect(mockReleaser).not.toHaveBeenCalled()
		})

		test("should handle sync releaser errors", async () => {
			const helper = new ReleaseHelper()
			const error = new Error("Sync error")
			const failingSyncReleaser = vi.fn().mockImplementation(() => {
				throw error
			})

			helper.addSync("failing-sync-tag", failingSyncReleaser)

			const errors = await helper.releaseNoThrow()

			expect(errors).toEqual([error])
		})
	})

	describe("edge cases", () => {
		test("should handle empty releasers gracefully", async () => {
			const helper = new ReleaseHelper()

			await expect(helper.release()).resolves.toBeUndefined()
			await expect(helper.releaseNoThrow()).resolves.toEqual([])
		})

		test("should handle releasers that return undefined", async () => {
			const helper = new ReleaseHelper()
			const releaser = vi.fn().mockResolvedValue(undefined)

			helper.addAsync("test-tag", releaser)

			await expect(helper.release()).resolves.toBeUndefined()
			expect(releaser).toHaveBeenCalledOnce()
		})

		test("should handle releasers that return non-promise values when using addSync", async () => {
			const helper = new ReleaseHelper()
			const releaser = vi.fn().mockReturnValue("some value")

			helper.addSync("test-tag", releaser)

			await expect(helper.release()).resolves.toBeUndefined()
			expect(releaser).toHaveBeenCalledOnce()
		})

		test("should handle null and undefined errors", async () => {
			const helper = new ReleaseHelper()
			const nullErrorReleaser = vi.fn().mockRejectedValue(null)
			const undefinedErrorReleaser = vi.fn().mockRejectedValue(undefined)

			helper.addAsync("null-error", nullErrorReleaser)
			helper.addAsync("undefined-error", undefinedErrorReleaser)

			const errors = await helper.releaseNoThrow()

			expect(errors).toEqual([undefined, null]) // LIFO order
		})

		test("should handle very large number of releasers", async () => {
			const helper = new ReleaseHelper()
			const releaserCount = 1000
			const releasers: Array<ReturnType<typeof vi.fn>> = []

			for (let i = 0; i < releaserCount; i++) {
				const releaser = vi.fn().mockResolvedValue(undefined)
				releasers.push(releaser)
				helper.addAsync(`tag-${i}`, releaser)
			}

			await helper.release()

			for (const releaser of releasers) {
				expect(releaser).toHaveBeenCalledOnce()
			}
		})
	})

	describe("concurrent usage", () => {
		test("should handle multiple concurrent release calls", async () => {
			const helper = new ReleaseHelper()
			const mockReleaser = vi.fn().mockResolvedValue(undefined)

			helper.addAsync("test-tag", mockReleaser)

			// Start multiple releases concurrently
			const releasePromises = [
				helper.release(),
				helper.release(),
				helper.release(),
			]

			await Promise.all(releasePromises)

			// Each concurrent release call will execute the releaser since the stack is cleared synchronously
			// but the execution happens asynchronously, so all three calls see the releaser in the stack
			expect(mockReleaser).toHaveBeenCalledTimes(3)
		})

		test("should handle concurrent releaseNoThrow calls", async () => {
			const helper = new ReleaseHelper()
			const mockReleaser = vi.fn().mockResolvedValue(undefined)

			helper.addAsync("test-tag", mockReleaser)

			// Start multiple releaseNoThrow calls concurrently
			const releasePromises = [
				helper.releaseNoThrow(),
				helper.releaseNoThrow(),
				helper.releaseNoThrow(),
			]

			const results = await Promise.all(releasePromises)

			// Each concurrent call will execute the releaser since the stack is cleared synchronously
			// but the execution happens asynchronously
			expect(mockReleaser).toHaveBeenCalledTimes(3)

			// All results should be empty since no errors occurred
			for (const result of results) {
				expect(result).toEqual([])
			}
		})
	})
})
