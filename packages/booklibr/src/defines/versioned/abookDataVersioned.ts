import { Timestamp } from "@teawithsand/lngext"
import { VersionedType } from "@teawithsand/reserd"
import { z } from "zod"
import { AbookData } from "../abook"
import { AbookEntryVersionedType } from "./abookEntryVersioned"
import {
	AbookPositionStoredV1,
	abookPositionStoredV1Schema,
	AbookUserMetadataStoredV1,
	abookUserMetadataStoredV1Schema,
	translateIdFromStored,
	translateIdToStored,
} from "./common"

// Import the entry stored schema from the entry versioned file
const abookEntryDataStoredV1Schema = z.object({
	createdAt: z.number(),
	disposition: z.number(),
	source: z.discriminatedUnion("type", [
		z.object({
			type: z.literal(0),
			uploadedAt: z.number(),
			uploadFileName: z.string(),
			uploadFileMime: z.string(),
		}),
		z.object({
			type: z.literal(1),
			url: z.string(),
		}),
	]),
})

const abookEntryAggregateDataStoredV1Schema = z.object({
	metadata: z
		.object({
			extractTimestamp: z.number(),
			extractSource: z.discriminatedUnion("type", [
				z.object({
					type: z.literal(0),
				}),
				z.object({
					type: z.literal(1),
					url: z.string(),
				}),
			]),
			metadata: z.object({
				image: z.discriminatedUnion("type", [
					z.object({
						type: z.literal(1),
						metadata: z.object({
							width: z.number(),
							height: z.number(),
						}),
					}),
					z.object({
						type: z.literal(0),
						error: z.string(),
					}),
				]),
				audio: z.discriminatedUnion("type", [
					z.object({
						type: z.literal(1),
						metadata: z.object({
							duration: z.number(),
						}),
					}),
					z.object({
						type: z.literal(0),
						error: z.string(),
					}),
				]),
			}),
		})
		.nullable(),
	blobSize: z.number().nullable(),
})

const abookEntryStoredV1Schema = z.object({
	data: abookEntryDataStoredV1Schema,
	aggregate: abookEntryAggregateDataStoredV1Schema,
})

// Stored types for version 1
type AbookHeaderDataStoredV1 = {
	createdAt: number
	metadata: AbookUserMetadataStoredV1
	position: AbookPositionStoredV1 | null
}

type AbookDataStoredV1 = {
	header: AbookHeaderDataStoredV1
	entries: Array<{
		id: string
		entry: z.infer<typeof abookEntryStoredV1Schema>
	}>
}

// Versioned data types
type AbookDataVersionedData = {
	1: AbookDataStoredV1
}

// Zod schemas
const abookHeaderDataStoredV1Schema = z.object({
	createdAt: z.number(),
	metadata: abookUserMetadataStoredV1Schema,
	position: abookPositionStoredV1Schema.nullable(),
})

const abookDataStoredV1Schema = z.object({
	header: abookHeaderDataStoredV1Schema,
	entries: z.array(
		z.object({
			id: z.string(),
			entry: abookEntryStoredV1Schema,
		}),
	),
})

/**
 * VersionedType for AbookData, supporting migration and serialization between versions.
 * Handles translation between owned and stored representations.
 */
export const AbookDataVersionedType = new VersionedType<
	AbookDataVersionedData,
	AbookData
>({
	serializer: (owned: AbookData) => ({
		version: 1 as const,
		data: {
			header: {
				createdAt: owned.header.createdAt.toNumberMillis(),
				metadata: {
					title: owned.header.metadata.title,
					description: owned.header.metadata.description,
					privateUserNote: owned.header.metadata.privateUserNote,
				},
				position: owned.header.position
					? {
							entryId: translateIdToStored(
								owned.header.position.entryId,
							),
							entryOffsetMillis:
								owned.header.position.entryOffsetMillis,
							globalOffsetMillis:
								owned.header.position.globalOffsetMillis,
						}
					: null,
			},
			entries: Array.from(owned.entries.entries()).map(([id, entry]) => ({
				id: translateIdToStored(id),
				entry: AbookEntryVersionedType.serialize(entry).data,
			})),
		},
	}),
	deserializer: {
		1: {
			schema: abookDataStoredV1Schema,
			deserializer: (data: AbookDataStoredV1): AbookData => ({
				header: {
					createdAt: Timestamp.fromNumber(data.header.createdAt),
					metadata: {
						title: data.header.metadata.title,
						description: data.header.metadata.description,
						privateUserNote: data.header.metadata.privateUserNote,
					},
					position: data.header.position
						? {
								entryId: translateIdFromStored(
									data.header.position.entryId,
								),
								entryOffsetMillis:
									data.header.position.entryOffsetMillis,
								globalOffsetMillis:
									data.header.position.globalOffsetMillis,
							}
						: null,
				},
				entries: new Map(
					data.entries.map(({ id, entry }) => [
						translateIdFromStored(id) as string,
						AbookEntryVersionedType.deserializeKnown({
							version: 1,
							data: entry,
						}),
					]),
				),
			}),
		},
	},
})

// Type aliases for any version (union types)
export type AbookDataStored = z.infer<typeof AbookDataVersionedType.schema>

// Schema aliases for any version
export const AbookDataStoredSchema = AbookDataVersionedType.schema
