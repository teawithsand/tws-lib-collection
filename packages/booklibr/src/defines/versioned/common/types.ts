import { z } from "zod"
import {
	AbookEntrySourceTypeStored,
	BlobMetadataResultTypeStored,
} from "./enums"

// Common stored types used across multiple versioned types
export type AbookEntrySourceLiteStoredV1 =
	| {
			type: AbookEntrySourceTypeStored.UPLOAD
	  }
	| {
			type: AbookEntrySourceTypeStored.URL
			url: string
	  }

export type AbookEntrySourceFullStoredV1 =
	| {
			type: AbookEntrySourceTypeStored.UPLOAD
			uploadedAt: number
			uploadFileName: string
			uploadFileMime: string
	  }
	| {
			type: AbookEntrySourceTypeStored.URL
			url: string
	  }

export type BlobMetadataResultStoredV1<T> =
	| {
			type: BlobMetadataResultTypeStored.SUCCESS
			metadata: T
	  }
	| {
			type: BlobMetadataResultTypeStored.ERROR
			error: string
	  }

export type BlobImageMetadataStoredV1 = {
	width: number
	height: number
}

export type BlobAudioMetadataStoredV1 = {
	duration: number
}

export type BlobMetadataStoredV1 = {
	image: BlobMetadataResultStoredV1<BlobImageMetadataStoredV1>
	audio: BlobMetadataResultStoredV1<BlobAudioMetadataStoredV1>
}

export type AbookEntryMetadataStoredV1 = {
	extractTimestamp: number
	extractSource: AbookEntrySourceLiteStoredV1
	metadata: BlobMetadataStoredV1
}

export type AbookPositionStoredV1 = {
	entryId: string
	entryOffsetMillis: number
	globalOffsetMillis: number
}

export type AbookUserMetadataStoredV1 = {
	title: string
	description: string
	privateUserNote: string
}

// Common schemas
export const abookEntrySourceLiteStoredV1Schema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal(AbookEntrySourceTypeStored.UPLOAD),
	}),
	z.object({
		type: z.literal(AbookEntrySourceTypeStored.URL),
		url: z.string(),
	}),
])

export const abookEntrySourceFullStoredV1Schema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal(AbookEntrySourceTypeStored.UPLOAD),
		uploadedAt: z.number(),
		uploadFileName: z.string(),
		uploadFileMime: z.string(),
	}),
	z.object({
		type: z.literal(AbookEntrySourceTypeStored.URL),
		url: z.string(),
	}),
])

export const blobImageMetadataStoredV1Schema = z.object({
	width: z.number(),
	height: z.number(),
})

export const blobAudioMetadataStoredV1Schema = z.object({
	duration: z.number(),
})

export const blobMetadataResultStoredV1Schema = <T>(
	metadataSchema: z.ZodType<T>,
) =>
	z.discriminatedUnion("type", [
		z.object({
			type: z.literal(BlobMetadataResultTypeStored.SUCCESS),
			metadata: metadataSchema,
		}),
		z.object({
			type: z.literal(BlobMetadataResultTypeStored.ERROR),
			error: z.string(),
		}),
	])

export const blobMetadataStoredV1Schema = z.object({
	image: blobMetadataResultStoredV1Schema(blobImageMetadataStoredV1Schema),
	audio: blobMetadataResultStoredV1Schema(blobAudioMetadataStoredV1Schema),
})

export const abookEntryMetadataStoredV1Schema = z.object({
	extractTimestamp: z.number(),
	extractSource: abookEntrySourceLiteStoredV1Schema,
	metadata: blobMetadataStoredV1Schema,
})

export const abookPositionStoredV1Schema = z.object({
	entryId: z.string(),
	entryOffsetMillis: z.number(),
	globalOffsetMillis: z.number(),
})

export const abookUserMetadataStoredV1Schema = z.object({
	title: z.string(),
	description: z.string(),
	privateUserNote: z.string(),
})
