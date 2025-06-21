import {
	Encoder,
	EncoderUtil,
	JsonEncoder,
	TextBufferEncoder,
} from "@teawithsand/reserd"
import { Conn } from "../conn"
import { FileChunkMessage, MessageType } from "./protocol"

/**
 * Message handler that properly encodes/decodes messages using reserd encoders
 */
export class MessageHandler {
	private readonly encoder: Encoder<unknown, ArrayBuffer>

	constructor(encoder?: Encoder<unknown, ArrayBuffer>) {
		this.encoder =
			encoder ??
			EncoderUtil.compose(new JsonEncoder(), new TextBufferEncoder())
	}

	/**
	 * Send a message over the connection
	 */
	public readonly sendMessage = async (
		conn: Conn<ArrayBuffer>,
		message: any,
	): Promise<void> => {
		if (message.type === MessageType.FILE_CHUNK) {
			await this.sendFileChunk(conn, message as FileChunkMessage)
		} else {
			const encoded = this.encoder.encode(message)
			await conn.send(encoded)
		}
	}

	/**
	 * Receive a message from the connection
	 */
	public readonly receiveMessage = async (
		conn: Conn<ArrayBuffer>,
	): Promise<any> => {
		const data = await conn.receive()

		try {
			return this.encoder.decode(data)
		} catch {
			return this.tryDecodeFileChunk(data)
		}
	}

	/**
	 * Send a file chunk message with binary payload
	 */
	private readonly sendFileChunk = async (
		conn: Conn<ArrayBuffer>,
		message: FileChunkMessage,
	): Promise<void> => {
		const header = {
			type: message.type,
			payloadLength: message.payload.byteLength,
		}

		const headerBytes = this.encoder.encode(header)
		const headerLength = new Uint32Array([headerBytes.byteLength])

		const combined = new Uint8Array(
			4 + headerBytes.byteLength + message.payload.byteLength,
		)
		combined.set(new Uint8Array(headerLength.buffer), 0)
		combined.set(new Uint8Array(headerBytes), 4)
		combined.set(
			new Uint8Array(message.payload),
			4 + headerBytes.byteLength,
		)

		await conn.send(combined.buffer)
	}

	/**
	 * Try to decode a binary file chunk message
	 */
	private readonly tryDecodeFileChunk = (
		data: ArrayBuffer,
	): FileChunkMessage => {
		const view = new DataView(data)
		if (data.byteLength < 4) {
			throw new Error("Invalid binary message format: too short")
		}

		const headerLength = view.getUint32(0, true)
		if (data.byteLength < 4 + headerLength) {
			throw new Error(
				"Invalid binary message format: header length mismatch",
			)
		}

		const headerBytes = data.slice(4, 4 + headerLength)
		const header = this.encoder.decode(headerBytes) as {
			type: string
			payloadLength: number
		}

		if (header.type !== MessageType.FILE_CHUNK) {
			throw new Error(`Invalid binary message type: ${header.type}`)
		}

		const payload = data.slice(4 + headerLength)
		return {
			type: MessageType.FILE_CHUNK,
			payload: payload,
		}
	}
}
