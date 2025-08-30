import { describe, expect, test } from "vitest"
import { WebApiUnsupportedError } from ".."
import { WebLockAdapter } from "./webLockAdapter"
import { WebRwLockAdapter } from "./webRwLockAdapter"

describe("WebLockAdapter", () => {
	test("should throw error when Web Locks API is not supported", () => {
		const originalNavigator = globalThis.navigator

		try {
			Object.defineProperty(globalThis, "navigator", {
				value: {},
				writable: true,
				configurable: true,
			})

			expect(() => new WebLockAdapter("test-lock")).toThrow(
				WebApiUnsupportedError,
			)
		} finally {
			Object.defineProperty(globalThis, "navigator", {
				value: originalNavigator,
				writable: true,
				configurable: true,
			})
		}
	})
})

describe("WebRwLockAdapter", () => {
	test("should throw error when Web Locks API is not supported", () => {
		const originalNavigator = globalThis.navigator

		try {
			Object.defineProperty(globalThis, "navigator", {
				value: {},
				writable: true,
				configurable: true,
			})

			expect(() => new WebRwLockAdapter("test-rw-lock")).toThrow(
				WebApiUnsupportedError,
			)
		} finally {
			Object.defineProperty(globalThis, "navigator", {
				value: originalNavigator,
				writable: true,
				configurable: true,
			})
		}
	})
})
