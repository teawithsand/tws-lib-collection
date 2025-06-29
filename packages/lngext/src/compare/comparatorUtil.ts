import { Comparator, ComparatorResult } from "./comparator"

/**
 * Utility class for working with comparators.
 */
export class ComparatorUtil {
	/**
	 * Private constructor to prevent instantiation.
	 */
	private constructor() {}

	/**
	 * Returns a comparator that reverses the result of the given comparator.
	 * @param comparator The comparator to reverse
	 */
	public static readonly reverse = <T>(
		comparator: Comparator<T>,
	): Comparator<T> => ({
		compare: (a: T, b: T): ComparatorResult => {
			const result = comparator.compare(a, b)
			if (result === ComparatorResult.SMALLER)
				return ComparatorResult.GREATER
			if (result === ComparatorResult.GREATER)
				return ComparatorResult.SMALLER
			return ComparatorResult.EQUAL
		},
	})

	/**
	 * Chains multiple comparators: returns the first non-EQUAL result, or EQUAL if all comparators return EQUAL.
	 * @param comparators List of comparators to chain
	 */
	public static readonly chain = <T>(
		...comparators: Comparator<T>[]
	): Comparator<T> => ({
		compare: (a: T, b: T): ComparatorResult => {
			for (const comparator of comparators) {
				const result = comparator.compare(a, b)
				if (result !== ComparatorResult.EQUAL) return result
			}
			return ComparatorResult.EQUAL
		},
	})

	/**
	 * Creates a comparator from a function returning a number (like sort callbacks).
	 * @param fn Function returning a number
	 */
	public static readonly fromFn = <T>(
		fn: (a: T, b: T) => number | ComparatorResult,
	): Comparator<T> => ({
		compare: (a: T, b: T): ComparatorResult => {
			const n = fn(a, b)
			if (n < 0) return ComparatorResult.SMALLER
			if (n > 0) return ComparatorResult.GREATER
			return ComparatorResult.EQUAL
		},
	})
}
