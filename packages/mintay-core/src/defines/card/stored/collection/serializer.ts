import { VersionedStoredType, createVersionedSchema } from "@teawithsand/reserd"
import { z } from "zod"
import { MintayCollectionData } from "../../collectionData"
import { StoredMintayCollectionData } from "./schema"

const mintayCollectionDataV1Schema = z.object({
	globalId: z.string(),
	createdAtTimestamp: z.number(),
	lastUpdatedAtTimestamp: z.number(),
	content: z.string(),
})

export const storedMintayCollectionDataVersionedType =
	VersionedStoredType.create<
		StoredMintayCollectionData,
		MintayCollectionData
	>({
		config: {
			versions: {
				1: {
					schema: createVersionedSchema(
						1,
						mintayCollectionDataV1Schema,
					),
					deserializer: (stored) => ({
						globalId: stored.data.globalId,
						createdAtTimestamp: stored.data.createdAtTimestamp,
						lastUpdatedAtTimestamp:
							stored.data.lastUpdatedAtTimestamp,
						content: stored.data.content,
					}),
				},
			},
			currentSerializer: (data: MintayCollectionData) => ({
				version: 1 as const,
				data: {
					globalId: data.globalId,
					createdAtTimestamp: data.createdAtTimestamp,
					lastUpdatedAtTimestamp: data.lastUpdatedAtTimestamp,
					content: data.content,
				},
			}),
		},
	})
