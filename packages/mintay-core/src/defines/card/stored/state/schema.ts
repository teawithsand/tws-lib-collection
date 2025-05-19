import { z } from "zod"
import { StoredSdelkaCardStateV1Schema } from "./schemaV1"

export const StoredSdelkaCardStateSchema = z.discriminatedUnion("version", [
	z.object({
		version: z.literal(1),
		data: StoredSdelkaCardStateV1Schema,
	}),
])

export type StoredSdelkaCardState = z.infer<typeof StoredSdelkaCardStateSchema>
