import { Timestamp } from "@teawithsand/lngext"
import { VersionedType } from "@teawithsand/reserd"
import { z } from "zod"
import type {
	AbookHeaderData,
	AbookPosition,
	AbookUserMetadata,
} from "../abookData"

// Stored types for V1
type AbookPositionStoredV1 = {
	entryId: string | number
	entryOffsetMillis: number
	globalOffsetMillis: number
}

type AbookUserMetadataStoredV1 = {
	title: string
	description: string
	privateUserNote: string
}

type AbookHeaderDataStoredV1 = {
	createdAt: number
	metadata: AbookUserMetadataStoredV1
	position: AbookPositionStoredV1 | null
}

// Zod schemas for V1
const abookPositionStoredV1Schema = z.object({
	entryId: z.union([z.string(), z.number()]),
	entryOffsetMillis: z.number(),
	globalOffsetMillis: z.number(),
})

const abookUserMetadataStoredV1Schema = z.object({
	title: z.string(),
	description: z.string(),
	privateUserNote: z.string(),
})

const abookHeaderDataStoredV1Schema = z.object({
	createdAt: z.number(),
	metadata: abookUserMetadataStoredV1Schema,
	position: abookPositionStoredV1Schema.nullable(),
})

// Helper functions for conversion
const serializeAbookPosition = (
	position: AbookPosition,
): AbookPositionStoredV1 => ({
	entryId: position.entryId,
	entryOffsetMillis: position.entryOffsetMillis,
	globalOffsetMillis: position.globalOffsetMillis,
})

const deserializeAbookPosition = (
	stored: AbookPositionStoredV1,
): AbookPosition => ({
	entryId: stored.entryId,
	entryOffsetMillis: stored.entryOffsetMillis,
	globalOffsetMillis: stored.globalOffsetMillis,
})

const serializeAbookUserMetadata = (
	metadata: AbookUserMetadata,
): AbookUserMetadataStoredV1 => ({
	title: metadata.title,
	description: metadata.description,
	privateUserNote: metadata.privateUserNote,
})

const deserializeAbookUserMetadata = (
	stored: AbookUserMetadataStoredV1,
): AbookUserMetadata => ({
	title: stored.title,
	description: stored.description,
	privateUserNote: stored.privateUserNote,
})

const serializeAbookHeaderData = (
	header: AbookHeaderData,
): AbookHeaderDataStoredV1 => ({
	createdAt: Timestamp.serializer.serialize(header.createdAt),
	metadata: serializeAbookUserMetadata(header.metadata),
	position: header.position ? serializeAbookPosition(header.position) : null,
})

const deserializeAbookHeaderData = (
	stored: AbookHeaderDataStoredV1,
): AbookHeaderData => ({
	createdAt: Timestamp.serializer.deserialize(stored.createdAt),
	metadata: deserializeAbookUserMetadata(stored.metadata),
	position: stored.position
		? deserializeAbookPosition(stored.position)
		: null,
})

export const AbookHeaderDataVersionedType = new VersionedType<
	{
		1: AbookHeaderDataStoredV1
	},
	AbookHeaderData
>({
	serializer: (owned: AbookHeaderData) => ({
		version: 1 as const,
		data: serializeAbookHeaderData(owned),
	}),
	deserializer: {
		1: {
			schema: abookHeaderDataStoredV1Schema,
			deserializer: (stored: AbookHeaderDataStoredV1): AbookHeaderData =>
				deserializeAbookHeaderData(stored),
		},
	},
})
