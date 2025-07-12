import { Timestamp } from "@teawithsand/lngext"
import { VersionedType, VersionedTypeInfer } from "@teawithsand/reserd"
import { z } from "zod"
import { blobMetadataVersioned } from "../../metadata/stored/blobMetadataStored"
import type { AbookEntryAggregateData, AbookEntryMetadata } from "../entryData"
import { AbookEntrySourceLite, AbookEntrySourceType } from "../entrySource"
import {
	AbookEntrySourceLiteStoredV1,
	abookEntrySourceLiteStoredV1Schema,
	AbookEntrySourceTypeStoredV1,
} from "./common"

// Stored types for V1

type AbookEntryMetadataStoredV1 = {
	extractTimestamp: number
	extractSource: AbookEntrySourceLiteStoredV1
	metadata: VersionedTypeInfer<typeof blobMetadataVersioned>
}

type AbookEntryAggregateDataStoredV1 = {
	metadata: AbookEntryMetadataStoredV1 | null
	blobSize: number | null
}

// Zod schemas for V1
const abookEntryMetadataStoredV1Schema = z.object({
	extractTimestamp: z.number(),
	extractSource: abookEntrySourceLiteStoredV1Schema,
	metadata: blobMetadataVersioned.schema,
})

const abookEntryAggregateDataStoredV1Schema = z.object({
	metadata: abookEntryMetadataStoredV1Schema.nullable(),
	blobSize: z.number().nullable(),
})

// Helper functions for conversion
const serializeAbookEntrySourceLite = (
	source: AbookEntrySourceLite,
): AbookEntrySourceLiteStoredV1 => {
	switch (source.type) {
		case AbookEntrySourceType.UPLOAD:
			return {
				type: AbookEntrySourceTypeStoredV1.UPLOAD,
			}
		case AbookEntrySourceType.URL:
			return {
				type: AbookEntrySourceTypeStoredV1.URL,
				url: source.url,
			}
		default:
			throw new Error(`Unknown source type: ${(source as any).type}`)
	}
}

const deserializeAbookEntrySourceLite = (
	stored: AbookEntrySourceLiteStoredV1,
): AbookEntrySourceLite => {
	switch (stored.type) {
		case AbookEntrySourceTypeStoredV1.UPLOAD:
			return {
				type: AbookEntrySourceType.UPLOAD,
			}
		case AbookEntrySourceTypeStoredV1.URL:
			return {
				type: AbookEntrySourceType.URL,
				url: stored.url,
			}
		default:
			throw new Error(
				`Unknown stored source type: ${(stored as any).type}`,
			)
	}
}

const serializeAbookEntryMetadata = (
	metadata: AbookEntryMetadata,
): AbookEntryMetadataStoredV1 => ({
	extractTimestamp: Timestamp.serializer.serialize(metadata.extractTimestamp),
	extractSource: serializeAbookEntrySourceLite(metadata.extractSource),
	metadata: blobMetadataVersioned.serialize(metadata.metadata),
})

const deserializeAbookEntryMetadata = (
	stored: AbookEntryMetadataStoredV1,
): AbookEntryMetadata => ({
	extractTimestamp: Timestamp.serializer.deserialize(stored.extractTimestamp),
	extractSource: deserializeAbookEntrySourceLite(stored.extractSource),
	metadata: blobMetadataVersioned
		.getUnknownSerializer()
		.deserialize(stored.metadata),
})

const serializeAbookEntryAggregateData = (
	aggregate: AbookEntryAggregateData,
): AbookEntryAggregateDataStoredV1 => ({
	metadata: aggregate.metadata
		? serializeAbookEntryMetadata(aggregate.metadata)
		: null,
	blobSize: aggregate.blobSize,
})

const deserializeAbookEntryAggregateData = (
	stored: AbookEntryAggregateDataStoredV1,
): AbookEntryAggregateData => ({
	metadata: stored.metadata
		? deserializeAbookEntryMetadata(stored.metadata)
		: null,
	blobSize: stored.blobSize,
})

export const AbookEntryAggregateDataVersionedType = new VersionedType<
	{
		1: AbookEntryAggregateDataStoredV1
	},
	AbookEntryAggregateData
>({
	serializer: (owned: AbookEntryAggregateData) => ({
		version: 1 as const,
		data: serializeAbookEntryAggregateData(owned),
	}),
	deserializer: {
		1: {
			schema: abookEntryAggregateDataStoredV1Schema,
			deserializer: (
				stored: AbookEntryAggregateDataStoredV1,
			): AbookEntryAggregateData =>
				deserializeAbookEntryAggregateData(stored),
		},
	},
})
