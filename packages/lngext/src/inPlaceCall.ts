/**
 * Executes a given function and returns its result.
 *
 * This utility function simply calls the provided function `fn`
 * and returns its output. It can be useful for inline evaluations,
 * or to enforce a specific place of execution in code chains.
 *
 * @template T - The return type of the function `fn`.
 * @param {() => T} fn - A function with no arguments that returns a value of type T.
 * @returns {T} The result of invoking the provided function `fn`.
 *
 * @example
 * // Basic usage with a simple function
 * const result = inPlace(() => 5 + 3);
 * console.log(result);  // Output: 8
 *
 * @example
 * // Using inPlace with a more complex operation
 * const squared = inPlace(() => {
 *   const x = 4;
 *   return x * x;
 * });
 * console.log(squared); // Output: 16
 */
export const inPlace = <T>(fn: () => T): T => fn()
