import { Result } from "@teawithsand/lngext"
import { useParams } from "react-router"
import {
	RouteParamsParsingError,
	RouteParamsSchema,
	type RouteParamsHook,
} from "../defines"

/**
 * Hook that provides route parameter access functionality using react-router
 */
export const useRouteParams = (): RouteParamsHook => {
	const params = useParams()

	return {
		getRaw: () => params,
		resolve: <T>(schema: RouteParamsSchema<T>): T => {
			try {
				return schema.parse(params)
			} catch (e) {
				if (e instanceof RouteParamsParsingError) {
					throw e
				}
				throw new RouteParamsParsingError(
					"Parsing parameters using schema filed",
					e,
				)
			}
		},
		resolveResult: <T>(schema: RouteParamsSchema<T>): Result<T> => {
			try {
				return Result.ok(schema.parse(params))
			} catch (e) {
				if (e instanceof RouteParamsParsingError) {
					return Result.error<T>(e)
				}
				return Result.error<T>(
					new RouteParamsParsingError(
						"Parsing parameters using schema to result filed",
						e,
					),
				)
			}
		},
	}
}
