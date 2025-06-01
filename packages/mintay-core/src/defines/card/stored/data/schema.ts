import { z } from "zod"

const StoredMintayCardDataV1Schema = z.object({
	globalId: z.string(),
	content: z.string(),
	createdAtTimestamp: z.number(),
	lastUpdatedAtTimestamp: z.number(),
	discoveryPriority: z.number(),
})

export const StoredMintayCardDataSchema = z.discriminatedUnion("version", [
	z.object({
		version: z.literal(1),
		data: StoredMintayCardDataV1Schema,
	}),
])

export type StoredMintayCardData = z.infer<typeof StoredMintayCardDataSchema>
