import { Encoder } from "./encoder"

/**
 * Text buffer encoder implementation that converts between ArrayBuffer and string using TextEncoder/TextDecoder
 */
export class TextBufferEncoder implements Encoder<string, ArrayBuffer> {
	private readonly textEncoder = new TextEncoder()
	private readonly textDecoder = new TextDecoder()

	/**
	 * Encodes string to ArrayBuffer using TextEncoder
	 * @param raw String to encode
	 * @returns Encoded ArrayBuffer
	 */
	public readonly encode = (raw: string): ArrayBuffer => {
		return this.textEncoder.encode(raw).buffer
	}

	/**
	 * Decodes ArrayBuffer to string using TextDecoder
	 * @param encoded ArrayBuffer to decode
	 * @returns Decoded string
	 */
	public readonly decode = (encoded: ArrayBuffer): string => {
		return this.textDecoder.decode(encoded)
	}
}
