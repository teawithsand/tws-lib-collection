import { afterEach, describe, expect, test, vi } from "vitest"
import { generateUuid } from "./uuid"

// Regular expression for UUID v4 format
const uuidRegex =
	/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

describe("generateUuid", () => {
	const originalGlobalCrypto = globalThis.crypto
	const originalMathRandom = Math.random

	afterEach(() => {
		// Restore all mocks and stubs
		vi.restoreAllMocks()
		vi.unstubAllGlobals()
	})

	test("should use crypto.randomUUID when available", () => {
		const mockRandomUUID = vi
			.fn()
			.mockReturnValue("mocked-uuid-via-randomUUID")
		vi.stubGlobal("crypto", {
			...originalGlobalCrypto, // Preserve other crypto properties if any
			randomUUID: mockRandomUUID,
			// Ensure getRandomValues is also present if it was on original, to make the test specific to randomUUID presence
			getRandomValues: originalGlobalCrypto?.getRandomValues,
		})

		const uuid = generateUuid()
		expect(mockRandomUUID).toHaveBeenCalledTimes(1)
		expect(uuid).toBe("mocked-uuid-via-randomUUID")
	})

	test("should use crypto.getRandomValues when crypto.randomUUID is not available", () => {
		const mockGetRandomValues = vi.fn((buffer: Uint8Array) => {
			// Fill buffer with some deterministic values for testing
			for (let i = 0; i < buffer.length; i++) {
				buffer[i] = (i * 17) % 256
			}
			return buffer
		})

		vi.stubGlobal("crypto", {
			// Deliberately omit randomUUID or set to undefined
			// randomUUID: undefined,
			getRandomValues: mockGetRandomValues,
		})

		const uuid = generateUuid()
		expect(mockGetRandomValues).toHaveBeenCalledTimes(1)
		const calledBuffer = mockGetRandomValues.mock.calls[0][0]
		expect(calledBuffer).toBeInstanceOf(Uint8Array)
		expect((calledBuffer as Uint8Array).length).toBe(16)
		expect(uuid).toMatch(uuidRegex)
		// Check version (4)
		expect(uuid[14]).toBe("4")
		// Check variant (8, 9, A, or B)
		expect(["8", "9", "a", "b"]).toContain(uuid[19]?.toLowerCase())
	})

	test("should use Math.random when crypto object itself is not available", () => {
		vi.stubGlobal("crypto", undefined) // Simulate crypto not being defined

		const mathRandomSpy = vi.spyOn(Math, "random").mockReturnValue(0.5)

		const uuid = generateUuid()
		expect(mathRandomSpy).toHaveBeenCalled()
		expect(uuid).toMatch(uuidRegex)
		expect(uuid[14]).toBe("4") // Version 4
		// For Math.random() = 0.5, r = (0.5 * 16) | 0 = 8.
		// For 'y', v = (r & 0x3) | 0x8 = (8 & 0x3) | 0x8 = (0) | 0x8 = 8.
		// So, the character should be '8'.
		expect(uuid[19]).toBe("8")
	})

	test("should use Math.random when crypto methods are not available", () => {
		vi.stubGlobal("crypto", {
			// Crypto object exists but without randomUUID and getRandomValues
			randomUUID: undefined,
			getRandomValues: undefined,
		})

		const mathRandomSpy = vi.spyOn(Math, "random").mockReturnValue(0.75)

		const uuid = generateUuid()
		expect(mathRandomSpy).toHaveBeenCalled()
		expect(uuid).toMatch(uuidRegex)
		expect(uuid[14]).toBe("4") // Version 4
		// For Math.random() = 0.75, r = (0.75 * 16) | 0 = 12 (0xc).
		// For 'y', v = (r & 0x3) | 0x8 = (12 & 0x3) | 0x8 = (0) | 0x8 = 8.
		// So, the character should be '8'.
		expect(uuid[19]).toBe("8")
	})

	test("should return a string of length 36", () => {
		// This test will run with the actual environment's crypto or Math.random fallback
		const uuid = generateUuid()
		expect(typeof uuid).toBe("string")
		expect(uuid.length).toBe(36)
	})

	test("should return a unique UUID on subsequent calls", () => {
		// This test relies on the underlying mechanisms (crypto or Math.random)
		// to produce different UUIDs. For Math.random, it's probabilistic.
		const uuid1 = generateUuid()
		const uuid2 = generateUuid()
		expect(uuid1).not.toBe(uuid2)
		expect(uuid1).toMatch(uuidRegex)
		expect(uuid2).toMatch(uuidRegex)
	})
})
