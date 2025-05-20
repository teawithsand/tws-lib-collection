/**
 * A utility function that throws the given error and returns never.
 * This enables Kotlin-like syntax with the ternary operator:
 * `condition ? value : throwError("message")`
 *
 * @param error - The error to throw
 * @returns never - The function never returns as it always throws
 */
export const throwError = <T extends Error>(error: T): never => {
	throw error
}

/**
 * A utility function that creates and throws an Error with the given message and returns never.
 * This enables Kotlin-like syntax with the ternary operator:
 * `condition ? value : throwMessage("error message")`
 *
 * @param message - The error message
 * @returns never - The function never returns as it always throws
 */
export const throwMessage = (message: string): never => {
	throw new Error(message)
}
