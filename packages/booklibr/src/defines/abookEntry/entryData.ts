import { Timestamp } from "@teawithsand/lngext"
import { BlobMetadata } from "../metadata/metadata"
import { AbookEntrySourceFull, AbookEntrySourceLite } from "./entrySource"

/**
 * Defines the purpose and content type of an audiobook entry.
 */
export enum AbookEntryDisposition {
	/** Audio content that can be played */
	PLAYABLE_AUDIO = "playable-audio",
	/** Cover or illustration image */
	COVER_IMAGE = "cover-image",
	/** Text description or summary */
	DESCRIPTION = "description",
	/** Entry with unknown or unrecognized content type */
	UNKNOWN = "unknown",
}

/**
 * Metadata about when and how an entry's content was extracted.
 */
export type AbookEntryMetadata = {
	/** Timestamp when the metadata was extracted */
	extractTimestamp: Timestamp
	/** Source information about where the entry originated */
	extractSource: AbookEntrySourceLite
	/** Parsed blob metadata containing format-specific information */
	metadata: BlobMetadata
}

/**
 * Runtime data about an audiobook entry that can change over time.
 */
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

/**
 * Core data for an audiobook entry.
 */
export type AbookEntryData = {
	/** Timestamp when the entry was created */
	createdAt: Timestamp

	/** Human-readable name for the entry */
	name: string

	/** The type and purpose of this entry's content */
	disposition: AbookEntryDisposition
	/** Complete source information including origin details */
	source: AbookEntrySourceFull
	/** Position in the audiobook's entry sequence */
	ordinalNumber: number
}
