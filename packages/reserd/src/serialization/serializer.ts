/**
 * Interface for serializing and deserializing between Owned and Stored types
 * @template Stored The stored data type (serialized format)
 * @template Owned The owned data type (application format)
 *
 * @deprecated Use SerializerReverse instead, which is more explicit about the direction of serialization.
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
	deserialize: (stored: Stored) => Owned
}

/**
 * Interface for serializing and deserializing between Owned and Stored types
 * @template Owned The owned data type (application format)
 * @template Stored The stored data type (serialized format)
 *
 * This interface allows for serializing to known type, but deserializing from unknown type, which is often
 * the case when dealing with external data sources or APIs where the exact type of stored
 * data may not be known or trusted.
 *
 * This interface is not deprecated, since it already has proper generic argument order.
 */
export interface SerializerUnknown<Owned, Stored>
	extends SerializerReverse<Owned, Stored> {
	/**
	 * Converts an owned object to its stored representation
	 * @param owned Object in application format
	 * @returns Object in serialized format
	 */
	serialize: (owned: Owned) => Stored

	/**
	 * Converts a stored representation back to an owned object from unknown input
	 * @param stored Object in unknown format that should be deserializable to application format
	 * @returns Object in application format
	 * @throws May throw if the stored data cannot be deserialized to the expected format
	 */
	deserialize: (stored: unknown) => Owned
}

/**
 * Interface for serializing and deserializing between Owned and Stored types
 * @template Stored The stored data type (serialized format)
 * @template Owned The owned data type (application format)
 *
 * Replaces serializer with a more explicit naming convention.
 */
export type SerializerReverse<Owned, Stored = unknown> = Serializer<
	Stored,
	Owned
>
