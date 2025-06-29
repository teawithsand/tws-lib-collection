import { Timestamp } from "@teawithsand/lngext"
import { VersionedType } from "@teawithsand/reserd"
import { z } from "zod"
import { AbookEntryData } from "../abookEntry"
import {
	AbookEntryDispositionStored,
	AbookEntrySourceFullStoredV1,
	abookEntrySourceFullStoredV1Schema,
	translateDispositionFromStored,
	translateDispositionToStored,
	translateSourceFullFromStored,
	translateSourceFullToStored,
} from "./common"

// Stored types for version 1
type AbookEntryDataStoredV1 = {
	createdAt: number
	disposition: AbookEntryDispositionStored
	source: AbookEntrySourceFullStoredV1
}

// Versioned data types
type AbookEntryDataVersionedData = {
	1: AbookEntryDataStoredV1
}

// Zod schemas
const abookEntryDataStoredV1Schema = z.object({
	createdAt: z.number(),
	disposition: z.nativeEnum(AbookEntryDispositionStored),
	source: abookEntrySourceFullStoredV1Schema,
})

/**
 * VersionedType for AbookEntryData, supporting migration and serialization between versions.
 * Handles translation between owned and stored representations.
 */
export const AbookEntryDataVersionedType = new VersionedType<
	AbookEntryDataVersionedData,
	AbookEntryData
>({
	serializer: (owned: AbookEntryData) => ({
		version: 1 as const,
		data: {
			createdAt: owned.createdAt.toNumberMillis(),
			disposition: translateDispositionToStored(owned.disposition),
			source: translateSourceFullToStored(owned.source),
		},
	}),
	deserializer: {
		1: {
			schema: abookEntryDataStoredV1Schema,
			deserializer: (data: AbookEntryDataStoredV1): AbookEntryData => ({
				createdAt: Timestamp.fromNumber(data.createdAt),
				disposition: translateDispositionFromStored(data.disposition),
				source: translateSourceFullFromStored(data.source),
			}),
		},
	},
})

// Type aliases for any version (union types)
export type AbookEntryDataStored = z.infer<
	typeof AbookEntryDataVersionedType.schema
>

// Schema aliases for any version
export const AbookEntryDataStoredSchema = AbookEntryDataVersionedType.schema
