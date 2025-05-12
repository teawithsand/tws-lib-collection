export enum PlayerEntryType {
	BLOB = "blob",
	URL = "url",
}

export type PlayerEntry =
	| { type: PlayerEntryType.BLOB; blob: Blob }
	| { type: PlayerEntryType.URL; url: string }
