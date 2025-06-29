import { Timestamp } from "@teawithsand/lngext"
import { VersionedType } from "@teawithsand/reserd"
import { z } from "zod"
import { AbookHeaderData } from "../abook"
import {
	AbookPositionStoredV1,
	abookPositionStoredV1Schema,
	AbookUserMetadataStoredV1,
	abookUserMetadataStoredV1Schema,
	translateIdFromStored,
	translateIdToStored,
} from "./common"

// Stored types for version 1
type AbookHeaderDataStoredV1 = {
	createdAt: number
	metadata: AbookUserMetadataStoredV1
	position: AbookPositionStoredV1 | null
}

// Versioned data types
type AbookHeaderDataVersionedData = {
	1: AbookHeaderDataStoredV1
}

// Zod schemas
const abookHeaderDataStoredV1Schema = z.object({
	createdAt: z.number(),
	metadata: abookUserMetadataStoredV1Schema,
	position: abookPositionStoredV1Schema.nullable(),
})

/**
 * VersionedType for AbookHeaderData, supporting migration and serialization between versions.
 * Handles translation between owned and stored representations.
 */
export const AbookHeaderDataVersionedType = new VersionedType<
	AbookHeaderDataVersionedData,
	AbookHeaderData
>({
	serializer: (owned: AbookHeaderData) => ({
		version: 1 as const,
		data: {
			createdAt: owned.createdAt.toNumberMillis(),
			metadata: {
				title: owned.metadata.title,
				description: owned.metadata.description,
				privateUserNote: owned.metadata.privateUserNote,
			},
			position: owned.position
				? {
						entryId: translateIdToStored(owned.position.entryId),
						entryOffsetMillis: owned.position.entryOffsetMillis,
						globalOffsetMillis: owned.position.globalOffsetMillis,
					}
				: null,
		},
	}),
	deserializer: {
		1: {
			schema: abookHeaderDataStoredV1Schema,
			deserializer: (data: AbookHeaderDataStoredV1): AbookHeaderData => ({
				createdAt: Timestamp.fromNumber(data.createdAt),
				metadata: {
					title: data.metadata.title,
					description: data.metadata.description,
					privateUserNote: data.metadata.privateUserNote,
				},
				position: data.position
					? {
							entryId: translateIdFromStored(
								data.position.entryId,
							),
							entryOffsetMillis: data.position.entryOffsetMillis,
							globalOffsetMillis:
								data.position.globalOffsetMillis,
						}
					: null,
			}),
		},
	},
})

// Type aliases for any version (union types)
export type AbookHeaderDataStored = z.infer<
	typeof AbookHeaderDataVersionedType.schema
>

// Schema aliases for any version
export const AbookHeaderDataStoredSchema = AbookHeaderDataVersionedType.schema
