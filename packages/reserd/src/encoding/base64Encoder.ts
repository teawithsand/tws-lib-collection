import { Encoder } from "./encoder"

/**
 * Base64 encoder implementation that converts between ArrayBuffer and base64 string
 */
export class Base64Encoder implements Encoder<ArrayBuffer, string> {
	/**
	 * Encodes ArrayBuffer to base64 string
	 * @param raw ArrayBuffer to encode
	 * @returns Base64 string representation
	 */
	public readonly encode = (raw: ArrayBuffer): string => {
		const uint8Array = new Uint8Array(raw)
		let binary = ""
		for (let i = 0; i < uint8Array.length; i++) {
			binary += String.fromCharCode(uint8Array[i]!)
		}
		return btoa(binary)
	}

	/**
	 * Decodes base64 string to ArrayBuffer
	 * @param encoded Base64 string to decode
	 * @returns Decoded ArrayBuffer
	 */
	public readonly decode = (encoded: string): ArrayBuffer => {
		const binary = atob(encoded)
		const uint8Array = new Uint8Array(binary.length)
		for (let i = 0; i < binary.length; i++) {
			uint8Array[i] = binary.charCodeAt(i)
		}
		return uint8Array.buffer
	}
}
