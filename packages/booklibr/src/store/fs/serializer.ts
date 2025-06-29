import { SerializerReverse } from "@teawithsand/reserd"
import { z } from "zod"
import {
	AbookAggregateDataVersionedType,
	AbookEntryAggregateDataVersionedType,
	AbookEntryDataVersionedType,
	AbookHeaderDataVersionedType,
} from "../../defines"
import { FsAbookStoreAbookData, FsAbookStoreAbookEntryData } from "./store"

// Stored schemas for version 1
const fsAbookStoreAbookDataStoredV1Schema = z.object({
	aggregate: AbookAggregateDataVersionedType.schema,
	header: AbookHeaderDataVersionedType.schema,
})

const fsAbookStoreAbookEntryDataStoredV1Schema = z.object({
	aggregate: AbookEntryAggregateDataVersionedType.schema,
	data: AbookEntryDataVersionedType.schema,
})

// Stored types for version 1
export type FsAbookStoreAbookDataStoredV1 = z.infer<
	typeof fsAbookStoreAbookDataStoredV1Schema
>
export type FsAbookStoreAbookEntryDataStoredV1 = z.infer<
	typeof fsAbookStoreAbookEntryDataStoredV1Schema
>

// Union types for any version (currently only V1)
export type FsAbookStoreAbookDataStored = FsAbookStoreAbookDataStoredV1
export type FsAbookStoreAbookEntryDataStored =
	FsAbookStoreAbookEntryDataStoredV1

// Union schemas for any version (currently only V1)
const fsAbookStoreAbookDataStoredSchema = fsAbookStoreAbookDataStoredV1Schema
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
