/**
 * Utility class for type assertions and exhaustiveness checking.
 * Helps enforce compile-time checks for completeness of switch statements,
 * if-else branches, and enum handling.
 */
export class TypeAssert {
	/**
	 * Private constructor to prevent instantiation as this is a utility class
	 * with only static methods.
	 */
	private constructor() {}

	/**
	 * A convenience method to assert that a certain code path is unreachable.
	 *
	 * @example
	 * ```typescript
	 * if (someImpossibleCondition) {
	 *   TypeAssert.unreachable('This code should never execute');
	 * }
	 * ```
	 *
	 * @param message - A custom message for the error
	 * @returns never - This function never returns normally
	 */
	public static readonly unreachable = (
		message: string = "Unreachable code was executed",
	): never => {
		throw new Error(message)
	}

	/**
	 * A non-throwing assertion that a value is of type never.
	 * Useful for exhaustiveness checking in switch statements or if-else chains
	 * when you don't want to throw an error, but still want compile-time checking.
	 *
	 * @example
	 * ```typescript
	 * type Shape = 'circle' | 'square' | 'triangle';
	 *
	 * function handleShape(shape: Shape): string {
	 *   if (shape === 'circle') {
	 *     return 'Circle';
	 *   } else if (shape === 'square') {
	 *     return 'Square';
	 *   } else if (shape === 'triangle') {
	 *     return 'Triangle';
	 *   } else {
	 *     // This will cause a compile-time error if a new shape type is added
	 *     // and not handled above, but won't throw at runtime
	 *     TypeAssert.assertNever(shape);
	 *     return 'Unknown';  // This line will never execute if all cases are handled
	 *   }
	 * }
	 * ```
	 *
	 * @param value - The value that should be of type never
	 * @returns void - This function performs type checking but doesn't return anything
	 */
	public static readonly assertNever = (_never: never): void => {
		// No-op at runtime, but provides compile-time type checking
	}
}

// See https://stackoverflow.com/questions/57683303/how-can-i-see-the-full-expanded-contract-of-a-typescript-type

/**
 * Expands a type to show its full structure.
 * This is useful for debugging complex types.
 * It expands the type one level deep.
 *
 * @template T - The type to expand.
 */
export type Expand<T> = T extends (...args: infer A) => infer R
	? (...args: Expand<A>) => Expand<R>
	: T extends infer O
		? { [K in keyof O]: O[K] }
		: never

/**
 * Recursively expands a type to show its full structure.
 * This is useful for debugging complex types.
 * It expands the type and all its nested properties.
 *
 * @template T - The type to expand.
 */
export type ExpandRecursively<T> = T extends (...args: infer A) => infer R
	? (...args: ExpandRecursively<A>) => ExpandRecursively<R>
	: T extends object
		? T extends infer O
			? { [K in keyof O]: ExpandRecursively<O[K]> }
			: never
		: T
