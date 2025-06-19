import { Encoder } from "./encoder"

/**
 * Text buffer encoder implementation that converts between ArrayBuffer and string using TextEncoder/TextDecoder
 */
export class TextBufferEncoder implements Encoder<ArrayBuffer, string> {
	private readonly textEncoder = new TextEncoder()
	private readonly textDecoder = new TextDecoder()

	/**
	 * Encodes ArrayBuffer to string using TextDecoder
	 * @param raw ArrayBuffer to encode
	 * @returns String representation
	 */
	public readonly encode = (raw: ArrayBuffer): string => {
		return this.textDecoder.decode(raw)
	}

	/**
	 * Decodes string to ArrayBuffer using TextEncoder
	 * @param encoded String to decode
	 * @returns Decoded ArrayBuffer
	 */
	public readonly decode = (encoded: string): ArrayBuffer => {
		return this.textEncoder.encode(encoded).buffer
	}
}
