import { VersionedStoredType, createVersionedSchema } from "@teawithsand/reserd"
import { z } from "zod"
import { MintayCollectionData } from "../../collectionData"
import { StoredMintayCollectionData } from "./schema"

const mintayCollectionDataV1Schema = z.object({
	globalId: z.string(),
	title: z.string(),
	description: z.string(),
	createdAtTimestamp: z.number(),
	lastUpdatedAtTimestamp: z.number(),
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
						title: stored.data.title,
						description: stored.data.description,
						createdAtTimestamp: stored.data.createdAtTimestamp,
						lastUpdatedAtTimestamp:
							stored.data.lastUpdatedAtTimestamp,
					}),
				},
			},
			currentSerializer: (data: MintayCollectionData) => ({
				version: 1 as const,
				data: {
					globalId: data.globalId,
					title: data.title,
					description: data.description,
					createdAtTimestamp: data.createdAtTimestamp,
					lastUpdatedAtTimestamp: data.lastUpdatedAtTimestamp,
				},
			}),
		},
	})
