import { SimpleSerializedError } from "@teawithsand/reserd"

export enum AbookEntryBlobType {
	IMAGE = "image",
	AUDIO = "audio",
	UNKNOWN = "unknown",
}

export enum BlobMetadataResultType {
	ERROR = "error",
	SUCCESS = "success",
}

export type BlobMetadataResult<T> =
	| {
			type: BlobMetadataResultType.SUCCESS
			metadata: T
	  }
	| {
			type: BlobMetadataResultType.ERROR
			/**
			 * For zod schema use SimpleSerializedError.schema
			 * For serialization use SimpleSerializedError.serialize
			 */
			error: SimpleSerializedError
	  }

export type BlobImageMetadata = {
	width: number
	height: number
}

export type BlobAudioMetadata = {
	duration: number
}

export type BlobMetadata = {
	image: BlobMetadataResult<BlobImageMetadata>
	audio: BlobMetadataResult<BlobAudioMetadata>
}
