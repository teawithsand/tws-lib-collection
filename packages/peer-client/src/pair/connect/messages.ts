import { z } from "zod"

/**
 * Zod schema for the PairMakeData message used in the pairing protocol.
 * This schema should match the structure of PairMakeData as used in PairMaker.
 * Uses base64 encoding for ArrayBuffer fields for JSON compatibility.
 */
export const PairMakeDataSchema = z.object({
	authSecret: z.string(),
	role: z.number(), // Should match PairMakeDataRole enum
	hostId: z.string(),
	ownPublicAddress: z.string(),
	timeAddressData: z.any(), // Replace with a more specific schema if available
})

/**
 * Zod schema for the result message returned by PairMaker.pair().
 * This should match the structure of the result object.
 */
export const PairMakerResultSchema = z.object({
	remote: z.object({
		hostId: z.string(),
	}),
})

/**
 * Zod schema for the protocol hello message.
 * Example: { protocol: "tws-peer-pair", version: 1 }
 */
export const ProtocolHelloMessageSchema = z.object({
	protocol: z.literal("tws-peer-pair"),
	version: z.number(),
})

/**
 * Zod schema for the hostId message.
 * Accepts only an object with a hostId string property.
 */
export const HostIdMessageSchema = z.object({ hostId: z.string() })
