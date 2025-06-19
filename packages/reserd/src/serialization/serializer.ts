/**
 * Interface for serializing and deserializing between Owned and Stored types
 * @template Stored The stored data type (serialized format)
 * @template Owned The owned data type (application format)
 *
 * @deprecated Use SerializerProper instead, which is more explicit about the direction of serialization.
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
 * @template Stored The stored data type (serialized format)
 * @template Owned The owned data type (application format)
 *
 * Replaces serializer with a more explicit naming convention.
 */
export type SerializerReverse<Owned, Stored = unknown> = Serializer<
	Stored,
	Owned
>
