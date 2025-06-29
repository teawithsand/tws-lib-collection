import { Timestamp } from "@teawithsand/lngext"
import { VersionedType } from "@teawithsand/reserd"
import { z } from "zod"
import { AbookEntry } from "../abookEntry"
import {
	AbookEntryDispositionStored,
	AbookEntryMetadataStoredV1,
	AbookEntrySourceFullStoredV1,
	abookEntryMetadataStoredV1Schema,
	abookEntrySourceFullStoredV1Schema,
	translateBlobMetadataFromStored,
	translateBlobMetadataToStored,
	translateDispositionFromStored,
	translateDispositionToStored,
	translateSourceFullFromStored,
	translateSourceFullToStored,
	translateSourceLiteFromStored,
	translateSourceLiteToStored,
} from "./common"

// Stored types for version 1
type AbookEntryDataStoredV1 = {
	createdAt: number
	disposition: AbookEntryDispositionStored
	source: AbookEntrySourceFullStoredV1
}

type AbookEntryAggregateDataStoredV1 = {
	metadata: AbookEntryMetadataStoredV1 | null
	blobSize: number | null
}

type AbookEntryStoredV1 = {
	data: AbookEntryDataStoredV1
	aggregate: AbookEntryAggregateDataStoredV1
}

// Versioned data types
type AbookEntryVersionedData = {
	1: AbookEntryStoredV1
}

// Zod schemas
const abookEntryDataStoredV1Schema = z.object({
	createdAt: z.number(),
	disposition: z.nativeEnum(AbookEntryDispositionStored),
	source: abookEntrySourceFullStoredV1Schema,
})

const abookEntryAggregateDataStoredV1Schema = z.object({
	metadata: abookEntryMetadataStoredV1Schema.nullable(),
	blobSize: z.number().nullable(),
})

const abookEntryStoredV1Schema = z.object({
	data: abookEntryDataStoredV1Schema,
	aggregate: abookEntryAggregateDataStoredV1Schema,
})

/**
 * VersionedType for AbookEntry, supporting migration and serialization between versions.
 * Handles translation between owned and stored representations.
 */
export const AbookEntryVersionedType = new VersionedType<
	AbookEntryVersionedData,
	AbookEntry
>({
	serializer: (owned: AbookEntry) => ({
		version: 1 as const,
		data: {
			data: {
				createdAt: owned.data.createdAt.toNumberMillis(),
				disposition: translateDispositionToStored(
					owned.data.disposition,
				),
				source: translateSourceFullToStored(owned.data.source),
			},
			aggregate: {
				metadata: owned.aggregate.metadata
					? {
							extractTimestamp:
								owned.aggregate.metadata.extractTimestamp.toNumberMillis(),
							extractSource: translateSourceLiteToStored(
								owned.aggregate.metadata.extractSource,
							),
							metadata: translateBlobMetadataToStored(
								owned.aggregate.metadata.metadata,
							),
						}
					: null,
				blobSize: owned.aggregate.blobSize,
			},
		},
	}),
	deserializer: {
		1: {
			schema: abookEntryStoredV1Schema,
			deserializer: (data: AbookEntryStoredV1): AbookEntry =>
				new AbookEntry({
					data: {
						createdAt: Timestamp.fromNumber(data.data.createdAt),
						disposition: translateDispositionFromStored(
							data.data.disposition,
						),
						source: translateSourceFullFromStored(data.data.source),
					},
					aggregate: {
						metadata: data.aggregate.metadata
							? {
									extractTimestamp: Timestamp.fromNumber(
										data.aggregate.metadata
											.extractTimestamp,
									),
									extractSource:
										translateSourceLiteFromStored(
											data.aggregate.metadata
												.extractSource,
										),
									metadata: translateBlobMetadataFromStored(
										data.aggregate.metadata.metadata,
									),
								}
							: null,
						blobSize: data.aggregate.blobSize,
					},
				}),
		},
	},
})

// Type aliases for any version (union types)
export type AbookEntryStored = z.infer<typeof AbookEntryVersionedType.schema>

// Schema aliases for any version
export const AbookEntryStoredSchema = AbookEntryVersionedType.schema
