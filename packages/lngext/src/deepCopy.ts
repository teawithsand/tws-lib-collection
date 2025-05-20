/**
 * Symbol used to mark a class as deep-copyable
 */
export const deepCopyable = Symbol("deepCopyable")

/**
 * Options for deep copying
 */
export interface DeepCopyOptions {
	/**
	 * If true, will throw an error when a circular reference is detected
	 * Default: false (circular references are allowed)
	 */
	disallowCircularReferences?: boolean
}

/**
 * Creates a deep copy of the provided value
 * Handles primitive types, objects, arrays, Maps, Sets, Dates, RegExps, and class instances
 *
 * @param obj - The value to deep copy
 * @param options - Options for controlling the deep copy behavior
 * @returns A deep copy of the provided value
 */
export const deepCopy = <T>(obj: T, options: DeepCopyOptions = {}): T => {
	const visited = new WeakMap<object, object>()

	const copyInternal = <U>(value: U): U => {
		// Handle null and primitives
		if (value === null || typeof value !== "object") {
			return value
		}

		// Handle Date objects
		if (value instanceof Date) {
			return new Date(value.getTime()) as unknown as U
		}

		// Handle RegExp objects
		if (value instanceof RegExp) {
			return new RegExp(value.source, value.flags) as unknown as U
		}

		// Handle circular references
		if (visited.has(value as object)) {
			if (options.disallowCircularReferences) {
				throw new Error(
					"Circular reference detected in object structure",
				)
			}
			return visited.get(value as object) as U
		}

		// Handle Arrays
		if (Array.isArray(value)) {
			const copy: unknown[] = []
			visited.set(value, copy)
			for (let i = 0; i < value.length; i++) {
				copy[i] = copyInternal(value[i])
			}
			return copy as unknown as U
		}

		// Handle Maps
		if (value instanceof Map) {
			const copy = new Map()
			visited.set(value, copy)
			value.forEach((val, key) => {
				copy.set(copyInternal(key), copyInternal(val))
			})
			return copy as unknown as U
		}

		// Handle Sets
		if (value instanceof Set) {
			const copy = new Set()
			visited.set(value, copy)
			for (const item of value) {
				copy.add(copyInternal(item))
			}
			return copy as unknown as U
		}

		// Handle class instances only if they're marked as deep-copyable
		const constructor = (value as object).constructor

		// Check if this is a class instance (not a plain object or array) and if it's marked as deep-copyable
		if (
			constructor &&
			constructor !== Object &&
			constructor !== Array &&
			(value as Record<symbol, boolean>)[deepCopyable] === true
		) {
			let instance: object

			try {
				// Try to use the constructor directly
				instance = Reflect.construct(constructor, [])
			} catch {
				// Fallback to using Object.create with the prototype
				instance = Object.create(Object.getPrototypeOf(value))
			}

			visited.set(value as object, instance)

			// Copy all properties
			const allPropertyNames = Object.getOwnPropertyNames(value)
			for (const prop of allPropertyNames) {
				const descriptor = Object.getOwnPropertyDescriptor(value, prop)
				if (!descriptor) continue

				if (descriptor.value !== undefined) {
					if (typeof descriptor.value === "function") {
						// For methods (especially arrow functions), just copy the descriptor directly
						// This preserves the binding to the original object
						Object.defineProperty(instance, prop, descriptor)
					} else {
						// For regular properties, deep copy the value
						Object.defineProperty(instance, prop, {
							...descriptor,
							value: copyInternal(descriptor.value),
						})
					}
				} else {
					// For getters and setters, copy the descriptor directly
					Object.defineProperty(instance, prop, descriptor)
				}
			}

			return instance as unknown as U
		}

		// For normal class instances (not marked as deep-copyable), just return the original reference
		if (constructor && constructor !== Object && constructor !== Array) {
			return value
		}

		// Handle plain objects
		const plainObj = Object.create(Object.getPrototypeOf(value))
		visited.set(value as object, plainObj)

		// Copy all properties
		const allPropertyNames = Object.getOwnPropertyNames(value)
		for (const prop of allPropertyNames) {
			const descriptor = Object.getOwnPropertyDescriptor(value, prop)
			if (!descriptor) continue

			if (descriptor.value !== undefined) {
				if (typeof descriptor.value === "function") {
					// For functions, keep the original reference
					Object.defineProperty(plainObj, prop, descriptor)
				} else {
					// Deep copy non-function values
					Object.defineProperty(plainObj, prop, {
						...descriptor,
						value: copyInternal(descriptor.value),
					})
				}
			} else {
				// For getters and setters, copy the descriptor directly
				Object.defineProperty(plainObj, prop, descriptor)
			}
		}

		return plainObj as U
	}

	return copyInternal(obj)
}
