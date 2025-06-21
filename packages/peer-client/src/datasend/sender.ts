import { Encoder } from "@teawithsand/reserd"
import { z } from "zod"
import { Conn } from "../conn"
import { MessageHandler } from "./messageHandler"
import {
	ErrorPayload,
	HelloPayload,
	MessageType,
	PROTOCOL_VERSION,
	validateErrorMessage,
	validateHelloMessage,
} from "./protocol"
import { FileReader, FileSource } from "./reader/fileReader"

/**
 * Configuration for creating a FileSender
 */
export interface FileSenderConfig<TGlobalHeader, TFileHeader> {
	readonly conn: Conn<ArrayBuffer>
	readonly globalHeaderSchema?: z.ZodSchema<TGlobalHeader>
	readonly fileHeaderSchema?: z.ZodSchema<TFileHeader>
	readonly encoder?: Encoder<unknown, ArrayBuffer>
}

/**
 * File sender class for transmitting files over a connection
 */
export class FileSender<TGlobalHeader, TFileHeader> {
	private readonly conn: Conn<ArrayBuffer>
	private readonly globalHeaderSchema?: z.ZodSchema<TGlobalHeader> | undefined
	private readonly fileHeaderSchema?: z.ZodSchema<TFileHeader> | undefined
	private readonly messageHandler: MessageHandler

	constructor({
		conn,
		globalHeaderSchema,
		fileHeaderSchema,
		encoder,
	}: FileSenderConfig<TGlobalHeader, TFileHeader>) {
		this.conn = conn
		this.globalHeaderSchema = globalHeaderSchema
		this.fileHeaderSchema = fileHeaderSchema
		this.messageHandler = new MessageHandler(encoder)
	}

	/**
	 * Send files using the provided file source
	 * @param globalHeader - Global transfer header
	 * @param fileSource - Source of files to send
	 */
	public readonly send = async (
		globalHeader: TGlobalHeader,
		fileSource: FileSource<TFileHeader>,
	): Promise<void> => {
		try {
			if (this.globalHeaderSchema) {
				this.globalHeaderSchema.parse(globalHeader)
			}

			await this.messageHandler.sendMessage(this.conn, {
				type: MessageType.HELLO,
				payload: { version: PROTOCOL_VERSION } as HelloPayload,
			})

			const helloResponse = await this.messageHandler.receiveMessage(
				this.conn,
			)
			const helloMessage = validateHelloMessage(helloResponse)

			if (helloMessage.payload.version !== PROTOCOL_VERSION) {
				throw new Error(
					`Protocol version mismatch: expected ${PROTOCOL_VERSION}, got ${helloMessage.payload.version}`,
				)
			}

			await this.messageHandler.sendMessage(this.conn, {
				type: MessageType.TRANSFER_HEADER,
				payload: globalHeader,
			})

			const transferResponse = await this.messageHandler.receiveMessage(
				this.conn,
			)
			if (transferResponse.type === MessageType.REJECT_TRANSFER) {
				throw new Error("Transfer rejected by receiver")
			}
			if (transferResponse.type !== MessageType.ACCEPT_TRANSFER) {
				throw new Error("Expected transfer accept/reject response")
			}

			let fileData = await fileSource.next()
			while (fileData !== null) {
				await this.sendFile(fileData.reader, fileData.header)
				fileData = await fileSource.next()
			}

			await this.messageHandler.sendMessage(this.conn, {
				type: MessageType.TRANSFER_COMPLETE,
			})
		} catch (error) {
			await this.messageHandler.sendMessage(this.conn, {
				type: MessageType.ERROR,
				payload: {
					message:
						error instanceof Error
							? error.message
							: "Unknown error",
				} as ErrorPayload,
			})
			throw error
		}
	}

	private readonly sendFile = async (
		reader: FileReader,
		header: TFileHeader,
	): Promise<void> => {
		try {
			if (this.fileHeaderSchema) {
				this.fileHeaderSchema.parse(header)
			}

			await this.messageHandler.sendMessage(this.conn, {
				type: MessageType.FILE_HEADER,
				payload: header,
			})

			let chunk = await reader.readChunk()
			while (chunk !== null) {
				await this.messageHandler.sendMessage(this.conn, {
					type: MessageType.FILE_CHUNK,
					payload: chunk,
				})

				const ackResponse = await this.messageHandler.receiveMessage(
					this.conn,
				)
				if (ackResponse.type !== MessageType.CHUNK_ACK) {
					if (ackResponse.type === MessageType.ERROR) {
						const errorMessage = validateErrorMessage(ackResponse)
						throw new Error(
							`Remote error: ${errorMessage.payload.message}`,
						)
					}
					throw new Error("Expected chunk acknowledgment")
				}

				chunk = await reader.readChunk()
			}

			await this.messageHandler.sendMessage(this.conn, {
				type: MessageType.FILE_END,
			})
		} finally {
			await reader.close()
		}
	}
}
