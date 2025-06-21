import { z } from "zod"

/**
 * Version of the file transfer protocol
 */
export const PROTOCOL_VERSION = 1

/**
 * Protocol message types
 */
export enum MessageType {
	HELLO = "HELLO",
	TRANSFER_HEADER = "TRANSFER_HEADER",
	ACCEPT_TRANSFER = "ACCEPT_TRANSFER",
	REJECT_TRANSFER = "REJECT_TRANSFER",
	FILE_HEADER = "FILE_HEADER",
	FILE_CHUNK = "FILE_CHUNK",
	CHUNK_ACK = "CHUNK_ACK",
	FILE_END = "FILE_END",
	TRANSFER_COMPLETE = "TRANSFER_COMPLETE",
	ERROR = "ERROR",
}

/**
 * Hello message payload schema
 */
export const helloPayloadSchema = z.object({
	version: z.number(),
})

/**
 * Error message payload schema
 */
export const errorPayloadSchema = z.object({
	message: z.string(),
})

/**
 * Base protocol message schema
 */
export const baseProtocolMessageSchema = z.object({
	type: z.nativeEnum(MessageType),
})

/**
 * Hello message schema
 */
export const helloMessageSchema = baseProtocolMessageSchema.extend({
	type: z.literal(MessageType.HELLO),
	payload: helloPayloadSchema,
})

/**
 * Transfer header message schema (generic)
 */
export const createTransferHeaderMessageSchema = <T extends z.ZodTypeAny>(
	payloadSchema: T,
) =>
	baseProtocolMessageSchema.extend({
		type: z.literal(MessageType.TRANSFER_HEADER),
		payload: payloadSchema,
	})

/**
 * Accept transfer message schema
 */
export const acceptTransferMessageSchema = baseProtocolMessageSchema.extend({
	type: z.literal(MessageType.ACCEPT_TRANSFER),
})

/**
 * Reject transfer message schema
 */
export const rejectTransferMessageSchema = baseProtocolMessageSchema.extend({
	type: z.literal(MessageType.REJECT_TRANSFER),
})

/**
 * File header message schema (generic)
 */
export const createFileHeaderMessageSchema = <T extends z.ZodTypeAny>(
	payloadSchema: T,
) =>
	baseProtocolMessageSchema.extend({
		type: z.literal(MessageType.FILE_HEADER),
		payload: payloadSchema,
	})

/**
 * File end message schema
 */
export const fileEndMessageSchema = baseProtocolMessageSchema.extend({
	type: z.literal(MessageType.FILE_END),
})

/**
 * Chunk acknowledgment message schema
 */
export const chunkAckMessageSchema = baseProtocolMessageSchema.extend({
	type: z.literal(MessageType.CHUNK_ACK),
})

/**
 * Transfer complete message schema
 */
export const transferCompleteMessageSchema = baseProtocolMessageSchema.extend({
	type: z.literal(MessageType.TRANSFER_COMPLETE),
})

/**
 * Error message schema
 */
export const errorMessageSchema = baseProtocolMessageSchema.extend({
	type: z.literal(MessageType.ERROR),
	payload: errorPayloadSchema,
})

/**
 * File chunk message (special handling for binary data)
 */
export interface FileChunkMessage {
	type: MessageType.FILE_CHUNK
	payload: ArrayBuffer
}

export type HelloPayload = z.infer<typeof helloPayloadSchema>
export type ErrorPayload = z.infer<typeof errorPayloadSchema>
export type HelloMessage = z.infer<typeof helloMessageSchema>
export type AcceptTransferMessage = z.infer<typeof acceptTransferMessageSchema>
export type RejectTransferMessage = z.infer<typeof rejectTransferMessageSchema>
export type FileEndMessage = z.infer<typeof fileEndMessageSchema>
export type ChunkAckMessage = z.infer<typeof chunkAckMessageSchema>
export type TransferCompleteMessage = z.infer<
	typeof transferCompleteMessageSchema
>
export type ErrorMessage = z.infer<typeof errorMessageSchema>

/**
 * Validate hello message payload
 */
export const validateHelloPayload = (payload: unknown): HelloPayload => {
	return helloPayloadSchema.parse(payload)
}

/**
 * Validate error message payload
 */
export const validateErrorPayload = (payload: unknown): ErrorPayload => {
	return errorPayloadSchema.parse(payload)
}

/**
 * Validate hello message
 */
export const validateHelloMessage = (message: unknown): HelloMessage => {
	return helloMessageSchema.parse(message)
}

/**
 * Validate error message
 */
export const validateErrorMessage = (message: unknown): ErrorMessage => {
	return errorMessageSchema.parse(message)
}
