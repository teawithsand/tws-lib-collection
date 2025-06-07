import { Conn } from "./conn"
import { Parser } from "./pairing"

/**
 * A connection wrapper that parses incoming messages using a provided parser function.
 * Outgoing messages are sent as-is without transformation.
 */
export class PairingConn<S, T> implements Conn<T> {
	private readonly innerConn: Conn<S>
	private readonly parser: Parser<S, T>

	public constructor(innerConn: Conn<S>, parser: Parser<S, T>) {
		this.innerConn = innerConn
		this.parser = parser
	}

	/**
	 * Receives a message from the inner connection and parses it using the provided parser.
	 * @returns A promise that resolves to the parsed message
	 * @throws Error if parsing fails or if the inner connection fails
	 */
	public readonly receive = async (): Promise<T> => {
		const rawMessage = await this.innerConn.receive()
		try {
			return this.parser(rawMessage)
		} catch (error) {
			throw new Error(
				`Failed to parse received message: ${error instanceof Error ? error.message : String(error)}`,
			)
		}
	}

	/**
	 * Sends a message through the inner connection.
	 * Note: This assumes T can be sent directly as S. For type safety,
	 * consider using a bidirectional parser/serializer in real applications.
	 * @param message The message to send
	 */
	public readonly send = (message: T): void => {
		// Type assertion needed here as we're assuming T is compatible with S
		// In a real implementation, you might want a separate serializer
		this.innerConn.send(message as unknown as S)
	}

	/**
	 * Closes the inner connection
	 */
	public readonly close = (): void => {
		this.innerConn.close()
	}
}
