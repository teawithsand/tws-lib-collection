import { VersionedType } from "@teawithsand/reserd"
import { z } from "zod"
import { AppCollectionData } from "./collection"

type AppCollectionDataStoredV1 = {
	globalId: string
	content: string
	description: string
	createdAt: number
	updatedAt: number
}

type AppCollectionDataVersionedData = {
	1: AppCollectionDataStoredV1
}

const appCollectionDataStoredV1Schema = z.object({
	globalId: z.string(),
	content: z.string(),
	description: z.string(),
	createdAt: z.number(),
	updatedAt: z.number(),
})

/**
 * VersionedType for CollectionData, supporting migration and serialization between versions.
 * Handles translation between owned and stored representations.
 */
export const AppCollectionDataVersionedType = new VersionedType<
	AppCollectionDataVersionedData,
	AppCollectionData
>({
	serializer: (owned: AppCollectionData) => ({
		version: 1 as const,
		data: {
			globalId: owned.globalId,
			content: owned.title,
			description: owned.description,
			createdAt: owned.createdAt,
			updatedAt: owned.updatedAt,
		},
	}),
	deserializer: {
		1: {
			schema: appCollectionDataStoredV1Schema,
			deserializer: (
				data: AppCollectionDataStoredV1,
			): AppCollectionData => ({
				globalId: data.globalId,
				title: data.content,
				description: data.description,
				createdAt: data.createdAt,
				updatedAt: data.updatedAt,
			}),
		},
	},
})
