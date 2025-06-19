import { Encoder } from "./encoder"

/**
 * JSON encoder implementation that converts between JSON string and object
 * @template T The type of object to encode/decode
 */
export class JsonEncoder<T = any> implements Encoder<T, string> {
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
