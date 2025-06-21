import { z } from "zod"
import { Encoder } from "../encoding"
import { Serializer } from "./serializer"

/**
 * Utility class for converting between Serializer and Encoder interfaces.
 * Provides methods to adapt serializers to work as encoders and vice versa.
 */
export class SerializerUtil {
	private constructor() {}

	/**
	 * Converts a Serializer to an Encoder by mapping operations directly.
	 * The serializer's serialize becomes the encoder's encode, and deserialize becomes decode.
	 *
	 * @template Stored The stored data type (becomes Encoded in encoder)
	 * @template Owned The owned data type (becomes Raw in encoder)
	 * @param serializer The serializer to convert
	 * @returns An encoder that uses the serializer's operations
	 */
	public static readonly serializerToEncoder = <Stored, Owned>(
		serializer: Serializer<Stored, Owned>,
	): Encoder<Owned, Stored> => ({
		encode: serializer.serialize,
		decode: serializer.deserialize,
	})

	/**
	 * Converts an Encoder to a Serializer by mapping operations directly.
	 * The encoder's encode becomes the serializer's serialize, and decode becomes deserialize.
	 *
	 * @template Raw The raw data type (becomes Owned in serializer)
	 * @template Encoded The encoded data type (becomes Stored in serializer)
	 * @param encoder The encoder to convert
	 * @returns A serializer that uses the encoder's operations
	 */
	public static readonly encoderToSerializer = <Raw, Encoded>(
		encoder: Encoder<Raw, Encoded>,
	): Serializer<Encoded, Raw> => ({
		serialize: encoder.encode,
		deserialize: encoder.decode,
	})

	/**
	 * Creates an encoder that uses a serializer in reverse.
	 * The serializer's deserialize becomes encode, and serialize becomes decode.
	 * This is useful when you want to use a serializer but with inverted semantics.
	 *
	 * @template Stored The stored data type (becomes Raw in encoder)
	 * @template Owned The owned data type (becomes Encoded in encoder)
	 * @param serializer The serializer to use in reverse
	 * @returns An encoder with inverted serializer operations
	 */
	public static readonly serializerToReverseEncoder = <Stored, Owned>(
		serializer: Serializer<Stored, Owned>,
	): Encoder<Stored, Owned> => ({
		encode: serializer.deserialize,
		decode: serializer.serialize,
	})

	/**
	 * Creates a serializer that uses an encoder in reverse.
	 * The encoder's decode becomes serialize, and encode becomes deserialize.
	 * This is useful when you want to use an encoder but with inverted semantics.
	 *
	 * @template Raw The raw data type (becomes Stored in serializer)
	 * @template Encoded The encoded data type (becomes Owned in serializer)
	 * @param encoder The encoder to use in reverse
	 * @returns A serializer with inverted encoder operations
	 */
	public static readonly encoderToReverseSerializer = <Raw, Encoded>(
		encoder: Encoder<Raw, Encoded>,
	): Serializer<Raw, Encoded> => ({
		serialize: encoder.decode,
		deserialize: encoder.encode,
	})

	/**
	 * Composes two serializers into a single serializer.
	 * The first serializer's output becomes the second serializer's input.
	 *
	 * @template T1 The initial owned type
	 * @template T2 The intermediate type (stored for first, owned for second)
	 * @template T3 The final stored type
	 * @param first The first serializer in the chain
	 * @param second The second serializer in the chain
	 * @returns A composed serializer that applies both transformations
	 */
	public static readonly compose = <T1, T2, T3>(
		first: Serializer<T2, T1>,
		second: Serializer<T3, T2>,
	): Serializer<T3, T1> => ({
		serialize: (owned: T1) => second.serialize(first.serialize(owned)),
		deserialize: (stored: T3) =>
			first.deserialize(second.deserialize(stored)),
	})

	/**
	 * Creates an identity serializer that performs no transformation.
	 * Both serialize and deserialize operations return the input unchanged.
	 *
	 * @template T The type that remains unchanged
	 * @returns A serializer that performs no transformation
	 */
	public static readonly identity = <T>(): Serializer<T, T> => ({
		serialize: (value: T) => value,
		deserialize: (value: T) => value,
	})

	/**
	 * Creates a serializer from a Zod schema that validates unknown input.
	 * The serializer handles deserialization by parsing unknown data with the schema,
	 * and serialization by returning the validated data as-is (identity transformation).
	 *
	 * @template T The type inferred from the Zod schema
	 * @param schema The Zod schema to use for validation
	 * @returns A serializer that validates unknown input and returns typed output
	 */
	public static readonly fromZodSchema = <T>(
		schema: z.ZodSchema<T>,
	): Serializer<unknown, T> => ({
		serialize: (owned: T) => owned,
		deserialize: (stored: unknown) => schema.parse(stored),
	})

	/**
	 * Creates a serializer from a Zod schema that validates input in both directions.
	 * The serializer validates data during both serialization and deserialization,
	 * ensuring type safety and data integrity at runtime.
	 *
	 * @template T The type inferred from the Zod schema
	 * @param schema The Zod schema to use for validation
	 * @returns A serializer that validates input in both serialize and deserialize operations
	 */
	public static readonly fromZodSchemaChecked = <T>(
		schema: z.ZodSchema<T>,
	): Serializer<unknown, T> => ({
		serialize: (owned: T) => schema.parse(owned),
		deserialize: (stored: unknown) => schema.parse(stored),
	})
}
