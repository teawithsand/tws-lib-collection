import { TypeAssert } from "@teawithsand/lngext"
import {
	AbookEntryDisposition,
	AbookEntrySourceFull,
	AbookEntrySourceLite,
	AbookEntrySourceType,
} from "../../abookEntry"
import { Id } from "../../id"
import {
	BlobAudioMetadata,
	BlobImageMetadata,
	BlobMetadata,
	BlobMetadataResult,
	BlobMetadataResultType,
} from "../../metadata/metadata"
import {
	AbookEntryDispositionStored,
	AbookEntrySourceTypeStored,
	BlobMetadataResultTypeStored,
} from "./enums"
import {
	AbookEntrySourceFullStoredV1,
	AbookEntrySourceLiteStoredV1,
	BlobAudioMetadataStoredV1,
	BlobImageMetadataStoredV1,
	BlobMetadataResultStoredV1,
	BlobMetadataStoredV1,
} from "./types"

// Translation functions for common types
export const translateDispositionToStored = (
	disposition: AbookEntryDisposition,
): AbookEntryDispositionStored => {
	switch (disposition) {
		case AbookEntryDisposition.PLAYABLE_AUDIO:
			return AbookEntryDispositionStored.PLAYABLE_AUDIO
		case AbookEntryDisposition.COVER_IMAGE:
			return AbookEntryDispositionStored.COVER_IMAGE
		default:
			TypeAssert.assertNever(disposition)
			return TypeAssert.unreachable()
	}
}

export const translateDispositionFromStored = (
	disposition: AbookEntryDispositionStored,
): AbookEntryDisposition => {
	switch (disposition) {
		case AbookEntryDispositionStored.PLAYABLE_AUDIO:
			return AbookEntryDisposition.PLAYABLE_AUDIO
		case AbookEntryDispositionStored.COVER_IMAGE:
			return AbookEntryDisposition.COVER_IMAGE
		default:
			TypeAssert.assertNever(disposition)
			return TypeAssert.unreachable()
	}
}

export const translateSourceLiteToStored = (
	source: AbookEntrySourceLite,
): AbookEntrySourceLiteStoredV1 => {
	switch (source.type) {
		case AbookEntrySourceType.UPLOAD:
			return {
				type: AbookEntrySourceTypeStored.UPLOAD,
			}
		case AbookEntrySourceType.URL:
			return {
				type: AbookEntrySourceTypeStored.URL,
				url: source.url,
			}
		default:
			TypeAssert.assertNever(source)
			return TypeAssert.unreachable()
	}
}

export const translateSourceLiteFromStored = (
	source: AbookEntrySourceLiteStoredV1,
): AbookEntrySourceLite => {
	switch (source.type) {
		case AbookEntrySourceTypeStored.UPLOAD:
			return {
				type: AbookEntrySourceType.UPLOAD,
			}
		case AbookEntrySourceTypeStored.URL:
			return {
				type: AbookEntrySourceType.URL,
				url: source.url,
			}
		default:
			TypeAssert.assertNever(source)
			return TypeAssert.unreachable()
	}
}

export const translateSourceFullToStored = (
	source: AbookEntrySourceFull,
): AbookEntrySourceFullStoredV1 => {
	switch (source.type) {
		case AbookEntrySourceType.UPLOAD:
			return {
				type: AbookEntrySourceTypeStored.UPLOAD,
				uploadedAt: source.uploadedAt,
				uploadFileName: source.uploadFileName,
				uploadFileMime: source.uploadFileMime,
			}
		case AbookEntrySourceType.URL:
			return {
				type: AbookEntrySourceTypeStored.URL,
				url: source.url,
			}
		default:
			TypeAssert.assertNever(source)
			return TypeAssert.unreachable()
	}
}

export const translateSourceFullFromStored = (
	source: AbookEntrySourceFullStoredV1,
): AbookEntrySourceFull => {
	switch (source.type) {
		case AbookEntrySourceTypeStored.UPLOAD:
			return {
				type: AbookEntrySourceType.UPLOAD,
				uploadedAt: source.uploadedAt,
				uploadFileName: source.uploadFileName,
				uploadFileMime: source.uploadFileMime,
			}
		case AbookEntrySourceTypeStored.URL:
			return {
				type: AbookEntrySourceType.URL,
				url: source.url,
			}
		default:
			TypeAssert.assertNever(source)
			return TypeAssert.unreachable()
	}
}

export const translateBlobMetadataResultToStored = <T, S>(
	result: BlobMetadataResult<T>,
	translateMetadata: (metadata: T) => S,
): BlobMetadataResultStoredV1<S> => {
	switch (result.type) {
		case BlobMetadataResultType.SUCCESS:
			return {
				type: BlobMetadataResultTypeStored.SUCCESS,
				metadata: translateMetadata(result.metadata),
			}
		case BlobMetadataResultType.ERROR:
			return {
				type: BlobMetadataResultTypeStored.ERROR,
				error: result.error,
			}
		default:
			TypeAssert.assertNever(result)
			return TypeAssert.unreachable()
	}
}

export const translateBlobMetadataResultFromStored = <T, S>(
	result: BlobMetadataResultStoredV1<S>,
	translateMetadata: (metadata: S) => T,
): BlobMetadataResult<T> => {
	switch (result.type) {
		case BlobMetadataResultTypeStored.SUCCESS:
			return {
				type: BlobMetadataResultType.SUCCESS,
				metadata: translateMetadata(result.metadata),
			}
		case BlobMetadataResultTypeStored.ERROR:
			return {
				type: BlobMetadataResultType.ERROR,
				error: result.error,
			}
		default:
			TypeAssert.assertNever(result)
			return TypeAssert.unreachable()
	}
}

export const translateBlobImageMetadataToStored = (
	metadata: BlobImageMetadata,
): BlobImageMetadataStoredV1 => ({
	width: metadata.width,
	height: metadata.height,
})

export const translateBlobImageMetadataFromStored = (
	metadata: BlobImageMetadataStoredV1,
): BlobImageMetadata => ({
	width: metadata.width,
	height: metadata.height,
})

export const translateBlobAudioMetadataToStored = (
	metadata: BlobAudioMetadata,
): BlobAudioMetadataStoredV1 => ({
	duration: metadata.duration,
})

export const translateBlobAudioMetadataFromStored = (
	metadata: BlobAudioMetadataStoredV1,
): BlobAudioMetadata => ({
	duration: metadata.duration,
})

export const translateBlobMetadataToStored = (
	metadata: BlobMetadata,
): BlobMetadataStoredV1 => ({
	image: translateBlobMetadataResultToStored(
		metadata.image,
		translateBlobImageMetadataToStored,
	),
	audio: translateBlobMetadataResultToStored(
		metadata.audio,
		translateBlobAudioMetadataToStored,
	),
})

export const translateBlobMetadataFromStored = (
	metadata: BlobMetadataStoredV1,
): BlobMetadata => ({
	image: translateBlobMetadataResultFromStored(
		metadata.image,
		translateBlobImageMetadataFromStored,
	),
	audio: translateBlobMetadataResultFromStored(
		metadata.audio,
		translateBlobAudioMetadataFromStored,
	),
})

export const translateIdToStored = (id: Id): string => {
	return id.toString()
}

export const translateIdFromStored = (id: string): Id => {
	return id
}
