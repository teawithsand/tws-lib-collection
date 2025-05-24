import { z } from "zod"
import { StoredMintayCardStateV1Schema } from "./schemaV1"

export const StoredMintayCardStateSchema = z.discriminatedUnion("version", [
	z.object({
		version: z.literal(1),
		data: StoredMintayCardStateV1Schema,
	}),
])

export type StoredMintayCardState = z.infer<typeof StoredMintayCardStateSchema>
