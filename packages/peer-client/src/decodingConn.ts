import { Conn } from "./conn"

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
 * A connection wrapper that encodes outgoing messages and decodes incoming messages
 * using a provided encoder/decoder.
 */
export class DecodingConn<Raw, Encoded> implements Conn<Raw> {
	private readonly innerConn: Conn<Encoded>
	private readonly encoder: Encoder<Raw, Encoded>

	public constructor(
		innerConn: Conn<Encoded>,
		encoder: Encoder<Raw, Encoded>,
	) {
		this.innerConn = innerConn
		this.encoder = encoder
	}

	/**
	 * Receives an encoded message from the inner connection and decodes it.
	 * @returns A promise that resolves to the decoded message
	 * @throws Error if decoding fails or if the inner connection fails
	 */
	public readonly receive = async (): Promise<Raw> => {
		const encodedMessage = await this.innerConn.receive()
		try {
			return this.encoder.decode(encodedMessage)
		} catch (error) {
			throw new Error(
				`Failed to decode received message: ${error instanceof Error ? error.message : String(error)}`,
			)
		}
	}

	/**
	 * Encodes a message and sends it through the inner connection.
	 * @param message The raw message to encode and send
	 * @throws Error if encoding fails or if the inner connection fails
	 */
	public readonly send = (message: Raw): void => {
		try {
			const encodedMessage = this.encoder.encode(message)
			this.innerConn.send(encodedMessage)
		} catch (error) {
			throw new Error(
				`Failed to encode message for sending: ${error instanceof Error ? error.message : String(error)}`,
			)
		}
	}

	/**
	 * Closes the inner connection
	 */
	public readonly close = (): void => {
		this.innerConn.close()
	}
}
