import { VersionedType } from "@teawithsand/reserd"
import { z } from "zod"
import type { AbookAggregateData } from "../abookData"

// V1 schema and type
const abookAggregateDataStoredV1Schema = z.object({
	totalDurationMillis: z.number(),
	totalEntries: z.number(),
})

type AbookAggregateDataStoredV1 = z.infer<
	typeof abookAggregateDataStoredV1Schema
>

// Helper functions for conversion
const serializeAbookAggregateData = (
	aggregate: AbookAggregateData,
): AbookAggregateDataStoredV1 => ({
	totalDurationMillis: aggregate.totalDurationMillis,
	totalEntries: aggregate.totalEntries,
})

const deserializeAbookAggregateData = (
	stored: AbookAggregateDataStoredV1,
): AbookAggregateData => ({
	totalDurationMillis: stored.totalDurationMillis,
	totalEntries: stored.totalEntries,
})

export const AbookAggregateDataVersionedType = new VersionedType<
	{
		1: AbookAggregateDataStoredV1
	},
	AbookAggregateData
>({
	serializer: (owned: AbookAggregateData) => ({
		version: 1 as const,
		data: serializeAbookAggregateData(owned),
	}),
	deserializer: {
		1: {
			schema: abookAggregateDataStoredV1Schema,
			deserializer: (
				stored: AbookAggregateDataStoredV1,
			): AbookAggregateData => deserializeAbookAggregateData(stored),
		},
	},
})
