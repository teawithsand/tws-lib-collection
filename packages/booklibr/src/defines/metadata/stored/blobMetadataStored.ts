import { SimpleSerializedError, VersionedType } from "@teawithsand/reserd"
import { z } from "zod"
import {
	BlobAudioMetadata,
	BlobImageMetadata,
	BlobMetadata,
	BlobMetadataResult,
	BlobMetadataResultType,
} from "../metadata"

export enum AbookEntryBlobTypeStoredV1 {
	IMAGE = "image",
	AUDIO = "audio",
	UNKNOWN = "unknown",
}

export enum BlobMetadataResultTypeStoredV1 {
	ERROR = "error",
	SUCCESS = "success",
}

// Version 1 stored types
export type BlobImageMetadataStoredV1 = {
	width: number
	height: number
}

export type BlobAudioMetadataStoredV1 = {
	duration: number
}

export type BlobMetadataResultStoredV1<T> =
	| {
			type: BlobMetadataResultTypeStoredV1.SUCCESS
			metadata: T
	  }
	| {
			type: BlobMetadataResultTypeStoredV1.ERROR
			error: ReturnType<typeof SimpleSerializedError.serializer.serialize>
	  }

export type BlobMetadataStoredV1 = {
	image: BlobMetadataResultStoredV1<BlobImageMetadataStoredV1>
	audio: BlobMetadataResultStoredV1<BlobAudioMetadataStoredV1>
}

// Zod schemas for version 1
const blobImageMetadataStoredV1Schema = z.object({
	width: z.number(),
	height: z.number(),
})

const blobAudioMetadataStoredV1Schema = z.object({
	duration: z.number(),
})

const blobMetadataResultStoredV1Schema = <T extends z.ZodTypeAny>(
	metadataSchema: T,
) =>
	z.discriminatedUnion("type", [
		z.object({
			type: z.literal(BlobMetadataResultTypeStoredV1.SUCCESS),
			metadata: metadataSchema,
		}),
		z.object({
			type: z.literal(BlobMetadataResultTypeStoredV1.ERROR),
			error: SimpleSerializedError.schema,
		}),
	])

const blobMetadataStoredV1Schema = z.object({
	image: blobMetadataResultStoredV1Schema(blobImageMetadataStoredV1Schema),
	audio: blobMetadataResultStoredV1Schema(blobAudioMetadataStoredV1Schema),
})

// Helper functions for converting result types
const serializeBlobMetadataResult = <TOwned, TStored>(
	result: BlobMetadataResult<TOwned>,
	serializeMetadata: (metadata: TOwned) => TStored,
): BlobMetadataResultStoredV1<TStored> => {
	switch (result.type) {
		case BlobMetadataResultType.SUCCESS:
			return {
				type: BlobMetadataResultTypeStoredV1.SUCCESS,
				metadata: serializeMetadata(result.metadata),
			}
		case BlobMetadataResultType.ERROR:
			return {
				type: BlobMetadataResultTypeStoredV1.ERROR,
				error: SimpleSerializedError.serializer.serialize(result.error),
			}
	}
}

const deserializeBlobMetadataResult = <TOwned, TStored>(
	stored: BlobMetadataResultStoredV1<TStored>,
	deserializeMetadata: (metadata: TStored) => TOwned,
): BlobMetadataResult<TOwned> => {
	switch (stored.type) {
		case BlobMetadataResultTypeStoredV1.SUCCESS:
			return {
				type: BlobMetadataResultType.SUCCESS,
				metadata: deserializeMetadata(stored.metadata),
			}
		case BlobMetadataResultTypeStoredV1.ERROR:
			return {
				type: BlobMetadataResultType.ERROR,
				error: SimpleSerializedError.serializer.deserialize(
					stored.error,
				),
			}
	}
}

export const blobMetadataVersioned = new VersionedType<
	{
		1: BlobMetadataStoredV1
	},
	BlobMetadata
>({
	serializer: (owned: BlobMetadata) => ({
		version: 1 as const,
		data: {
			image: serializeBlobMetadataResult(
				owned.image,
				(metadata: BlobImageMetadata): BlobImageMetadataStoredV1 => ({
					width: metadata.width,
					height: metadata.height,
				}),
			),
			audio: serializeBlobMetadataResult(
				owned.audio,
				(metadata: BlobAudioMetadata): BlobAudioMetadataStoredV1 => ({
					duration: metadata.duration,
				}),
			),
		},
	}),
	deserializer: {
		1: {
			schema: blobMetadataStoredV1Schema,
			deserializer: (stored: BlobMetadataStoredV1): BlobMetadata => ({
				image: deserializeBlobMetadataResult(
					stored.image,
					(
						metadata: BlobImageMetadataStoredV1,
					): BlobImageMetadata => ({
						width: metadata.width,
						height: metadata.height,
					}),
				),
				audio: deserializeBlobMetadataResult(
					stored.audio,
					(
						metadata: BlobAudioMetadataStoredV1,
					): BlobAudioMetadata => ({
						duration: metadata.duration,
					}),
				),
			}),
		},
	},
})
