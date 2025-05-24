import { z } from "zod"
import { StoredABookTruthSourceSchema } from "../abook/stored"
import { StoredABookEntrySchema } from "../entry/stored"
import { StoredLanguageSchema } from "../misc/stored"

// Metadata V1 schema
const StoredABookMetadataV1Schema = z.object({
	version: z.literal(1),
	title: z.string(),
	author: z.string(),
	description: z.string(),
	language: StoredLanguageSchema,
})

// Header V1 schema
const StoredABookHeaderV1Schema = z.object({
	version: z.literal(1),
	metadata: StoredABookMetadataV1Schema,
	truthSource: StoredABookTruthSourceSchema,
})

// Stored ABook V1 schema
export const StoredABookV1Schema = z.object({
	version: z.literal(1),
	header: StoredABookHeaderV1Schema,
	entries: z.array(StoredABookEntrySchema),
})
