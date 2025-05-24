import {
	DeserializerSet,
	VersionedDeserializer,
	VersionedStored,
} from "./deserializerSet"

/**
 * Interface for serializing and deserializing between Owned and Stored types
 * @template Stored The stored data type (serialized format)
 * @template Owned The owned data type (application format)
 */
export interface Serializer<Stored, Owned> {
	/**
	 * Converts an owned object to its stored representation
	 * @param owned Object in application format
	 * @returns Object in serialized format
	 */
	serialize: (owned: Owned) => Stored

	/**
	 * Converts a stored representation back to an owned object
	 * @param stored Object in serialized format
	 * @returns Object in application format
	 */
	deserializer: (stored: Stored) => Owned
}

/**
 * A serializer implementation that handles versioned stored types serializer and set of deserializers.
 *
 * @template TStored - The stored type that extends {@link VersionedStored}
 * @template TOwned - The owned type that the stored type will be deserialized into
 */
export class SimpleSerializer<TStored extends VersionedStored, TOwned>
	implements Serializer<TStored, TOwned>
{
	private readonly serializerFn
	private readonly deserializerSet

	/**
	 * Private constructor for the SerializerWithVersions class.
	 * Use {@link SimpleSerializer.create} to instantiate.
	 *
	 * @param serializerFn - Function that serializes owned objects to stored format
	 * @param deserializerSet - DeserializerSetDeserializer instance for version-aware deserialization
	 */
	private constructor({
		serializerFn,
		deserializerSet,
	}: {
		serializerFn: (owned: TOwned) => TStored
		deserializerSet: VersionedDeserializer<TStored, TOwned>
	}) {
		this.serializerFn = serializerFn
		this.deserializerSet = deserializerSet
	}

	/**
	 * Creates a new instance of the SerializerWithVersions class.
	 *
	 * @template TStored - The stored type that extends {@link VersionedStored}
	 * @template TOwned - The owned type that the stored type will be deserialized into
	 * @param serializerFn - Function that serializes owned objects to stored format
	 * @param deserializers - Set of version-specific deserializer functions
	 * @returns A new SerializerWithVersions instance
	 */
	public static create<TStored extends VersionedStored, TOwned>({
		serializerFn,
		deserializers,
	}: {
		serializerFn: (owned: TOwned) => TStored
		deserializers: DeserializerSet<TStored, TOwned>
	}): SimpleSerializer<TStored, TOwned> {
		const deserializerSet = VersionedDeserializer.create({ deserializers })
		return new SimpleSerializer({ serializerFn, deserializerSet })
	}

	/**
	 * Converts an owned object to its stored representation
	 *
	 * @param owned - Object in application format
	 * @returns Object in serialized format
	 */
	public readonly serialize = (owned: TOwned): TStored => {
		return this.serializerFn(owned)
	}

	/**
	 * Converts a stored representation back to an owned object
	 * Uses the appropriate deserializer based on the version of the stored object
	 *
	 * @param stored - Object in serialized format
	 * @returns Object in application format
	 */
	public readonly deserializer = (stored: TStored): TOwned => {
		return this.deserializerSet.deserialize(stored)
	}
}
