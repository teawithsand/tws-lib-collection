import { Timestamp } from "@teawithsand/lngext"
import { BlobMetadata } from "../metadata/metadata"
import { AbookEntrySourceFull, AbookEntrySourceLite } from "./entrySource"

export enum AbookEntryDisposition {
	PLAYABLE_AUDIO = "playable-audio",
	COVER_IMAGE = "cover-image",
}

export type AbookEntryMetadata = {
	extractTimestamp: Timestamp
	extractSource: AbookEntrySourceLite
	metadata: BlobMetadata
}

export type AbookEntryAggregateData = {
	/**
	 * Metadata of the entry, null if not loaded.
	 */
	metadata: AbookEntryMetadata | null

	/**
	 * Size of the blob in bytes, null if it does not exist.
	 */
	blobSize: number | null
}

export type AbookEntryData = {
	createdAt: Timestamp

	disposition: AbookEntryDisposition
	source: AbookEntrySourceFull
}
