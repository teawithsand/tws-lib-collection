/**
 * Options for deepCopy function
 */
export type DeepCopyOptions = {
	/**
	 * When true, throws an error if a circular reference is detected
	 * @default false
	 */
	disallowCircularReferences?: boolean
}

/**
 * Utility for deep copying JavaScript objects, arrays and primitive values.
 *
 * This function creates a deep clone of the provided value, ensuring that
 * all nested objects and arrays are also copied rather than referenced.
 * Handles circular references by keeping track of already copied objects.
 *
 * @example
 * ```typescript
 * const original = { a: 1, b: { c: 3 }, d: [1, 2, 3] };
 * const copy = deepCopy(original);
 *
 * // Modifying the copy doesn't affect the original
 * copy.b.c = 4;
 * copy.d.push(4);
 *
 * console.log(original.b.c); // 3
 * console.log(original.d.length); // 3
 * ```
 *
 * @param value - The value to deep copy
 * @param options - Optional configuration options
 * @returns A deep copy of the input value
 * @throws Error if circular reference is detected and disallowCircularReferences is true
 */
export const deepCopy = <T>(value: T, options: DeepCopyOptions = {}): T => {
	// Create a WeakMap to store references to already copied objects to handle circular references
	const refMap = new WeakMap<object, unknown>()

	// Internal recursive function that handles the actual copying
	const innerCopy = <U>(val: U): U => {
		// Handle null or undefined
		if (val === null || val === undefined) {
			return val
		}

		// Handle primitive types (string, number, boolean)
		if (typeof val !== "object") {
			return val
		}

		// We need to cast val to 'object' to use it with WeakMap
		const valAsObj = val as object

		// Check if we've already copied this object (circular reference)
		if (refMap.has(valAsObj)) {
			if (options.disallowCircularReferences) {
				throw new Error(
					"Circular reference detected in object structure",
				)
			}
			return refMap.get(valAsObj) as U
		}

		// Handle Date objects
		if (val instanceof Date) {
			return new Date(val.getTime()) as unknown as U
		}

		// Handle RegExp objects
		if (val instanceof RegExp) {
			return new RegExp(val.source, val.flags) as unknown as U
		}

		// Handle Map objects
		if (val instanceof Map) {
			const copyMap = new Map()
			// Store reference before recursive copying to handle circular references
			refMap.set(valAsObj, copyMap)

			val.forEach((mapVal, key) => {
				copyMap.set(innerCopy(key), innerCopy(mapVal))
			})
			return copyMap as unknown as U
		}

		// Handle Set objects
		if (val instanceof Set) {
			const copySet = new Set()
			// Store reference before recursive copying to handle circular references
			refMap.set(valAsObj, copySet)

			val.forEach((setVal) => {
				copySet.add(innerCopy(setVal))
			})
			return copySet as unknown as U
		}

		// Handle Arrays
		if (Array.isArray(val)) {
			const copyArray: unknown[] = []
			// Store reference before recursive copying to handle circular references
			refMap.set(valAsObj, copyArray)

			val.forEach((item, index) => {
				copyArray[index] = innerCopy(item)
			})
			return copyArray as unknown as U
		}

		// Handle plain objects
		if (Object.prototype.toString.call(val) === "[object Object]") {
			const copyObj: Record<string, unknown> = {}
			// Store reference before recursive copying to handle circular references
			refMap.set(valAsObj, copyObj)

			Object.entries(val as Record<string, unknown>).forEach(
				([key, objVal]) => {
					copyObj[key] = innerCopy(objVal)
				},
			)

			return copyObj as U
		}

		// For any other types, simply return as is (e.g., functions)
		return val
	}

	return innerCopy(value)
}
