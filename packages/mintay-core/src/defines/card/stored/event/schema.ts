import { z } from "zod"
import { StoredSdelkaCardEventV1Schema } from "./schemaV1"

export const StoredSdelkaCardEventSchema = z.discriminatedUnion("version", [
	z.object({
		version: z.literal(1),
		data: StoredSdelkaCardEventV1Schema,
	}),
])

export type StoredSdelkaCardEvent = z.infer<typeof StoredSdelkaCardEventSchema>
