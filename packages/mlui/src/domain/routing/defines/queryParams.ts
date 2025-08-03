import { BaseError, Errors, Result } from "@teawithsand/lngext"

export const QueryParamsParsingError = Errors.makeErrorType(
	"QueryParamsParsingError",
	BaseError,
)

/**
 * Parser interface for transforming and validating query parameters
 * @template T - The type of the parsed result
 */
export type QueryParamsSchema<T> = {
	/**
	 * Parse and validate query parameters from raw string values
	 * @param input - Raw query parameters where values are strings, string arrays, or undefined
	 * @returns Parsed and validated parameters of type T
	 * @throws Should throw an error if validation fails
	 */
	parse: (input: Record<string, string | string[] | undefined>) => T
}

/**
 * Query parameters hook interface for accessing and parsing URL query parameters
 *
 * This interface provides methods to access query parameters in both raw form
 * and parsed/validated form using custom parsers.
 */
export interface QueryParamsHook {
	/**
	 * Get all query parameters as a raw object with string or string array values
	 *
	 * Parameters are returned as-is from the URL without any parsing or validation.
	 * Values can be strings (single value), string arrays (multiple values), or undefined if not present.
	 *
	 * @returns Record containing all query parameters with string or string array values
	 */
	readonly getRaw: () => Record<string, string | string[] | undefined>

	/**
	 * Resolve query parameters using a validation schema
	 *
	 * This method parses and validates query parameters using the provided parser.
	 * If validation fails, an error is thrown.
	 *
	 * @template T - The expected type after parsing
	 * @param parser - Schema object with parse method to validate and parse parameters
	 * @throws When params do not match schema or validation fails
	 * @returns Parsed and validated parameters of type T
	 */
	readonly resolve: <T>(parser: QueryParamsSchema<T>) => T

	/**
	 * Resolve query parameters using a validation schema (safe version)
	 *
	 * Unlike resolve, this method does not throw errors. Instead, it returns
	 * a Result object that either contains the parsed data or an error.
	 * This is useful when you want to handle validation failures gracefully.
	 *
	 * @template T - The expected type after parsing
	 * @param parser - Schema object with parse method to validate and parse parameters
	 * @returns Result containing either parsed parameters or an error
	 */
	readonly resolveResult: <T>(parser: QueryParamsSchema<T>) => Result<T>
}
