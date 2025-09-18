import { Timestamp, TypeAssert } from "@teawithsand/lngext"
import { VersionedType } from "@teawithsand/reserd"
import { z } from "zod"
import { AbookEntryData, AbookEntryDisposition } from "../entryData"
import { AbookEntrySourceFull, AbookEntrySourceType } from "../entrySource"
import {
	AbookEntrySourceFullStoredV1,
	abookEntrySourceFullStoredV1Schema,
	AbookEntrySourceTypeStoredV1,
} from "./common"

// Stored enums for V1
export enum AbookEntryDispositionStoredV1 {
	PLAYABLE_AUDIO = "playable-audio",
	COVER_IMAGE = "cover-image",
	DESCRIPTION = "description",
	UNKNOWN = "unknown",
}

export type AbookEntryDataStoredV1 = {
	createdAt: number
	name: string
	disposition: AbookEntryDispositionStoredV1
	source: AbookEntrySourceFullStoredV1
	ordinalNumber: number
}

// Zod schemas for V1
const abookEntryDataStoredV1Schema = z.object({
	createdAt: z.number(),
	name: z.string(),
	disposition: z.nativeEnum(AbookEntryDispositionStoredV1),
	source: abookEntrySourceFullStoredV1Schema,
	ordinalNumber: z.number(),
})

// Helper functions for conversion
const serializeAbookEntryDisposition = (
	disposition: AbookEntryDisposition,
): AbookEntryDispositionStoredV1 => {
	switch (disposition) {
		case AbookEntryDisposition.PLAYABLE_AUDIO:
			return AbookEntryDispositionStoredV1.PLAYABLE_AUDIO
		case AbookEntryDisposition.COVER_IMAGE:
			return AbookEntryDispositionStoredV1.COVER_IMAGE
		case AbookEntryDisposition.DESCRIPTION:
			return AbookEntryDispositionStoredV1.DESCRIPTION
		case AbookEntryDisposition.UNKNOWN:
			return AbookEntryDispositionStoredV1.UNKNOWN
		default:
			throw new Error(`Unknown disposition: ${disposition}`)
	}
}

const deserializeAbookEntryDisposition = (
	stored: AbookEntryDispositionStoredV1,
): AbookEntryDisposition => {
	switch (stored) {
		case AbookEntryDispositionStoredV1.PLAYABLE_AUDIO:
			return AbookEntryDisposition.PLAYABLE_AUDIO
		case AbookEntryDispositionStoredV1.COVER_IMAGE:
			return AbookEntryDisposition.COVER_IMAGE
		case AbookEntryDispositionStoredV1.DESCRIPTION:
			return AbookEntryDisposition.DESCRIPTION
		case AbookEntryDispositionStoredV1.UNKNOWN:
			return AbookEntryDisposition.UNKNOWN
		default:
			throw new Error(`Unknown stored disposition: ${stored}`)
	}
}

const serializeAbookEntrySourceFull = (
	source: AbookEntrySourceFull,
): AbookEntrySourceFullStoredV1 => {
	switch (source.type) {
		case AbookEntrySourceType.UPLOAD:
			return {
				type: AbookEntrySourceTypeStoredV1.UPLOAD,
				uploadedAt: source.uploadedAt,
				uploadFileName: source.uploadFileName,
				uploadFileMime: source.uploadFileMime,
			}
		case AbookEntrySourceType.URL:
			return {
				type: AbookEntrySourceTypeStoredV1.URL,
				url: source.url,
			}
		default:
			TypeAssert.assertNever(source)
			return TypeAssert.unreachable()
	}
}

const deserializeAbookEntrySourceFull = (
	stored: AbookEntrySourceFullStoredV1,
): AbookEntrySourceFull => {
	switch (stored.type) {
		case AbookEntrySourceTypeStoredV1.UPLOAD:
			return {
				type: AbookEntrySourceType.UPLOAD,
				uploadedAt: stored.uploadedAt,
				uploadFileName: stored.uploadFileName,
				uploadFileMime: stored.uploadFileMime,
			}
		case AbookEntrySourceTypeStoredV1.URL:
			return {
				type: AbookEntrySourceType.URL,
				url: stored.url,
			}
		default:
			TypeAssert.assertNever(stored)
			return TypeAssert.unreachable()
	}
}

const serializeAbookEntryData = (
	entry: AbookEntryData,
): AbookEntryDataStoredV1 => ({
	createdAt: Timestamp.serializer.serialize(entry.createdAt),
	name: entry.name,
	disposition: serializeAbookEntryDisposition(entry.disposition),
	source: serializeAbookEntrySourceFull(entry.source),
	ordinalNumber: entry.ordinalNumber,
})

const deserializeAbookEntryData = (
	stored: AbookEntryDataStoredV1,
): AbookEntryData => ({
	createdAt: Timestamp.serializer.deserialize(stored.createdAt),
	name: stored.name,
	disposition: deserializeAbookEntryDisposition(stored.disposition),
	source: deserializeAbookEntrySourceFull(stored.source),
	ordinalNumber: stored.ordinalNumber,
})

export const AbookEntryDataVersionedType = new VersionedType<
	{
		1: AbookEntryDataStoredV1
	},
	AbookEntryData
>({
	serializer: (owned: AbookEntryData) => ({
		version: 1 as const,
		data: serializeAbookEntryData(owned),
	}),
	deserializer: {
		1: {
			schema: abookEntryDataStoredV1Schema,
			deserializer: (stored: AbookEntryDataStoredV1): AbookEntryData =>
				deserializeAbookEntryData(stored),
		},
	},
})
