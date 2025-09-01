import { SerializerUtil } from "@teawithsand/reserd"
import { z } from "zod"

/**
 * Application configuration serializers
 */
export class AppConfigSerializers {
	private constructor() {}

	/**
	 * Language serializer using Zod for validation
	 */
	public static readonly language = SerializerUtil.fromZodSchemaChecked(
		z.string().min(1),
	)
}
