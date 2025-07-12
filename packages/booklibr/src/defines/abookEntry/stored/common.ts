import { z } from "zod"

/**
 * Stored enum for abook entry source types - V1
 */
export enum AbookEntrySourceTypeStoredV1 {
	UPLOAD = "upload",
	URL = "url",
}

/**
 * Stored type for abook entry source (lite version) - V1
 */
export type AbookEntrySourceLiteStoredV1 =
	| {
			type: AbookEntrySourceTypeStoredV1.UPLOAD
	  }
	| {
			type: AbookEntrySourceTypeStoredV1.URL
			url: string
	  }

/**
 * Stored type for abook entry source (full version) - V1
 */
export type AbookEntrySourceFullStoredV1 =
	| {
			type: AbookEntrySourceTypeStoredV1.UPLOAD
			uploadedAt: number
			uploadFileName: string
			uploadFileMime: string
	  }
	| {
			type: AbookEntrySourceTypeStoredV1.URL
			url: string
	  }

/**
 * Zod schema for abook entry source (lite version) - V1
 */
export const abookEntrySourceLiteStoredV1Schema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal(AbookEntrySourceTypeStoredV1.UPLOAD),
	}),
	z.object({
		type: z.literal(AbookEntrySourceTypeStoredV1.URL),
		url: z.string(),
	}),
])

/**
 * Zod schema for abook entry source (full version) - V1
 */
export const abookEntrySourceFullStoredV1Schema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal(AbookEntrySourceTypeStoredV1.UPLOAD),
		uploadedAt: z.number(),
		uploadFileName: z.string(),
		uploadFileMime: z.string(),
	}),
	z.object({
		type: z.literal(AbookEntrySourceTypeStoredV1.URL),
		url: z.string(),
	}),
])
