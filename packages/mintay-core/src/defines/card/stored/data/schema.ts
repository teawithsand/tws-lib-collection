import { z } from "zod"

const StoredSdelkaCardDataV1Schema = z.object({
	globalId: z.string(),
	content: z.string(),
	createdAtTimestamp: z.number(),
	lastUpdatedAtTimestamp: z.number(),
})

export const StoredSdelkaCardDataSchema = z.discriminatedUnion("version", [
	z.object({
		version: z.literal(1),
		data: StoredSdelkaCardDataV1Schema,
	}),
])

export type StoredSdelkaCardData = z.infer<typeof StoredSdelkaCardDataSchema>
