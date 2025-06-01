import { VersionedStoredType, createVersionedSchema } from "@teawithsand/reserd"
import { z } from "zod"
import { MintayCardData } from "../../cardData"
import { StoredMintayCardData } from "./schema"

const mintayCardDataV1Schema = z.object({
	globalId: z.string(),
	content: z.string(),
	createdAtTimestamp: z.number(),
	lastUpdatedAtTimestamp: z.number(),
	discoveryPriority: z.number(),
})

export const storedMintayCardDataVersionedType = VersionedStoredType.create<
	StoredMintayCardData,
	MintayCardData
>({
	config: {
		versions: {
			1: {
				schema: createVersionedSchema(1, mintayCardDataV1Schema),
				deserializer: (stored) => ({
					globalId: stored.data.globalId,
					content: stored.data.content,
					createdAtTimestamp: stored.data.createdAtTimestamp,
					lastUpdatedAtTimestamp: stored.data.lastUpdatedAtTimestamp,
					discoveryPriority: stored.data.discoveryPriority,
				}),
			},
		},
		currentSerializer: (data: MintayCardData) => ({
			version: 1 as const,
			data: {
				globalId: data.globalId,
				content: data.content,
				createdAtTimestamp: data.createdAtTimestamp,
				lastUpdatedAtTimestamp: data.lastUpdatedAtTimestamp,
				discoveryPriority: data.discoveryPriority,
			},
		}),
	},
})
