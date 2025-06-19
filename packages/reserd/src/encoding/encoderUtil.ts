import { Serializer } from "../serialization"
import { Encoder } from "./encoder"

/**
 * Utility class for converting between Encoder and Serializer interfaces.
 * Provides methods to adapt encoders to work as serializers and vice versa.
 */
export class EncoderUtil {
	private constructor() {}

	/**
	 * Converts an Encoder to a Serializer by swapping the direction of operations.
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
	 * Converts a Serializer to an Encoder by swapping the direction of operations.
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
	 * Creates an identity encoder that returns the input unchanged.
	 * Useful as a no-op encoder or for testing purposes.
	 *
	 * @template T The data type
	 * @returns An encoder that performs no transformation
	 */
	public static readonly identity = <T>(): Encoder<T, T> => ({
		encode: (value: T) => value,
		decode: (value: T) => value,
	})

	/**
	 * Composes two encoders sequentially, where the output of the first encoder
	 * becomes the input of the second encoder.
	 *
	 * @template A The input type of the first encoder
	 * @template B The output type of the first encoder and input type of the second
	 * @template C The output type of the second encoder
	 * @param first The first encoder to apply
	 * @param second The second encoder to apply
	 * @returns A composed encoder that applies both transformations
	 */
	public static readonly compose = <A, B, C>(
		first: Encoder<A, B>,
		second: Encoder<B, C>,
	): Encoder<A, C> => ({
		encode: (value: A) => second.encode(first.encode(value)),
		decode: (value: C) => first.decode(second.decode(value)),
	})
}
