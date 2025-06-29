import { Timestamp } from "@teawithsand/lngext"
import { VersionedType } from "@teawithsand/reserd"
import { z } from "zod"
import { AbookEntryAggregateData } from "../abookEntry"
import {
	AbookEntryMetadataStoredV1,
	abookEntryMetadataStoredV1Schema,
	translateBlobMetadataFromStored,
	translateBlobMetadataToStored,
	translateSourceLiteFromStored,
	translateSourceLiteToStored,
} from "./common"

// Stored types for version 1
type AbookEntryAggregateDataStoredV1 = {
	metadata: AbookEntryMetadataStoredV1 | null
	blobSize: number | null
}

// Versioned data types
type AbookEntryAggregateDataVersionedData = {
	1: AbookEntryAggregateDataStoredV1
}

// Zod schemas
const abookEntryAggregateDataStoredV1Schema = z.object({
	metadata: abookEntryMetadataStoredV1Schema.nullable(),
	blobSize: z.number().nullable(),
})

/**
 * VersionedType for AbookEntryAggregateData, supporting migration and serialization between versions.
 * Handles translation between owned and stored representations.
 */
export const AbookEntryAggregateDataVersionedType = new VersionedType<
	AbookEntryAggregateDataVersionedData,
	AbookEntryAggregateData
>({
	serializer: (owned: AbookEntryAggregateData) => ({
		version: 1 as const,
		data: {
			metadata: owned.metadata
				? {
						extractTimestamp:
							owned.metadata.extractTimestamp.toNumberMillis(),
						extractSource: translateSourceLiteToStored(
							owned.metadata.extractSource,
						),
						metadata: translateBlobMetadataToStored(
							owned.metadata.metadata,
						),
					}
				: null,
			blobSize: owned.blobSize,
		},
	}),
	deserializer: {
		1: {
			schema: abookEntryAggregateDataStoredV1Schema,
			deserializer: (
				data: AbookEntryAggregateDataStoredV1,
			): AbookEntryAggregateData => ({
				metadata: data.metadata
					? {
							extractTimestamp: Timestamp.fromNumber(
								data.metadata.extractTimestamp,
							),
							extractSource: translateSourceLiteFromStored(
								data.metadata.extractSource,
							),
							metadata: translateBlobMetadataFromStored(
								data.metadata.metadata,
							),
						}
					: null,
				blobSize: data.blobSize,
			}),
		},
	},
})

// Type aliases for any version (union types)
export type AbookEntryAggregateDataStored = z.infer<
	typeof AbookEntryAggregateDataVersionedType.schema
>

// Schema aliases for any version
export const AbookEntryAggregateDataStoredSchema =
	AbookEntryAggregateDataVersionedType.schema
