import { SerializerUtil } from "@teawithsand/reserd"
import { z } from "zod"

/**
 * Application configuration serializers
 */
export class AppConfigSerializers {
	private constructor() {}

	/**
	 * Theme serializer using Zod for validation
	 */
	public static readonly theme = SerializerUtil.fromZodSchemaChecked(
		z.enum(["light", "dark", "auto"]),
	)

	/**
	 * Language serializer using Zod for validation
	 */
	public static readonly language = SerializerUtil.fromZodSchemaChecked(
		z.string().min(1),
	)
}
