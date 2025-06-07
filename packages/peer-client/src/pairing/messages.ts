import { z } from "zod"

/**
 * Schema for device information message exchanged during pairing
 */
export const DeviceInfoMessageSchema = z.object({
	deviceName: z.string(),
	staticAddress: z.string(),
	dynamicAddressGenerationData: z.object({
		seed: z.instanceof(ArrayBuffer),
		algorithm: z.string(),
		parameters: z.record(z.unknown()),
	}),
})

export type DeviceInfoMessage = z.infer<typeof DeviceInfoMessageSchema>

/**
 * Schema for the complete pairing handshake message
 */
export const PairingHandshakeMessageSchema = z.object({
	deviceInfo: DeviceInfoMessageSchema,
	timestamp: z.number(),
	nonce: z.instanceof(ArrayBuffer),
})

export type PairingHandshakeMessage = z.infer<
	typeof PairingHandshakeMessageSchema
>
