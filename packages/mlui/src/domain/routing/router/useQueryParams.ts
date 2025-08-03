import { Result } from "@teawithsand/lngext"
import { useSearchParams } from "react-router"
import {
	QueryParamsParsingError,
	QueryParamsSchema,
	type QueryParamsHook,
} from "../defines"

/**
 * Hook that provides query parameter access functionality using react-router
 */
export const useQueryParams = (): QueryParamsHook => {
	const [searchParams] = useSearchParams()

	const convertSearchParamsToRecord = (): Record<
		string,
		string | string[] | undefined
	> => {
		const result: Record<string, string | string[] | undefined> = {}

		// Convert URLSearchParams to our expected format
		for (const [key, value] of searchParams.entries()) {
			const existing = result[key]
			if (existing === undefined) {
				result[key] = value
			} else if (Array.isArray(existing)) {
				existing.push(value)
			} else {
				result[key] = [existing, value]
			}
		}

		return result
	}

	return {
		getRaw: convertSearchParamsToRecord,
		resolve: <T>(schema: QueryParamsSchema<T>): T => {
			try {
				const rawParams = convertSearchParamsToRecord()
				return schema.parse(rawParams)
			} catch (e) {
				if (e instanceof QueryParamsParsingError) {
					throw e
				}
				throw new QueryParamsParsingError(
					"Parsing query parameters using schema filed",
					e,
				)
			}
		},
		resolveResult: <T>(schema: QueryParamsSchema<T>): Result<T> => {
			try {
				const rawParams = convertSearchParamsToRecord()
				return Result.ok(schema.parse(rawParams))
			} catch (e) {
				if (e instanceof QueryParamsParsingError) {
					return Result.error<T>(e)
				}
				return Result.error<T>(
					new QueryParamsParsingError(
						"Parsing query parameters using schema to result filed",
						e,
					),
				)
			}
		},
	}
}
