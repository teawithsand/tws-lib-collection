import { VersionedType } from "@teawithsand/reserd"
import { z } from "zod"
import { AbookAggregateData } from "../abook"

// Stored types for version 1
type AbookAggregateDataStoredV1 = {
	totalDurationMillis: number
	totalEntries: number
}

// Versioned data types
type AbookAggregateDataVersionedData = {
	1: AbookAggregateDataStoredV1
}

// Zod schemas
const abookAggregateDataStoredV1Schema = z.object({
	totalDurationMillis: z.number(),
	totalEntries: z.number(),
})

/**
 * VersionedType for AbookAggregateData, supporting migration and serialization between versions.
 * Handles translation between owned and stored representations.
 */
export const AbookAggregateDataVersionedType = new VersionedType<
	AbookAggregateDataVersionedData,
	AbookAggregateData
>({
	serializer: (owned: AbookAggregateData) => ({
		version: 1 as const,
		data: {
			totalDurationMillis: owned.totalDurationMillis,
			totalEntries: owned.totalEntries,
		},
	}),
	deserializer: {
		1: {
			schema: abookAggregateDataStoredV1Schema,
			deserializer: (
				data: AbookAggregateDataStoredV1,
			): AbookAggregateData => ({
				totalDurationMillis: data.totalDurationMillis,
				totalEntries: data.totalEntries,
			}),
		},
	},
})

// Type aliases for any version (union types)
export type AbookAggregateDataStored = z.infer<
	typeof AbookAggregateDataVersionedType.schema
>

// Schema aliases for any version
export const AbookAggregateDataStoredSchema =
	AbookAggregateDataVersionedType.schema
