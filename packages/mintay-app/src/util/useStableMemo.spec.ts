import { renderHook } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"
import { useStableMemo } from "./useStableMemo"

describe("useStableMemo", () => {
	test("should compute value on first render", () => {
		const factory = vi.fn(() => "computed")
		const deps = [1, 2, 3]

		const { result } = renderHook(() => useStableMemo(factory, deps))

		expect(result.current).toBe("computed")
		expect(factory).toHaveBeenCalledTimes(1)
	})

	test("should reuse cached value when dependencies are unchanged", () => {
		const factory = vi.fn(() => "computed")
		const deps = [1, 2, 3]

		const { result, rerender } = renderHook(() =>
			useStableMemo(factory, deps),
		)

		expect(result.current).toBe("computed")
		expect(factory).toHaveBeenCalledTimes(1)

		rerender()

		expect(result.current).toBe("computed")
		expect(factory).toHaveBeenCalledTimes(1)
	})

	test("should recompute when primitive dependencies change", () => {
		const factory = vi.fn((value: number) => `computed-${value}`)
		let counter = 1

		const { result, rerender } = renderHook(() =>
			useStableMemo(() => factory(counter), [counter]),
		)

		expect(result.current).toBe("computed-1")
		expect(factory).toHaveBeenCalledTimes(1)

		counter = 2
		rerender()

		expect(result.current).toBe("computed-2")
		expect(factory).toHaveBeenCalledTimes(2)
	})

	test("should recompute when object reference changes", () => {
		const factory = vi.fn(() => "computed")
		const obj1 = { a: 1 }
		const obj2 = { a: 1 }

		const { result, rerender } = renderHook(
			({ deps }) => useStableMemo(factory, deps),
			{ initialProps: { deps: [obj1] } },
		)

		expect(result.current).toBe("computed")
		expect(factory).toHaveBeenCalledTimes(1)

		rerender({ deps: [obj2] })

		expect(result.current).toBe("computed")
		expect(factory).toHaveBeenCalledTimes(2)
	})

	test("should not recompute when same object reference is used", () => {
		const factory = vi.fn(() => "computed")
		const obj = { a: 1 }

		const { result, rerender } = renderHook(
			({ deps }) => useStableMemo(factory, deps),
			{ initialProps: { deps: [obj] } },
		)

		expect(result.current).toBe("computed")
		expect(factory).toHaveBeenCalledTimes(1)

		rerender({ deps: [obj] })

		expect(result.current).toBe("computed")
		expect(factory).toHaveBeenCalledTimes(1)
	})

	test("should handle empty dependency arrays", () => {
		const factory = vi.fn(() => "computed")

		const { result, rerender } = renderHook(() =>
			useStableMemo(factory, []),
		)

		expect(result.current).toBe("computed")
		expect(factory).toHaveBeenCalledTimes(1)

		rerender()

		expect(result.current).toBe("computed")
		expect(factory).toHaveBeenCalledTimes(1)
	})

	test("should recompute when dependency array length changes", () => {
		const factory = vi.fn(() => "computed")

		const { result, rerender } = renderHook(
			({ deps }) => useStableMemo(factory, deps),
			{ initialProps: { deps: [1, 2] } },
		)

		expect(result.current).toBe("computed")
		expect(factory).toHaveBeenCalledTimes(1)

		rerender({ deps: [1, 2, 3] })

		expect(result.current).toBe("computed")
		expect(factory).toHaveBeenCalledTimes(2)
	})

	test("should handle null and undefined values correctly", () => {
		const factory = vi.fn(() => "computed")

		const { result, rerender } = renderHook(
			({ deps }) => useStableMemo(factory, deps),
			{ initialProps: { deps: [null, undefined] } },
		)

		expect(result.current).toBe("computed")
		expect(factory).toHaveBeenCalledTimes(1)

		rerender({ deps: [null, undefined] })

		expect(result.current).toBe("computed")
		expect(factory).toHaveBeenCalledTimes(1)

		rerender({ deps: [undefined, null] })

		expect(result.current).toBe("computed")
		expect(factory).toHaveBeenCalledTimes(2)
	})

	test("should handle NaN values correctly using Object.is semantics", () => {
		const factory = vi.fn(() => "computed")

		const { result, rerender } = renderHook(
			({ deps }) => useStableMemo(factory, deps),
			{ initialProps: { deps: [NaN] } },
		)

		expect(result.current).toBe("computed")
		expect(factory).toHaveBeenCalledTimes(1)

		rerender({ deps: [NaN] })

		expect(result.current).toBe("computed")
		expect(factory).toHaveBeenCalledTimes(1)
	})

	test("should handle -0 and +0 correctly using Object.is semantics", () => {
		const factory = vi.fn(() => "computed")

		const { result, rerender } = renderHook(
			({ deps }) => useStableMemo(factory, deps),
			{ initialProps: { deps: [-0] } },
		)

		expect(result.current).toBe("computed")
		expect(factory).toHaveBeenCalledTimes(1)

		rerender({ deps: [+0] })

		expect(result.current).toBe("computed")
		expect(factory).toHaveBeenCalledTimes(2)
	})

	test("should handle boolean values correctly", () => {
		const factory = vi.fn(() => "computed")

		const { result, rerender } = renderHook(
			({ deps }) => useStableMemo(factory, deps),
			{ initialProps: { deps: [true, false] } },
		)

		expect(result.current).toBe("computed")
		expect(factory).toHaveBeenCalledTimes(1)

		rerender({ deps: [true, false] })

		expect(result.current).toBe("computed")
		expect(factory).toHaveBeenCalledTimes(1)

		rerender({ deps: [false, true] })

		expect(result.current).toBe("computed")
		expect(factory).toHaveBeenCalledTimes(2)
	})

	test("should handle string values correctly", () => {
		const factory = vi.fn(() => "computed")

		const { result, rerender } = renderHook(
			({ deps }) => useStableMemo(factory, deps),
			{ initialProps: { deps: ["hello", "world"] } },
		)

		expect(result.current).toBe("computed")
		expect(factory).toHaveBeenCalledTimes(1)

		rerender({ deps: ["hello", "world"] })

		expect(result.current).toBe("computed")
		expect(factory).toHaveBeenCalledTimes(1)

		rerender({ deps: ["hello", "universe"] })

		expect(result.current).toBe("computed")
		expect(factory).toHaveBeenCalledTimes(2)
	})

	test("should handle function references correctly", () => {
		const factory = vi.fn(() => "computed")
		const func1 = () => {}
		const func2 = () => {}

		const { result, rerender } = renderHook(
			({ deps }) => useStableMemo(factory, deps),
			{ initialProps: { deps: [func1] } },
		)

		expect(result.current).toBe("computed")
		expect(factory).toHaveBeenCalledTimes(1)

		rerender({ deps: [func1] })

		expect(result.current).toBe("computed")
		expect(factory).toHaveBeenCalledTimes(1)

		rerender({ deps: [func2] })

		expect(result.current).toBe("computed")
		expect(factory).toHaveBeenCalledTimes(2)
	})

	test("should handle complex mixed dependency types", () => {
		const factory = vi.fn(() => "computed")
		const obj = { a: 1 }
		const arr = [1, 2, 3]
		const func = () => {}

		const { result, rerender } = renderHook(
			({ deps }) => useStableMemo(factory, deps),
			{
				initialProps: {
					deps: [1, "hello", obj, arr, func, null, undefined, true],
				},
			},
		)

		expect(result.current).toBe("computed")
		expect(factory).toHaveBeenCalledTimes(1)

		rerender({ deps: [1, "hello", obj, arr, func, null, undefined, true] })

		expect(result.current).toBe("computed")
		expect(factory).toHaveBeenCalledTimes(1)

		rerender({ deps: [2, "hello", obj, arr, func, null, undefined, true] })

		expect(result.current).toBe("computed")
		expect(factory).toHaveBeenCalledTimes(2)
	})

	test("should maintain referential stability of returned value when not recomputing", () => {
		const obj = { value: "test" }
		const factory = vi.fn(() => obj)

		const { result, rerender } = renderHook(() =>
			useStableMemo(factory, [1]),
		)

		const firstResult = result.current
		expect(firstResult).toBe(obj)

		rerender()

		expect(result.current).toBe(firstResult)
		expect(result.current).toBe(obj)
	})

	test("should return new value reference when recomputing", () => {
		const factory = vi.fn((counter: number) => ({ value: counter }))
		let counter = 1

		const { result, rerender } = renderHook(() =>
			useStableMemo(() => factory(counter), [counter]),
		)

		const firstResult = result.current
		expect(firstResult.value).toBe(1)

		counter = 2
		rerender()

		const secondResult = result.current
		expect(secondResult.value).toBe(2)
		expect(secondResult).not.toBe(firstResult)
	})
})
