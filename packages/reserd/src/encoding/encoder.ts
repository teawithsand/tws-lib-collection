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
