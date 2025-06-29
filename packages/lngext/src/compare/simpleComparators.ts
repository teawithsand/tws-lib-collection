import { Comparator, ComparatorResult } from "./comparator"

/**
 * Comparator for numbers (ascending order).
 */
export const numberComparator: Comparator<number> = {
	/**
	 * Compares two numbers in ascending order.
	 * @param a First number
	 * @param b Second number
	 * @returns ComparatorResult
	 */
	compare: (a: number, b: number): ComparatorResult => {
		if (a < b) return ComparatorResult.SMALLER
		if (a > b) return ComparatorResult.GREATER
		return ComparatorResult.EQUAL
	},
}

/**
 * Comparator for strings (lexicographical, ascending).
 */
export const stringComparator: Comparator<string> = {
	/**
	 * Compares two strings lexicographically in ascending order.
	 * @param a First string
	 * @param b Second string
	 * @returns ComparatorResult
	 */
	compare: (a: string, b: string): ComparatorResult => {
		if (a < b) return ComparatorResult.SMALLER
		if (a > b) return ComparatorResult.GREATER
		return ComparatorResult.EQUAL
	},
}

/**
 * Comparator for strings using natural order (e.g., "file2" < "file10").
 * Uses localeCompare with numeric option for locale-aware, natural sorting.
 */
export const naturalStringComparator: Comparator<string> = {
	/**
	 * Compares two strings using natural order.
	 * @param a First string
	 * @param b Second string
	 * @returns ComparatorResult
	 */
	compare: (a: string, b: string): ComparatorResult => {
		let result: number
		if (typeof a.localeCompare === "function") {
			result = a.localeCompare(b, undefined, {
				numeric: true,
				sensitivity: "base",
			})
		} else {
			if (a < b) return ComparatorResult.SMALLER
			if (a > b) return ComparatorResult.GREATER
			return ComparatorResult.EQUAL
		}
		if (result < 0) return ComparatorResult.SMALLER
		if (result > 0) return ComparatorResult.GREATER
		return ComparatorResult.EQUAL
	},
}
