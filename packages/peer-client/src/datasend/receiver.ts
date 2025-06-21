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
import { FileReceiverHandler } from "./writer/fileWriter"

/**
 * Configuration for creating a FileReceiver
 */
export interface FileReceiverConfig<TGlobalHeader, TFileHeader> {
	readonly conn: Conn<ArrayBuffer>
	readonly fileReceiverHandler: FileReceiverHandler<
		TGlobalHeader,
		TFileHeader
	>
	readonly globalHeaderSchema?: z.ZodSchema<TGlobalHeader>
	readonly fileHeaderSchema?: z.ZodSchema<TFileHeader>
	readonly encoder?: Encoder<unknown, ArrayBuffer>
}

/**
 * File receiver class for receiving files over a connection
 */
export class FileReceiver<TGlobalHeader, TFileHeader> {
	private readonly conn: Conn<ArrayBuffer>
	private readonly fileReceiverHandler: FileReceiverHandler<
		TGlobalHeader,
		TFileHeader
	>
	private readonly globalHeaderSchema?: z.ZodSchema<TGlobalHeader> | undefined
	private readonly fileHeaderSchema?: z.ZodSchema<TFileHeader> | undefined
	private readonly messageHandler: MessageHandler

	constructor({
		conn,
		fileReceiverHandler,
		globalHeaderSchema,
		fileHeaderSchema,
		encoder,
	}: FileReceiverConfig<TGlobalHeader, TFileHeader>) {
		this.conn = conn
		this.fileReceiverHandler = fileReceiverHandler
		this.globalHeaderSchema = globalHeaderSchema
		this.fileHeaderSchema = fileHeaderSchema
		this.messageHandler = new MessageHandler(encoder)
	}

	/**
	 * Start receiving files
	 * @param acceptTransfer - Function to decide whether to accept the transfer based on global header
	 */
	public readonly receive = async (
		acceptTransfer: (globalHeader: TGlobalHeader) => Promise<boolean>,
	): Promise<void> => {
		try {
			const helloResponse = await this.messageHandler.receiveMessage(
				this.conn,
			)
			const helloMessage = validateHelloMessage(helloResponse)

			if (helloMessage.payload.version !== PROTOCOL_VERSION) {
				await this.messageHandler.sendMessage(this.conn, {
					type: MessageType.ERROR,
					payload: {
						message: `Protocol version mismatch: expected ${PROTOCOL_VERSION}, got ${helloMessage.payload.version}`,
					} as ErrorPayload,
				})
				throw new Error(`Protocol version mismatch`)
			}

			await this.messageHandler.sendMessage(this.conn, {
				type: MessageType.HELLO,
				payload: { version: PROTOCOL_VERSION } as HelloPayload,
			})

			const transferHeaderMessage =
				await this.messageHandler.receiveMessage(this.conn)
			if (transferHeaderMessage.type !== MessageType.TRANSFER_HEADER) {
				await this.messageHandler.sendMessage(this.conn, {
					type: MessageType.ERROR,
					payload: {
						message: "Expected transfer header",
					} as ErrorPayload,
				})
				throw new Error("Expected transfer header")
			}

			let globalHeader: TGlobalHeader
			try {
				globalHeader = transferHeaderMessage.payload as TGlobalHeader

				if (this.globalHeaderSchema) {
					globalHeader = this.globalHeaderSchema.parse(globalHeader)
				}
			} catch (error) {
				await this.messageHandler.sendMessage(this.conn, {
					type: MessageType.ERROR,
					payload: {
						message: `Invalid global header: ${error instanceof Error ? error.message : "Unknown validation error"}`,
					} as ErrorPayload,
				})
				throw new Error(
					`Invalid global header: ${error instanceof Error ? error.message : "Unknown validation error"}`,
				)
			}

			const shouldAccept = await acceptTransfer(globalHeader)
			if (!shouldAccept) {
				await this.messageHandler.sendMessage(this.conn, {
					type: MessageType.REJECT_TRANSFER,
				})
				return
			}

			await this.messageHandler.sendMessage(this.conn, {
				type: MessageType.ACCEPT_TRANSFER,
			})

			await this.receiveFiles(globalHeader)
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

	private readonly receiveFiles = async (
		globalHeader: TGlobalHeader,
	): Promise<void> => {
		let fileIndex = 0
		try {
			while (true) {
				const message = await this.messageHandler.receiveMessage(
					this.conn,
				)

				switch (message.type) {
					case MessageType.FILE_HEADER:
						let fileHeader: TFileHeader
						try {
							fileHeader = message.payload as TFileHeader

							if (this.fileHeaderSchema) {
								fileHeader =
									this.fileHeaderSchema.parse(fileHeader)
							}
						} catch (error) {
							await this.messageHandler.sendMessage(this.conn, {
								type: MessageType.ERROR,
								payload: {
									message: `Invalid file header: ${error instanceof Error ? error.message : "Unknown validation error"}`,
								} as ErrorPayload,
							})
							throw new Error(
								`Invalid file header: ${error instanceof Error ? error.message : "Unknown validation error"}`,
							)
						}

						await this.receiveFile(
							globalHeader,
							fileHeader,
							fileIndex,
						)
						fileIndex++
						break

					case MessageType.TRANSFER_COMPLETE:
						return

					case MessageType.ERROR:
						const errorMessage = validateErrorMessage(message)
						throw new Error(
							`Remote error: ${errorMessage.payload.message}`,
						)

					default:
						throw new Error(
							`Unexpected message type: ${message.type}`,
						)
				}
			}
		} finally {
			await this.fileReceiverHandler.close()
		}
	}

	private readonly receiveFile = async (
		globalHeader: TGlobalHeader,
		fileHeader: TFileHeader,
		fileIndex: number,
	): Promise<void> => {
		const writer = await this.fileReceiverHandler.createFileWriter(
			globalHeader,
			fileHeader,
			fileIndex,
		)

		try {
			while (true) {
				const message = await this.messageHandler.receiveMessage(
					this.conn,
				)

				switch (message.type) {
					case MessageType.FILE_CHUNK:
						await writer.writeChunk(message.payload as ArrayBuffer)

						await this.messageHandler.sendMessage(this.conn, {
							type: MessageType.CHUNK_ACK,
						})
						break

					case MessageType.FILE_END:
						return

					case MessageType.ERROR:
						const errorMessage = validateErrorMessage(message)
						throw new Error(
							`Remote error: ${errorMessage.payload.message}`,
						)

					default:
						throw new Error(
							`Unexpected message type during file transfer: ${message.type}`,
						)
				}
			}
		} finally {
			await writer.close()
		}
	}
}
