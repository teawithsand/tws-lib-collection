import { Result } from "../../utils/result"
import { SerializedError } from "../misc/error"
import { ABookEntryLocator } from "./locator"

export type ABookEntryUploadMetadata = {
	fileName: string | null
	lastModifiedTimestamp: number | null
	fileSize: number
	path: string | null
}

export enum ABookEntryDisposition {
	AUDIO = 1,
	IMAGE = 2,
	DESCRIPTION = 3,
}

export type ABookEntryAudioMetadata = {
	duration: Result<number, SerializedError>
}

export type ABookEntryMetadata = {
	uploadMetadata: ABookEntryUploadMetadata | null
	audioMetadata: ABookEntryAudioMetadata | null
}

export type ABookEntry = {
	disposition: ABookEntryDisposition
	metadata: ABookEntryMetadata
	locator: ABookEntryLocator
}
