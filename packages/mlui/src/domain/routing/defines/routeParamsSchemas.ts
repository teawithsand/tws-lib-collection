import { RouteParamsSchema } from "./routeParams"

/**
 * Collection of predefined route parameter schemas
 */
export class RouteParamsSchemas {
	private constructor() {}

	/**
	 * Creates a schema that extracts a string parameter with fallback to empty string.
	 *
	 * @param paramName - The name of the parameter to extract
	 * @returns ParamsSchema that extracts the specified parameter as a string
	 */
	public static readonly createStringParamSchema = (
		paramName: string,
	): RouteParamsSchema<string> => ({
		parse: (input: Record<string, string | undefined>): string => {
			return input[paramName] ?? ""
		},
	})

	/**
	 * Schema for extracting an 'id' parameter
	 */
	public static readonly idParamSchema: RouteParamsSchema<string> =
		RouteParamsSchemas.createStringParamSchema("id")
}
