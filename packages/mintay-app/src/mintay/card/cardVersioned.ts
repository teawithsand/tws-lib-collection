import { VersionedType } from "@teawithsand/reserd"
import { z } from "zod"
import { AppCardData } from "./card"

type AppCardDataStoredV1 = {
	globalId: string
	discoveryPriority: number
	questionContent: string
	answerContent: string
	createdAt: number
	updatedAt: number
}

type AppCardDataVersionedData = {
	1: AppCardDataStoredV1
}

const appCardDataStoredV1Schema = z.object({
	globalId: z.string(),
	discoveryPriority: z.number(),
	questionContent: z.string(),
	answerContent: z.string(),
	createdAt: z.number(),
	updatedAt: z.number(),
})

/**
 * VersionedType for CardData, supporting migration and serialization between versions.
 * Handles translation between owned and stored representations.
 */
export const AppCardDataVersionedType = new VersionedType<
	AppCardDataVersionedData,
	AppCardData
>({
	serializer: (owned: AppCardData) => ({
		version: 1 as const,
		data: {
			globalId: owned.globalId,
			discoveryPriority: owned.discoveryPriority,
			questionContent: owned.questionContent,
			answerContent: owned.answerContent,
			createdAt: owned.createdAt,
			updatedAt: owned.updatedAt,
		},
	}),
	deserializer: {
		1: {
			schema: appCardDataStoredV1Schema,
			deserializer: (data: AppCardDataStoredV1): AppCardData => ({
				globalId: data.globalId,
				discoveryPriority: data.discoveryPriority,
				questionContent: data.questionContent,
				answerContent: data.answerContent,
				createdAt: data.createdAt,
				updatedAt: data.updatedAt,
			}),
		},
	},
})
