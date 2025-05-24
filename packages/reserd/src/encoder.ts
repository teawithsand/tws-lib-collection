/**
 * Interface for encoding and decoding between Raw and Encoded types
 * @template Raw The raw data type
 * @template Encoded The encoded data type
 */
export interface Encoder<Raw, Encoded> {
	/**
	 * Encodes raw data to encoded format
	 * @param raw Data in raw format
	 * @returns Data in encoded format
	 */
	encode: (raw: Raw) => Encoded

	/**
	 * Decodes encoded data to raw format
	 * @param encoded Data in encoded format
	 * @returns Data in raw format
	 */
	decode: (encoded: Encoded) => Raw
}

/**
 * JSON encoder implementation that converts between JSON string and object
 * @template T The type of object to encode/decode
 */
export class JSONEncoder<T = any> implements Encoder<T, string> {
	/**
	 * Encodes object to JSON string
	 * @param raw Object to encode
	 * @returns JSON string representation
	 */
	public readonly encode = (raw: T): string => {
		return JSON.stringify(raw)
	}

	/**
	 * Decodes JSON string to object
	 * @param encoded JSON string to decode
	 * @returns Decoded object
	 */
	public readonly decode = (encoded: string): T => {
		return JSON.parse(encoded)
	}
}
