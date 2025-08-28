import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { MluiBreakpoint } from "./types"
import { useBreakpoint } from "./useBreakpoint"

// Mock window.innerWidth
Object.defineProperty(window, "innerWidth", {
	writable: true,
	configurable: true,
	value: 1024,
})

// Helper function to trigger resize event
const triggerResize = (width: number) => {
	act(() => {
		Object.defineProperty(window, "innerWidth", { value: width })
		window.dispatchEvent(new Event("resize"))
	})
}

describe("useBreakpoint", () => {
	beforeEach(() => {
		// Reset to default width
		Object.defineProperty(window, "innerWidth", { value: 1024 })
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	test("returns correct current breakpoint and helpers for MD", () => {
		Object.defineProperty(window, "innerWidth", { value: 800 })

		const { result } = renderHook(() => useBreakpoint())

		expect(result.current.current).toBe(MluiBreakpoint.MD)
		expect(result.current.is(MluiBreakpoint.MD)).toBe(true)
		expect(result.current.is(MluiBreakpoint.LG)).toBe(false)
	})

	test("isAtLeast works correctly", () => {
		// Set to LG breakpoint
		Object.defineProperty(window, "innerWidth", { value: 1000 })

		const { result } = renderHook(() => useBreakpoint())

		expect(result.current.isAtLeast(MluiBreakpoint.XS)).toBe(true)
		expect(result.current.isAtLeast(MluiBreakpoint.SM)).toBe(true)
		expect(result.current.isAtLeast(MluiBreakpoint.MD)).toBe(true)
		expect(result.current.isAtLeast(MluiBreakpoint.LG)).toBe(true)
		expect(result.current.isAtLeast(MluiBreakpoint.XL)).toBe(false)
	})

	test("isAtMost works correctly", () => {
		// Set to SM breakpoint
		Object.defineProperty(window, "innerWidth", { value: 600 })

		const { result } = renderHook(() => useBreakpoint())

		expect(result.current.isAtMost(MluiBreakpoint.XS)).toBe(false)
		expect(result.current.isAtMost(MluiBreakpoint.SM)).toBe(true)
		expect(result.current.isAtMost(MluiBreakpoint.MD)).toBe(true)
		expect(result.current.isAtMost(MluiBreakpoint.LG)).toBe(true)
		expect(result.current.isAtMost(MluiBreakpoint.XL)).toBe(true)
	})

	test("isBetween works correctly", () => {
		// Set to MD breakpoint
		Object.defineProperty(window, "innerWidth", { value: 800 })

		const { result } = renderHook(() => useBreakpoint())

		expect(
			result.current.isBetween(MluiBreakpoint.XS, MluiBreakpoint.LG),
		).toBe(true)
		expect(
			result.current.isBetween(MluiBreakpoint.SM, MluiBreakpoint.LG),
		).toBe(true)
		expect(
			result.current.isBetween(MluiBreakpoint.MD, MluiBreakpoint.MD),
		).toBe(true)
		expect(
			result.current.isBetween(MluiBreakpoint.LG, MluiBreakpoint.XL),
		).toBe(false)
		expect(
			result.current.isBetween(MluiBreakpoint.XS, MluiBreakpoint.SM),
		).toBe(false)
	})

	test("all helpers work correctly for XS breakpoint", () => {
		// Set to XS breakpoint
		Object.defineProperty(window, "innerWidth", { value: 400 })

		const { result } = renderHook(() => useBreakpoint())

		expect(result.current.current).toBe(MluiBreakpoint.XS)
		expect(result.current.is(MluiBreakpoint.XS)).toBe(true)
		expect(result.current.isAtLeast(MluiBreakpoint.XS)).toBe(true)
		expect(result.current.isAtLeast(MluiBreakpoint.SM)).toBe(false)
		expect(result.current.isAtMost(MluiBreakpoint.XS)).toBe(true)
		expect(result.current.isAtMost(MluiBreakpoint.SM)).toBe(true)
		expect(
			result.current.isBetween(MluiBreakpoint.XS, MluiBreakpoint.MD),
		).toBe(true)
	})

	test("all helpers work correctly for XL breakpoint", () => {
		// Set to XL breakpoint
		Object.defineProperty(window, "innerWidth", { value: 1400 })

		const { result } = renderHook(() => useBreakpoint())

		expect(result.current.current).toBe(MluiBreakpoint.XL)
		expect(result.current.is(MluiBreakpoint.XL)).toBe(true)
		expect(result.current.isAtLeast(MluiBreakpoint.LG)).toBe(true)
		expect(result.current.isAtLeast(MluiBreakpoint.XL)).toBe(true)
		expect(result.current.isAtMost(MluiBreakpoint.XL)).toBe(true)
		expect(result.current.isAtMost(MluiBreakpoint.LG)).toBe(false)
		expect(
			result.current.isBetween(MluiBreakpoint.LG, MluiBreakpoint.XL),
		).toBe(true)
	})

	test("updates correctly when window resizes", () => {
		Object.defineProperty(window, "innerWidth", { value: 400 })

		const { result } = renderHook(() => useBreakpoint())

		// Start with XS
		expect(result.current.current).toBe(MluiBreakpoint.XS)
		expect(result.current.is(MluiBreakpoint.XS)).toBe(true)

		// Resize to LG
		triggerResize(1000)
		expect(result.current.current).toBe(MluiBreakpoint.LG)
		expect(result.current.is(MluiBreakpoint.LG)).toBe(true)
		expect(result.current.isAtLeast(MluiBreakpoint.MD)).toBe(true)

		// Resize to SM
		triggerResize(600)
		expect(result.current.current).toBe(MluiBreakpoint.SM)
		expect(result.current.is(MluiBreakpoint.SM)).toBe(true)
		expect(result.current.isAtMost(MluiBreakpoint.MD)).toBe(true)
	})
})
