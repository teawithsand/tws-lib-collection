/**
 * Performs a deep copy of the provided value
 * @param value The value to deep copy
 * @returns A deep copy of the provided value
 */
export const deepCopy = <T>(value: T): T => {
	// Handle null or undefined
	if (value === null || value === undefined) {
		return value;
	}

	// Handle primitive types
	if (typeof value !== 'object') {
		return value;
	}

	// Handle Date objects
	if (value instanceof Date) {
		return new Date(value.getTime()) as unknown as T;
	}

	// Handle Arrays
	if (Array.isArray(value)) {
		return value.map(item => deepCopy(item)) as unknown as T;
	}

	// Handle Objects
	const result: Record<string, unknown> = {};
	Object.entries(value as Record<string, unknown>).forEach(([key, val]) => {
		result[key] = deepCopy(val);
	});

	return result as T;
};