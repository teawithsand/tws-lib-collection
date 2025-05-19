import { z } from "zod"

const StoredSdelkaCollectionDataV1Schema = z.object({
	globalId: z.string(),
	title: z.string(),
	description: z.string(),
	createdAtTimestamp: z.number(),
	lastUpdatedAtTimestamp: z.number(),
})

export const StoredSdelkaCollectionDataSchema = z.discriminatedUnion(
	"version",
	[
		z.object({
			version: z.literal(1),
			data: StoredSdelkaCollectionDataV1Schema,
		}),
	],
)

export type StoredSdelkaCollectionData = z.infer<
	typeof StoredSdelkaCollectionDataSchema
>
