import {
	EncoderUtil,
	JsonEncoder,
	TextBufferEncoder,
} from "@teawithsand/reserd"
import { beforeEach, describe, expect, test } from "vitest"
import { MockConn } from "../../util/mockConn"
import { PairData } from "../defines"
import { AddressGeneratorAlgorithm } from "../timeAddress"
import { PairServer } from "./server"

/**
 * Creates a dummy PairData object for testing purposes.
 * @param hostId Optional host ID override for the remote host
 * @returns A complete PairData object with dummy values
 */
const makeDummyPairData = (hostId = "remote-id"): PairData => {
	const createArrayBuffer = (size: number): ArrayBuffer => {
		return new ArrayBuffer(size)
	}

	return {
		local: {
			hostId: "local-id",
			encryptionKey: createArrayBuffer(32),
			address: {
				timeAddress: {
					secret: createArrayBuffer(16),
					params: {
						hash: AddressGeneratorAlgorithm.SHA_256,
						timeWindowMs: 1000,
					},
				},
				staticAddress: createArrayBuffer(8),
			},
		},
		remote: {
			hostId,
			encryptionKey: createArrayBuffer(32),
			address: {
				timeAddress: {
					secret: createArrayBuffer(16),
					params: {
						hash: AddressGeneratorAlgorithm.SHA_256,
						timeWindowMs: 1000,
					},
				},
				staticAddress: createArrayBuffer(8),
			},
		},
	}
}

/**
 * Creates an encoder instance for testing message serialization.
 * @returns A composed encoder for JSON + TextBuffer encoding
 */
const createTestEncoder = () => {
	return EncoderUtil.compose(new JsonEncoder(), new TextBufferEncoder())
}

/**
 * Sends a protocol hello message with the specified version.
 * @param conn The connection to send the message on
 * @param version The protocol version to send
 * @param encoder The encoder to use for message serialization
 */
const sendProtocolHello = async (
	conn: MockConn<ArrayBuffer>,
	version: number,
	encoder = createTestEncoder(),
) => {
	const message = { protocol: "tws-peer-pair", version }
	await conn.send(encoder.encode(message))
}

/**
 * Sends a host ID message.
 * @param conn The connection to send the message on
 * @param hostId The host ID to send
 * @param encoder The encoder to use for message serialization
 */
const sendHostIdMessage = async (
	conn: MockConn<ArrayBuffer>,
	hostId: string,
	encoder = createTestEncoder(),
) => {
	const message = { hostId }
	await conn.send(encoder.encode(message))
}

describe("PairServer", () => {
	let pair: PairData
	let server: PairServer
	let clientConn: MockConn<ArrayBuffer>
	let serverConn: MockConn<ArrayBuffer>

	beforeEach(() => {
		pair = makeDummyPairData()
		server = new PairServer({ pairs: [pair] })
		;[clientConn, serverConn] = MockConn.createConnectedPair<ArrayBuffer>()
	})

	describe("constructor", () => {
		test("should construct with required parameters", () => {
			const testServer = new PairServer({ pairs: [pair] })
			expect(testServer).toBeInstanceOf(PairServer)
		})

		test("should construct with default encoder when none provided", () => {
			const testServer = new PairServer({ pairs: [pair] })
			expect(testServer).toBeInstanceOf(PairServer)
		})

		test("should construct with custom encoder", () => {
			const customEncoder = createTestEncoder()
			const testServer = new PairServer({
				pairs: [pair],
				encoder: customEncoder,
			})
			expect(testServer).toBeInstanceOf(PairServer)
		})

		test("should construct with remoteHostIdChecker", () => {
			const checker = (hostId: string) => hostId === "allowed-host"
			const testServer = new PairServer({
				pairs: [pair],
				remoteHostIdChecker: checker,
			})
			expect(testServer).toBeInstanceOf(PairServer)
		})

		test("should handle empty pairs array", () => {
			const testServer = new PairServer({ pairs: [] })
			expect(testServer).toBeInstanceOf(PairServer)
		})
	})

	describe("handleIncomingConn - Protocol Version Negotiation", () => {
		test("should throw on unsupported protocol version", async () => {
			await sendProtocolHello(clientConn, 999)

			await expect(server.handleIncomingConn(serverConn)).rejects.toThrow(
				"Protocol version mismatch: expected 1, got 999",
			)
		})

		test("should throw on invalid protocol message format", async () => {
			const encoder = createTestEncoder()
			const invalidMessage = { invalid: "message" }
			await clientConn.send(encoder.encode(invalidMessage))

			await expect(
				server.handleIncomingConn(serverConn),
			).rejects.toThrow()
		})

		test("should throw on malformed protocol message", async () => {
			await clientConn.send(new ArrayBuffer(10)) // Invalid encoded data

			await expect(
				server.handleIncomingConn(serverConn),
			).rejects.toThrow()
		})

		test("should accept correct protocol version", async () => {
			await sendProtocolHello(clientConn, 1)
			await sendHostIdMessage(clientConn, pair.remote.hostId)

			const result = await server.handleIncomingConn(serverConn)
			expect(result.remoteHostId).toBe(pair.remote.hostId)
		})
	})

	describe("handleIncomingConn - Host ID Validation", () => {
		test("should reject unknown hostId", async () => {
			await sendProtocolHello(clientConn, 1)
			await sendHostIdMessage(clientConn, "unknown-host")

			await expect(server.handleIncomingConn(serverConn)).rejects.toThrow(
				"Remote hostId not allowed or unknown",
			)
		})

		test("should accept known hostId", async () => {
			await sendProtocolHello(clientConn, 1)
			await sendHostIdMessage(clientConn, pair.remote.hostId)

			const result = await server.handleIncomingConn(serverConn)
			expect(result.remoteHostId).toBe(pair.remote.hostId)
			expect(result.remotePairData).toEqual(pair)
		})

		test("should throw on invalid hostId message format", async () => {
			const encoder = createTestEncoder()
			await sendProtocolHello(clientConn, 1)
			await clientConn.send(encoder.encode({ invalidField: "value" }))

			await expect(
				server.handleIncomingConn(serverConn),
			).rejects.toThrow()
		})

		test("should handle multiple pairs and find correct one", async () => {
			const pair2 = makeDummyPairData("second-remote-host")
			const multiPairServer = new PairServer({ pairs: [pair, pair2] })

			await sendProtocolHello(clientConn, 1)
			await sendHostIdMessage(clientConn, pair2.remote.hostId)

			const result = await multiPairServer.handleIncomingConn(serverConn)
			expect(result.remoteHostId).toBe(pair2.remote.hostId)
			expect(result.remotePairData).toEqual(pair2)
		})
	})

	describe("handleIncomingConn - Remote Host ID Checker", () => {
		test("should use remoteHostIdChecker when provided", async () => {
			const checker = (hostId: string) => hostId === pair.remote.hostId
			const checkerServer = new PairServer({
				pairs: [pair],
				remoteHostIdChecker: checker,
			})

			await sendProtocolHello(clientConn, 1)
			await sendHostIdMessage(clientConn, pair.remote.hostId)

			const result = await checkerServer.handleIncomingConn(serverConn)
			expect(result.remoteHostId).toBe(pair.remote.hostId)
		})

		test("should reject when remoteHostIdChecker returns false", async () => {
			const checker = () => false // Always reject
			const checkerServer = new PairServer({
				pairs: [pair],
				remoteHostIdChecker: checker,
			})

			await sendProtocolHello(clientConn, 1)
			await sendHostIdMessage(clientConn, pair.remote.hostId)

			await expect(
				checkerServer.handleIncomingConn(serverConn),
			).rejects.toThrow("Remote hostId not allowed by checker")
		})

		test("should prioritize checker over pairs list", async () => {
			// Create server with known pair but checker that rejects it
			const rejectingChecker = () => false
			const checkerServer = new PairServer({
				pairs: [pair],
				remoteHostIdChecker: rejectingChecker,
			})

			await sendProtocolHello(clientConn, 1)
			await sendHostIdMessage(clientConn, pair.remote.hostId)

			await expect(
				checkerServer.handleIncomingConn(serverConn),
			).rejects.toThrow("Remote hostId not allowed by checker")
		})

		test("should work with complex checker logic", async () => {
			const complexChecker = (hostId: string) => {
				return hostId.startsWith("trusted-") && hostId.length > 10
			}
			const trustedPair = makeDummyPairData("trusted-long-hostname")
			const checkerServer = new PairServer({
				pairs: [trustedPair],
				remoteHostIdChecker: complexChecker,
			})

			await sendProtocolHello(clientConn, 1)
			await sendHostIdMessage(clientConn, trustedPair.remote.hostId)

			const result = await checkerServer.handleIncomingConn(serverConn)
			expect(result.remoteHostId).toBe(trustedPair.remote.hostId)
		})
	})

	describe("handleIncomingConn - Connection Handling", () => {
		test("should return encrypted connection", async () => {
			await sendProtocolHello(clientConn, 1)
			await sendHostIdMessage(clientConn, pair.remote.hostId)

			const result = await server.handleIncomingConn(serverConn)
			expect(result.conn).toBeDefined()
			expect(typeof result.conn.send).toBe("function")
			expect(typeof result.conn.receive).toBe("function")
			expect(typeof result.conn.close).toBe("function")
		})

		test("should handle connection errors gracefully", async () => {
			await sendProtocolHello(clientConn, 1)
			clientConn.close() // Close connection before sending hostId

			await expect(server.handleIncomingConn(serverConn)).rejects.toThrow(
				"Connection closed",
			)
		})

		test("should send protocol response to client", async () => {
			await sendProtocolHello(clientConn, 1)
			await sendHostIdMessage(clientConn, pair.remote.hostId)

			// Start the server handshake
			const resultPromise = server.handleIncomingConn(serverConn)

			// Verify server sends protocol response
			const response = await clientConn.receive()
			const encoder = createTestEncoder()
			const decodedResponse = encoder.decode(response)

			expect(decodedResponse).toEqual({
				protocol: "tws-peer-pair",
				version: 1,
			})

			await resultPromise
		})
	})

	describe("handleIncomingConn - Edge Cases", () => {
		test("should handle concurrent connections", async () => {
			const [clientConn2, serverConn2] =
				MockConn.createConnectedPair<ArrayBuffer>()

			// Setup both connections
			await sendProtocolHello(clientConn, 1)
			await sendHostIdMessage(clientConn, pair.remote.hostId)

			await sendProtocolHello(clientConn2, 1)
			await sendHostIdMessage(clientConn2, pair.remote.hostId)

			// Handle both concurrently
			const [result1, result2] = await Promise.all([
				server.handleIncomingConn(serverConn),
				server.handleIncomingConn(serverConn2),
			])

			expect(result1.remoteHostId).toBe(pair.remote.hostId)
			expect(result2.remoteHostId).toBe(pair.remote.hostId)
			expect(result1.conn).not.toBe(result2.conn)
		})

		test("should handle empty encryption keys", async () => {
			const emptyKeyPair = makeDummyPairData()
			emptyKeyPair.remote.encryptionKey = new ArrayBuffer(0)
			emptyKeyPair.local.encryptionKey = new ArrayBuffer(0)

			const emptyKeyServer = new PairServer({ pairs: [emptyKeyPair] })

			await sendProtocolHello(clientConn, 1)
			await sendHostIdMessage(clientConn, emptyKeyPair.remote.hostId)

			await expect(
				emptyKeyServer.handleIncomingConn(serverConn),
			).rejects.toThrow()
		})

		test("should validate returned result structure", async () => {
			await sendProtocolHello(clientConn, 1)
			await sendHostIdMessage(clientConn, pair.remote.hostId)

			const result = await server.handleIncomingConn(serverConn)

			// Verify result has all required properties
			expect(result).toHaveProperty("conn")
			expect(result).toHaveProperty("remoteHostId")
			expect(result).toHaveProperty("remotePairData")

			// Verify types
			expect(typeof result.remoteHostId).toBe("string")
			expect(result.remotePairData).toEqual(pair)
		})
	})
})
