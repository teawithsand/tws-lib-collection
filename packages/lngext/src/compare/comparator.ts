export interface Comparator<T> {
	compare: (a: T, b: T) => ComparatorResult
}

export enum ComparatorResult {
	SMALLER = -1,
	EQUAL = 0,
	GREATER = 1,
}

/**
 * Utility class for ComparatorResult conversions.
 */
export class ComparatorResultUtil {
	/**
	 * Private constructor to prevent instantiation.
	 */
	private constructor() {}

	/**
	 * Converts a number to a ComparatorResult.
	 * Throws an error if the input is NaN.
	 * @param value The number to convert.
	 * @returns ComparatorResult corresponding to the sign of the number.
	 * @throws {Error} If value is NaN or Infinity or -Infinity.
	 */
	public static readonly fromNumber = (value: number): ComparatorResult => {
		if (Number.isNaN(value)) {
			throw new Error("Cannot convert NaN to ComparatorResult")
		}
		if (!Number.isFinite(value)) {
			throw new Error("Cannot convert Infinity to ComparatorResult")
		}
		if (value < 0) {
			return ComparatorResult.SMALLER
		}
		if (value > 0) {
			return ComparatorResult.GREATER
		}
		return ComparatorResult.EQUAL
	}

	/**
	 * Converts a ComparatorResult to its numeric value.
	 * @param result The ComparatorResult to convert.
	 * @returns The numeric value corresponding to the ComparatorResult.
	 */
	public static readonly toNumber = (result: ComparatorResult): number => {
		return result as number
	}

	/**
	 * Reverses a comparator result given as a number or ComparatorResult.
	 * @param value The number or ComparatorResult to reverse.
	 * @returns The reversed ComparatorResult.
	 */
	public static readonly reverse = (
		value: number | ComparatorResult,
	): ComparatorResult => {
		if (Number.isNaN(value)) {
			throw new Error("Cannot reverse NaN comparator result")
		}
		if (!Number.isFinite(value)) {
			throw new Error("Cannot reverse Infinity comparator result")
		}
		if (value < 0) return ComparatorResult.GREATER
		if (value > 0) return ComparatorResult.SMALLER
		return ComparatorResult.EQUAL
	}
}
