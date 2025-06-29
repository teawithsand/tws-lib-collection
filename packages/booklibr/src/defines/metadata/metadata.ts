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
			error: string
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
