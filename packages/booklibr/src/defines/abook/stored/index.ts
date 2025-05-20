import { z } from "zod"
import {
	ABookEntrySerializer,
	StoredABookEntrySchema,
} from "../../entry/stored"
import {
	LanguageSerializer,
	StoredLanguageSchema,
} from "../../misc/stored/language"
import type { ABook } from "../abook"
import { ABookTruthSource, ABookTruthSourceType } from "../truthSource"

// Stored enum for ABookTruthSourceType
export enum StoredABookTruthSourceTypeV1 {
	INTERNAL_STORAGE = 1,
}

export const StoredABookTruthSourceV1Schema = z.object({
	version: z.literal(1),
	type: z.nativeEnum(StoredABookTruthSourceTypeV1),
})
export type StoredABookTruthSourceV1 = z.infer<
	typeof StoredABookTruthSourceV1Schema
>
export type StoredABookTruthSource = StoredABookTruthSourceV1
export const StoredABookTruthSourceSchema = StoredABookTruthSourceV1Schema

export class ABookTruthSourceSerializer {
	private constructor() {}

	public static readonly serialize = (
		_input: ABookTruthSource,
	): StoredABookTruthSourceV1 => ({
		version: 1,
		type: StoredABookTruthSourceTypeV1.INTERNAL_STORAGE,
	})

	public static readonly deserialize = (
		_stored: StoredABookTruthSourceV1,
	): ABookTruthSource => ({
		type: ABookTruthSourceType.INTERNAL_STORAGE,
	})
}

// Metadata
export const StoredABookMetadataV1Schema = z.object({
	version: z.literal(1),
	title: z.string(),
	author: z.string(),
	description: z.string(),
	language: StoredLanguageSchema,
})
export type StoredABookMetadataV1 = z.infer<typeof StoredABookMetadataV1Schema>
export type StoredABookMetadata = StoredABookMetadataV1
export const StoredABookMetadataSchema = StoredABookMetadataV1Schema

// Header
export const StoredABookHeaderV1Schema = z.object({
	version: z.literal(1),
	metadata: StoredABookMetadataV1Schema,
	truthSource: StoredABookTruthSourceV1Schema,
})
export type StoredABookHeaderV1 = z.infer<typeof StoredABookHeaderV1Schema>
export type StoredABookHeader = StoredABookHeaderV1
export const StoredABookHeaderSchema = StoredABookHeaderV1Schema

// Book
export const StoredABookV1Schema = z.object({
	version: z.literal(1),
	header: StoredABookHeaderV1Schema,
	entries: z.array(StoredABookEntrySchema),
})
export type StoredABookV1 = z.infer<typeof StoredABookV1Schema>
export type StoredABook = StoredABookV1
export const StoredABookSchema = StoredABookV1Schema

// Serializer
export class ABookSerializer {
	private constructor() {}

	public static readonly serialize = (input: ABook): StoredABookV1 => ({
		version: 1,
		header: {
			version: 1,
			metadata: {
				version: 1,
				title: input.header.metadata.title,
				author: input.header.metadata.author,
				description: input.header.metadata.description,
				language: LanguageSerializer.serialize({
					language: input.header.metadata.language,
				}),
			},
			truthSource: ABookTruthSourceSerializer.serialize(
				input.header.truthSource,
			),
		},
		entries: input.entries.map(ABookEntrySerializer.serialize),
	})

	public static readonly deserialize = (stored: StoredABookV1): ABook => ({
		header: {
			metadata: {
				title: stored.header.metadata.title,
				author: stored.header.metadata.author,
				description: stored.header.metadata.description,
				language: LanguageSerializer.deserialize(
					stored.header.metadata.language,
				).language,
			},
			truthSource: ABookTruthSourceSerializer.deserialize(
				stored.header.truthSource,
			),
		},
		entries: stored.entries.map(ABookEntrySerializer.deserialize),
	})
}
