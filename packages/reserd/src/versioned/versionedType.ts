import { Serializer } from "../serialization"
import { VersionedStorageObject, VersionedTypeDataMap } from "./types"
import {
	VersionedTypeDeserializer,
	VersionedTypeDeserializerConfig,
} from "./versionedTypeDeserializer"

/**
 * Configuration for creating a VersionedType.
 * @template TVersionedData - A map of version numbers to their corresponding data types
 * @template TOwned - The runtime type used in application code
 */
export type VersionedTypeConfig<
	TVersionedData extends VersionedTypeDataMap,
	TOwned,
> = {
	/**
	 * Function to serialize an owned object into a versioned storage object
	 * @param owned - The runtime object to serialize
	 * @returns A versioned storage object containing the serialized data with version information
	 */
	serializer: (owned: TOwned) => VersionedStorageObject<TVersionedData>

	/**
	 * Configuration for deserializing versioned storage objects
	 */
	deserializer: VersionedTypeDeserializerConfig<TVersionedData, TOwned>
}

/**
 * Infers type of serialized(stored) data from VersionedType.
 * @template T - A VersionedType instance
 * @returns The type of the serialized (stored) data
 */
export type VersionedTypeInfer<T extends VersionedType<any, any>> = ReturnType<
	T["serialize"]
>

/**
 * VersionedType provides a type-safe way to serialize and deserialize data while maintaining backward
 * compatibility through versioning.
 *
 * This class enables storing data in a versioned format, allowing the runtime (owned) types to evolve independently
 * from the stored format. It handles the conversion between different versions of the data structure, making it
 * possible to read old data formats even after the application's data model has changed.
 *
 * @template TVersionedData - A map of version numbers to their corresponding data types
 * @template TOwned - The runtime type used in application code
 */
export class VersionedType<TVersionedData extends VersionedTypeDataMap, TOwned>
	implements Serializer<VersionedStorageObject<TVersionedData>, TOwned>
{
	private readonly deserializer

	/**
	 * Creates a new VersionedType instance.
	 *
	 * @param config - Configuration object containing serializer and deserializer settings
	 */
	constructor(
		private readonly config: VersionedTypeConfig<TVersionedData, TOwned>,
	) {
		this.deserializer = new VersionedTypeDeserializer<
			TVersionedData,
			TOwned
		>(config.deserializer)
	}

	/**
	 * Returns the schema for validating versioned storage objects.
	 *
	 * @returns The zod schema that can validate any version of the stored data format
	 */
	public get schema() {
		return this.deserializer.getSchema()
	}

	/**
	 * Serializes an owned (runtime) object into a versioned storage object.
	 *
	 * @param owned - The runtime object to serialize
	 * @returns A versioned storage object containing the serialized data with version information
	 */
	public readonly serialize = (
		owned: TOwned,
	): VersionedStorageObject<TVersionedData> => {
		return this.config.serializer(owned)
	}

	/**
	 * Deserializes a versioned storage object into an owned (runtime) object.
	 *
	 * @param stored - The versioned storage object to deserialize
	 * @returns The deserialized runtime object
	 * @throws Will throw an error if the stored data cannot be deserialized according to the configured deserializers
	 */
	public readonly deserialize = (
		stored: VersionedStorageObject<TVersionedData>,
	): TOwned => {
		return this.deserializer.deserialize(stored)
	}
}
