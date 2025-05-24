import { z } from "zod"

const StoredMintayCollectionDataV1Schema = z.object({
	globalId: z.string(),
	title: z.string(),
	description: z.string(),
	createdAtTimestamp: z.number(),
	lastUpdatedAtTimestamp: z.number(),
})

export const StoredMintayCollectionDataSchema = z.discriminatedUnion(
	"version",
	[
		z.object({
			version: z.literal(1),
			data: StoredMintayCollectionDataV1Schema,
		}),
	],
)

export type StoredMintayCollectionData = z.infer<
	typeof StoredMintayCollectionDataSchema
>
