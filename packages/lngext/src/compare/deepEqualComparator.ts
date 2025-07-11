import { EqualComparator } from "./equalComparator"
import { EqualComparatorRegistry } from "./equalComparatorRegistry"

/**
 * Deep equality comparator that performs recursive deep comparison.
 * Handles primitives, objects, arrays, dates, regexes, NaN values etc.
 *
 * It also uses registry to compare custom class instances.
 */
export class DeepEqualComparator implements EqualComparator<any> {
	constructor(
		private readonly registry: EqualComparatorRegistry = EqualComparatorRegistry.getGlobal(),
	) {}

	/**
	 * Performs deep equality comparison between two values.
	 * @param a First value to compare
	 * @param b Second value to compare
	 * @returns true if values are deeply equal, false otherwise
	 */
	public readonly equals = (a: any, b: any): boolean => {
		return this.deepEquals(a, b, new WeakMap())
	}

	/**
	 * Internal recursive deep equality implementation with circular reference detection.
	 * @param a First value to compare
	 * @param b Second value to compare
	 * @param visited WeakMap to track visited objects for circular reference detection
	 * @returns true if values are deeply equal, false otherwise
	 */
	private readonly deepEquals = (
		a: any,
		b: any,
		visited: WeakMap<object, any>,
	): boolean => {
		// Same reference or strict equality (handles primitives, null, undefined)
		if (a === b) {
			return true
		}

		// Handle NaN case (NaN !== NaN but they should be considered equal)
		if (Number.isNaN(a) && Number.isNaN(b)) {
			return true
		}

		// Different types or one is null/undefined
		if (
			typeof a !== typeof b ||
			a === null ||
			b === null ||
			a === undefined ||
			b === undefined
		) {
			return false
		}

		// Handle Date objects
		if (a instanceof Date && b instanceof Date) {
			return a.getTime() === b.getTime()
		}

		// Only one is Date
		if (a instanceof Date || b instanceof Date) {
			return false
		}

		// Handle RegExp objects
		if (a instanceof RegExp && b instanceof RegExp) {
			return a.toString() === b.toString()
		}

		// Only one is RegExp
		if (a instanceof RegExp || b instanceof RegExp) {
			return false
		}

		// Handle primitives that didn't pass strict equality
		if (typeof a !== "object") {
			return false
		}

		// Check for custom class instances using registry
		if (
			a.constructor &&
			a.constructor !== Object &&
			b.constructor &&
			b.constructor !== Object
		) {
			// Both objects have the same constructor
			if (a.constructor === b.constructor) {
				const comparator = this.registry.get(a.constructor)
				if (comparator) {
					return comparator.equals(a, b)
				}
			} else {
				// Different constructors
				return false
			}
		}

		// Check for circular references
		if (visited.has(a)) {
			return visited.get(a) === b
		}
		visited.set(a, b)

		// Handle arrays
		if (Array.isArray(a) && Array.isArray(b)) {
			if (a.length !== b.length) {
				return false
			}
			for (let i = 0; i < a.length; i++) {
				if (!this.deepEquals(a[i], b[i], visited)) {
					return false
				}
			}
			return true
		}

		// Only one is array
		if (Array.isArray(a) || Array.isArray(b)) {
			return false
		}

		// Handle objects
		const keysA = Object.keys(a)
		const keysB = Object.keys(b)

		if (keysA.length !== keysB.length) {
			return false
		}

		for (const key of keysA) {
			if (!keysB.includes(key)) {
				return false
			}
			if (!this.deepEquals(a[key], b[key], visited)) {
				return false
			}
		}

		return true
	}
}
