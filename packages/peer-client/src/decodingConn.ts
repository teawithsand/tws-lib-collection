import { Encoder } from "@teawithsand/reserd"
import { Conn } from "./conn"

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
	public readonly send = async (message: Raw): Promise<void> => {
		try {
			const encodedMessage = this.encoder.encode(message)
			await this.innerConn.send(encodedMessage)
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
