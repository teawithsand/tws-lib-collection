import { useRef } from "react"

/**
 * A hook that works like useMemo but guarantees recomputation if and only if arguments change.
 * Uses Object.is comparison for each dependency to ensure reliable dependency tracking.
 *
 * @param factory - Function that computes the memoized value
 * @param deps - Array of dependencies to watch for changes
 * @returns The memoized value
 */
export const useStableMemo = <T>(
	factory: () => T,
	deps: readonly unknown[],
): T => {
	const memoRef = useRef<{
		deps: readonly unknown[]
		value: T
		hasValue: boolean
	}>({
		deps: [],
		value: undefined as T, // Safe cast since hasValue tracks initialization
		hasValue: false,
	})

	const depsChanged =
		!memoRef.current.hasValue || !areInputsEqual(memoRef.current.deps, deps)

	if (depsChanged) {
		memoRef.current.value = factory()
		memoRef.current.deps = deps
		memoRef.current.hasValue = true
	}

	return memoRef.current.value
}

/**
 * Compares two dependency arrays using Object.is for each element.
 * This is the same comparison logic used by React's built-in hooks.
 *
 * @param prevDeps - Previous dependency array
 * @param nextDeps - Current dependency array
 * @returns True if arrays are equal, false otherwise
 */
const areInputsEqual = (
	prevDeps: readonly unknown[],
	nextDeps: readonly unknown[],
): boolean => {
	if (prevDeps.length !== nextDeps.length) {
		return false
	}

	for (let i = 0; i < prevDeps.length; i++) {
		if (!Object.is(prevDeps[i], nextDeps[i])) {
			return false
		}
	}

	return true
}
