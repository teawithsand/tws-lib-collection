import { BaseError, Errors, Result } from "@teawithsand/lngext"

export const RouteParamsParsingError = Errors.makeErrorType(
	"RouteParamsParsingError",
	BaseError,
)

/**
 * Parser interface for transforming and validating route parameters
 * @template T - The type of the parsed result
 */
export type RouteParamsSchema<T> = {
	/**
	 * Parse and validate route parameters from raw string values
	 * @param input - Raw route parameters where values are strings or undefined
	 * @returns Parsed and validated parameters of type T
	 * @throws Should throw an error if validation fails
	 */
	parse: (input: Record<string, string | undefined>) => T
}

/**
 * Route parameters hook interface for accessing and parsing URL parameters
 *
 * This interface provides methods to access route parameters in both raw form
 * and parsed/validated form using custom parsers.
 */
export interface RouteParamsHook {
	/**
	 * Get all route parameters as a raw object with string values
	 *
	 * Parameters are returned as-is from the URL without any parsing or validation.
	 * Values are strings as they come from the URL, or undefined if not present.
	 *
	 * @returns Record containing all route parameters with string values
	 */
	readonly getRaw: () => Record<string, string | undefined>

	/**
	 * Resolve route parameters using a validation schema
	 *
	 * This method parses and validates route parameters using the provided parser.
	 * If validation fails, an error is thrown.
	 *
	 * @template T - The expected type after parsing
	 * @param parser - Schema object with parse method to validate and parse parameters
	 * @throws When params do not match schema or validation fails
	 * @returns Parsed and validated parameters of type T
	 */
	readonly resolve: <T>(parser: RouteParamsSchema<T>) => T

	/**
	 * Resolve route parameters using a validation schema (safe version)
	 *
	 * Unlike resolve, this method does not throw errors. Instead, it returns
	 * a Result object that either contains the parsed data or an error.
	 * This is useful when you want to handle validation failures gracefully.
	 *
	 * @template T - The expected type after parsing
	 * @param parser - Schema object with parse method to validate and parse parameters
	 * @returns Result containing either parsed parameters or an error
	 */
	readonly resolveResult: <T>(parser: RouteParamsSchema<T>) => Result<T>
}
