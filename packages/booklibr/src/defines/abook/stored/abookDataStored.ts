import { VersionedType, VersionedTypeInfer } from "@teawithsand/reserd"
import { z } from "zod"
import { AbookEntryVersionedType } from "../../abookEntry/stored"
import type { AbookData } from "../abookData"
import { AbookHeaderDataVersionedType } from "./abookHeaderDataStored"

// Stored types for V1
type AbookDataStoredV1 = {
	header: VersionedTypeInfer<typeof AbookHeaderDataVersionedType>
	entries: Record<string, VersionedTypeInfer<typeof AbookEntryVersionedType>>
}

// Zod schemas for V1
const abookDataStoredV1Schema = z.object({
	header: AbookHeaderDataVersionedType.schema,
	entries: z.record(z.string(), AbookEntryVersionedType.schema),
})

// Helper functions for conversion
const serializeAbookData = (data: AbookData): AbookDataStoredV1 => ({
	header: AbookHeaderDataVersionedType.serialize(data.header),
	entries: Object.fromEntries(
		Array.from(data.entries.entries()).map(([key, entry]) => [
			key,
			AbookEntryVersionedType.serialize(entry),
		]),
	),
})

const deserializeAbookData = (stored: AbookDataStoredV1): AbookData => ({
	header: AbookHeaderDataVersionedType.getUnknownSerializer().deserialize(
		stored.header,
	),
	entries: new Map(
		Object.entries(stored.entries).map(([key, entryStored]) => [
			key,
			AbookEntryVersionedType.getUnknownSerializer().deserialize(
				entryStored,
			),
		]),
	),
})

export const AbookDataVersionedType = new VersionedType<
	{
		1: AbookDataStoredV1
	},
	AbookData
>({
	serializer: (owned: AbookData) => ({
		version: 1 as const,
		data: serializeAbookData(owned),
	}),
	deserializer: {
		1: {
			schema: abookDataStoredV1Schema,
			deserializer: (stored: AbookDataStoredV1): AbookData =>
				deserializeAbookData(stored),
		},
	},
})
