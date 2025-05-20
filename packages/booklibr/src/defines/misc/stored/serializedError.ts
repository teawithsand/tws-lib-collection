import { z } from "zod"

export const storedSerializedErrorV1Schema = z.object({
	version: z.literal(1),
	message: z.string(),
})

export type StoredSerializedErrorV1 = z.infer<
	typeof storedSerializedErrorV1Schema
>

export const StoredSerializedErrorSchema = storedSerializedErrorV1Schema
export type StoredSerializedError = z.infer<typeof StoredSerializedErrorSchema>

export class SerializedErrorSerializer {
	private constructor() {}

	public static readonly serialize = (input: {
		message: string
	}): StoredSerializedErrorV1 => ({
		version: 1,
		message: input.message,
	})

	public static readonly deserialize = (
		stored: unknown,
	): { message: string } => {
		const parsed = storedSerializedErrorV1Schema.parse(stored)
		return { message: parsed.message }
	}
}
