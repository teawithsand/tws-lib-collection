import { SerializerReverse } from "@teawithsand/reserd"
import { z } from "zod"
import {
	AbookAggregateDataVersionedType,
	AbookEntryAggregateDataVersionedType,
	AbookEntryDataVersionedType,
	AbookHeaderDataVersionedType,
} from "../../defines"
import { FsAbookStoreAbookData, FsAbookStoreAbookEntryData } from "./store"

/**
 * Versioned stored schema for audiobook data version 1.
 * Contains header and aggregate data for an audiobook.
 */
const fsAbookStoreAbookDataStoredV1Schema = z.object({
	aggregate: AbookAggregateDataVersionedType.schema,
	header: AbookHeaderDataVersionedType.schema,
})

/**
 * Versioned stored schema for audiobook entry data version 1.
 * Contains entry metadata and aggregate data.
 */
const fsAbookStoreAbookEntryDataStoredV1Schema = z.object({
	aggregate: AbookEntryAggregateDataVersionedType.schema,
	data: AbookEntryDataVersionedType.schema,
})

/**
 * Stored type for audiobook data version 1.
 */
export type FsAbookStoreAbookDataStoredV1 = z.infer<
	typeof fsAbookStoreAbookDataStoredV1Schema
>

/**
 * Stored type for audiobook entry data version 1.
 */
export type FsAbookStoreAbookEntryDataStoredV1 = z.infer<
	typeof fsAbookStoreAbookEntryDataStoredV1Schema
>

/**
 * Union type for audiobook data of any supported version.
 * Currently only supports V1, but can be extended for future versions.
 */
export type FsAbookStoreAbookDataStored = FsAbookStoreAbookDataStoredV1

/**
 * Union type for audiobook entry data of any supported version.
 * Currently only supports V1, but can be extended for future versions.
 */
export type FsAbookStoreAbookEntryDataStored =
	FsAbookStoreAbookEntryDataStoredV1

/**
 * Union schema for audiobook data of any supported version.
 */
const fsAbookStoreAbookDataStoredSchema = fsAbookStoreAbookDataStoredV1Schema

/**
 * Union schema for audiobook entry data of any supported version.
 */
const fsAbookStoreAbookEntryDataStoredSchema =
	fsAbookStoreAbookEntryDataStoredV1Schema

/**
 * Serializer for FsAbookStoreAbookData.
 * Handles serialization/deserialization between owned and stored representations.
 */
export const FsAbookStoreAbookDataSerializer: SerializerReverse<
	FsAbookStoreAbookData,
	FsAbookStoreAbookDataStored
> = {
	serialize: (owned: FsAbookStoreAbookData): FsAbookStoreAbookDataStored => {
		return {
			aggregate: AbookAggregateDataVersionedType.serialize(
				owned.aggregate,
			),
			header: AbookHeaderDataVersionedType.serialize(owned.header),
		}
	},

	deserialize: (
		stored: FsAbookStoreAbookDataStored,
	): FsAbookStoreAbookData => {
		const validated = fsAbookStoreAbookDataStoredSchema.parse(stored)

		return {
			aggregate: AbookAggregateDataVersionedType.deserialize(
				validated.aggregate,
			),
			header: AbookHeaderDataVersionedType.deserialize(validated.header),
		}
	},
}

/**
 * Serializer for FsAbookStoreAbookEntryData.
 * Handles serialization/deserialization between owned and stored representations.
 */
export const FsAbookStoreAbookEntryDataSerializer: SerializerReverse<
	FsAbookStoreAbookEntryData,
	FsAbookStoreAbookEntryDataStored
> = {
	serialize: (
		owned: FsAbookStoreAbookEntryData,
	): FsAbookStoreAbookEntryDataStored => {
		return {
			aggregate: AbookEntryAggregateDataVersionedType.serialize(
				owned.aggregate,
			),
			data: AbookEntryDataVersionedType.serialize(owned.data),
		}
	},

	deserialize: (
		stored: FsAbookStoreAbookEntryDataStored,
	): FsAbookStoreAbookEntryData => {
		const validated = fsAbookStoreAbookEntryDataStoredSchema.parse(stored)

		return {
			aggregate: AbookEntryAggregateDataVersionedType.deserialize(
				validated.aggregate,
			),
			data: AbookEntryDataVersionedType.deserialize(validated.data),
		}
	},
}
