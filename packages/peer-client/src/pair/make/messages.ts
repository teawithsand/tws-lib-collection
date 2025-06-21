import { z } from "zod"

export const ProtocolHelloMessageSchema = z.object({
	protocol: z.literal("tws-peer-pair"),
	version: z.number(),
})
export type ProtocolHelloMessage = z.infer<typeof ProtocolHelloMessageSchema>

export const PairingHmacMessageSchema = z.object({
	hmac: z.string(), // base64
})
export type PairingHmacMessage = z.infer<typeof PairingHmacMessageSchema>

export const PairLocalDataMessageSchema = z.object({
	hostId: z.string(),
	encryptionKey: z.string(), // base64
	address: z.object({
		timeAddress: z.any(), // TimeAddressData, but for transport use .any()
		staticAddress: z.string(), // base64
	}),
})
export type PairLocalDataMessage = z.infer<typeof PairLocalDataMessageSchema>

export const PairRemoteDataMessageSchema = PairLocalDataMessageSchema // same structure
export type PairRemoteDataMessage = z.infer<typeof PairRemoteDataMessageSchema>
