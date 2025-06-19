import { SerializerReverse } from "../serialization/serializer"
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
	implements SerializerReverse<TOwned, VersionedStorageObject<TVersionedData>>
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
	 */
	public get schema() {
		return this.deserializer.getSchema()
	}

	/**
	 * Serializes an owned (runtime) object into a versioned storage object.
	 *
	 * @param owned - The runtime object to serialize
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
	 * @throws Will throw an error if the stored data cannot be deserialized according to the configured deserializers
	 */
	public readonly deserializeKnown = (
		stored: VersionedStorageObject<TVersionedData>,
	): TOwned => {
		return this.deserializer.deserialize(stored)
	}

	/**
	 * Deserializes a versioned storage object into an owned (runtime) object.
	 *
	 * @param stored - The versioned storage object to deserialize
	 * @throws Will throw an error if the stored data cannot be deserialized according to the configured deserializers
	 */
	public readonly deserialize = (stored: unknown): TOwned => {
		return this.deserializer.deserialize(stored)
	}

	/**
	 * Returns a SerializerReverse with unknown stored type.
	 */
	public readonly getUnknownSerializer = (): SerializerReverse<
		TOwned,
		unknown
	> => {
		return {
			serialize: this.serialize,
			deserialize: this.deserialize,
		}
	}

	/**
	 * Returns a SerializerReverse with known stored type.
	 */
	public readonly getTypedSerializer = (): SerializerReverse<
		TOwned,
		VersionedStorageObject<TVersionedData>
	> => {
		return {
			serialize: this.serialize,
			deserialize: this.deserializeKnown,
		}
	}
}
