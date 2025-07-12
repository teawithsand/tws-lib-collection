import { Timestamp } from "@teawithsand/lngext"
import { AbookEntry } from "../abookEntry"
import { Id } from "../id"

export type AbookPosition = {
	entryId: Id
	entryOffsetMillis: number

	globalOffsetMillis: number // Fallback to -1 if not set or known
}

export type AbookAggregateData = {
	/**
	 * Total duration of all audio entries in milliseconds.
	 * Contains -1 if any entry has invalid duration or loading error.
	 */
	totalDurationMillis: number

	/**
	 * Number of all entries, including non-audio entries.
	 */
	totalEntries: number
}

export type AbookUserMetadata = {
	title: string
	description: string

	privateUserNote: string
}

export type AbookUsageMetadata = {
	lastPlayedAt: Timestamp | null
}

export type AbookHeaderData = {
	createdAt: Timestamp

	metadata: AbookUserMetadata
	position: AbookPosition | null
}

export type AbookData = {
	header: AbookHeaderData
	entries: Map<string, AbookEntry>
}
