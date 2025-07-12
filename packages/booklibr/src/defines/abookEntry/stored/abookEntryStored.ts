import { VersionedType, VersionedTypeInfer } from "@teawithsand/reserd"
import { z } from "zod"
import { AbookEntry } from "../../abookEntry"
import {
	AbookEntryAggregateDataVersionedType,
	AbookEntryDataVersionedType,
} from "../../abookEntry/stored"

// Stored types for V1
type AbookEntryStoredV1 = {
	data: VersionedTypeInfer<typeof AbookEntryDataVersionedType>
	aggregate: VersionedTypeInfer<typeof AbookEntryAggregateDataVersionedType>
}

// Zod schemas for V1
const abookEntryStoredV1Schema = z.object({
	data: AbookEntryDataVersionedType.schema,
	aggregate: AbookEntryAggregateDataVersionedType.schema,
})

// Helper functions for conversion
const serializeAbookEntry = (entry: AbookEntry): AbookEntryStoredV1 => ({
	data: AbookEntryDataVersionedType.serialize(entry.data),
	aggregate: AbookEntryAggregateDataVersionedType.serialize(entry.aggregate),
})

const deserializeAbookEntry = (stored: AbookEntryStoredV1): AbookEntry => {
	return new AbookEntry({
		data: AbookEntryDataVersionedType.getUnknownSerializer().deserialize(
			stored.data,
		),
		aggregate:
			AbookEntryAggregateDataVersionedType.getUnknownSerializer().deserialize(
				stored.aggregate,
			),
	})
}

export const AbookEntryVersionedType = new VersionedType<
	{
		1: AbookEntryStoredV1
	},
	AbookEntry
>({
	serializer: (owned: AbookEntry) => ({
		version: 1 as const,
		data: serializeAbookEntry(owned),
	}),
	deserializer: {
		1: {
			schema: abookEntryStoredV1Schema,
			deserializer: (stored: AbookEntryStoredV1): AbookEntry =>
				deserializeAbookEntry(stored),
		},
	},
})
