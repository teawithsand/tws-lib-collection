import { z } from "zod"
import { StoredMintayCardEventV1Schema } from "./schemaV1"

export const StoredMintayCardEventSchema = z.discriminatedUnion("version", [
	z.object({
		version: z.literal(1),
		data: StoredMintayCardEventV1Schema,
	}),
])

export type StoredMintayCardEvent = z.infer<typeof StoredMintayCardEventSchema>
