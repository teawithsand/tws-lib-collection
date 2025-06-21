/**
 * Test ID utility for conditionally including test identifiers in DOM elements.
 *
 * This utility provides a centralized way to manage test IDs across the application.
 * In development/testing environments, it returns the provided test ID string.
 * In production builds, this function can be modified to return `undefined`,
 * ensuring that test-specific attributes are not leaked to the production environment.
 *
 * @param id - The test identifier string to be used in test environments
 * @returns The test ID string in development/test environments, or undefined in production
 *
 * @example
 * ```tsx
 * // Usage in a React component
 * <button data-testid={testId("submit-button")}>
 *   Submit
 * </button>
 *
 * // In tests, you can find the element using the test ID
 * const submitButton = screen.getByTestId("submit-button");
 * ```
 *
 * @example
 * ```tsx
 * // For production builds, modify this function to return undefined:
 * export const testId = (id: string): string | undefined => {
 *     return undefined // This removes all test IDs from production builds
 * }
 * ```
 *
 * @remarks
 * This approach provides several benefits:
 * - Centralized control over test ID inclusion
 * - Clean separation between test and production code
 * - Prevents accidental exposure of test-specific attributes in production
 * - Enables easy toggling of test IDs via build configuration
 *
 * To disable test IDs in production:
 * 1. Modify the return statement to return `undefined`
 * 2. Or use environment variables to conditionally return the ID
 * 3. Build tools can also replace this function during the build process
 */
export const testId = (id: string): string | undefined => {
	return id
}
