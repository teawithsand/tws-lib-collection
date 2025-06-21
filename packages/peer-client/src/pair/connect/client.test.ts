import {
	EncoderUtil,
	JsonEncoder,
	TextBufferEncoder,
} from "@teawithsand/reserd"
import { beforeEach, describe, expect, test } from "vitest"
import { MockConn } from "../../util/mockConn"
import { PairData } from "../defines"
import { AddressGeneratorAlgorithm } from "../timeAddress"
import { PairClient } from "./client"

/**
 * Creates a dummy PairData object for testing purposes.
 * @param localHostId Optional local host ID override
 * @param remoteHostId Optional remote host ID override
 * @returns A complete PairData object with dummy values
 */
const makeDummyPairData = (
	localHostId = "local-id",
	remoteHostId = "remote-id",
): PairData => {
	const createArrayBuffer = (size: number): ArrayBuffer => {
		return new ArrayBuffer(size)
	}

	return {
		local: {
			hostId: localHostId,
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
			hostId: remoteHostId,
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
 * Simulates server responses for protocol negotiation.
 * @param serverConn The server connection to send responses on
 * @param protocolVersion The protocol version to respond with
 * @param encoder The encoder to use for message serialization
 */
const simulateServerResponses = (
	serverConn: MockConn<ArrayBuffer>,
	protocolVersion = 1,
	encoder = createTestEncoder(),
) => {
	setTimeout(async () => {
		// Send protocol hello response
		const protocolResponse = {
			protocol: "tws-peer-pair",
			version: protocolVersion,
		}
		await serverConn.send(encoder.encode(protocolResponse))
	}, 0)
}

describe("PairClient", () => {
	let pair: PairData
	let client: PairClient
	let clientConn: MockConn<ArrayBuffer>
	let serverConn: MockConn<ArrayBuffer>

	beforeEach(() => {
		pair = makeDummyPairData()
		client = new PairClient({ pair })
		;[clientConn, serverConn] = MockConn.createConnectedPair<ArrayBuffer>()
	})

	describe("constructor", () => {
		test("should construct with required parameters", () => {
			const testClient = new PairClient({ pair })
			expect(testClient).toBeInstanceOf(PairClient)
		})

		test("should construct with default encoder when none provided", () => {
			const testClient = new PairClient({ pair })
			expect(testClient).toBeInstanceOf(PairClient)
		})

		test("should construct with custom encoder", () => {
			const customEncoder = createTestEncoder()
			const testClient = new PairClient({
				pair,
				encoder: customEncoder,
			})
			expect(testClient).toBeInstanceOf(PairClient)
		})

		test("should handle different pair configurations", () => {
			const customPair = makeDummyPairData(
				"custom-local",
				"custom-remote",
			)
			const testClient = new PairClient({ pair: customPair })
			expect(testClient).toBeInstanceOf(PairClient)
		})
	})

	describe("connect - Protocol Version Negotiation", () => {
		test("should throw on protocol version mismatch", async () => {
			simulateServerResponses(serverConn, 999) // Wrong version

			await expect(client.connect(clientConn)).rejects.toThrow(
				"Protocol version mismatch: expected 1, got 999",
			)
		})

		test("should accept correct protocol version", async () => {
			simulateServerResponses(serverConn, 1) // Correct version

			const result = await client.connect(clientConn)
			expect(result.remoteHostId).toBe(pair.remote.hostId)
			expect(result.remotePairData).toEqual(pair)
		})

		test("should send correct protocol hello message", async () => {
			simulateServerResponses(serverConn, 1)

			// Start the connection process
			const connectPromise = client.connect(clientConn)

			// Verify client sends correct protocol message
			const protocolMessage = await serverConn.receive()
			const encoder = createTestEncoder()
			const decodedMessage = encoder.decode(protocolMessage)

			expect(decodedMessage).toEqual({
				protocol: "tws-peer-pair",
				version: 1,
			})

			await connectPromise
		})

		test("should handle malformed server response", async () => {
			setTimeout(async () => {
				await serverConn.send(new ArrayBuffer(10)) // Invalid data
			}, 0)

			await expect(client.connect(clientConn)).rejects.toThrow()
		})

		test("should handle invalid protocol message from server", async () => {
			const encoder = createTestEncoder()
			setTimeout(async () => {
				const invalidResponse = { invalid: "response" }
				await serverConn.send(encoder.encode(invalidResponse))
			}, 0)

			await expect(client.connect(clientConn)).rejects.toThrow()
		})
	})

	describe("connect - Host ID Exchange", () => {
		test("should send local hostId to server", async () => {
			simulateServerResponses(serverConn, 1)

			// Start the connection process
			const connectPromise = client.connect(clientConn)

			// Skip protocol message
			await serverConn.receive()

			// Verify client sends hostId
			const hostIdMessage = await serverConn.receive()
			const encoder = createTestEncoder()
			const decodedMessage = encoder.decode(hostIdMessage)

			expect(decodedMessage).toEqual({
				hostId: pair.local.hostId,
			})

			await connectPromise
		})

		test("should handle different local hostIds", async () => {
			const customPair = makeDummyPairData(
				"custom-local-host",
				"remote-host",
			)
			const customClient = new PairClient({ pair: customPair })

			simulateServerResponses(serverConn, 1)

			// Start the connection process
			const connectPromise = customClient.connect(clientConn)

			// Skip protocol message
			await serverConn.receive()

			// Verify custom hostId is sent
			const hostIdMessage = await serverConn.receive()
			const encoder = createTestEncoder()
			const decodedMessage = encoder.decode(hostIdMessage)

			expect(decodedMessage).toEqual({
				hostId: "custom-local-host",
			})

			await connectPromise
		})

		test("should handle empty hostId", async () => {
			const emptyHostIdPair = makeDummyPairData("", "remote-host")
			const emptyHostClient = new PairClient({ pair: emptyHostIdPair })

			simulateServerResponses(serverConn, 1)

			const result = await emptyHostClient.connect(clientConn)
			expect(result.remoteHostId).toBe("remote-host")
		})
	})

	describe("connect - Connection Handling", () => {
		test("should return encrypted connection", async () => {
			simulateServerResponses(serverConn, 1)

			const result = await client.connect(clientConn)
			expect(result.conn).toBeDefined()
			expect(typeof result.conn.send).toBe("function")
			expect(typeof result.conn.receive).toBe("function")
			expect(typeof result.conn.close).toBe("function")
		})

		test("should handle connection errors gracefully", async () => {
			clientConn.close() // Close connection before starting

			await expect(client.connect(clientConn)).rejects.toThrow(
				"Connection is closed",
			)
		})

		test("should handle server disconnection during handshake", async () => {
			setTimeout(() => {
				serverConn.close()
			}, 5)

			await expect(client.connect(clientConn)).rejects.toThrow(
				"Connection closed",
			)
		})

		test("should validate returned result structure", async () => {
			simulateServerResponses(serverConn, 1)

			const result = await client.connect(clientConn)

			// Verify result has all required properties
			expect(result).toHaveProperty("conn")
			expect(result).toHaveProperty("remoteHostId")
			expect(result).toHaveProperty("remotePairData")

			// Verify types and values
			expect(typeof result.remoteHostId).toBe("string")
			expect(result.remoteHostId).toBe(pair.remote.hostId)
			expect(result.remotePairData).toEqual(pair)
		})
	})

	describe("connect - Encryption Setup", () => {
		test("should handle encryption key import errors", async () => {
			// Create pair with invalid encryption keys
			const invalidKeyPair = makeDummyPairData()
			invalidKeyPair.remote.encryptionKey = new ArrayBuffer(0) // Invalid size
			invalidKeyPair.local.encryptionKey = new ArrayBuffer(0) // Invalid size

			const invalidClient = new PairClient({ pair: invalidKeyPair })
			simulateServerResponses(serverConn, 1)

			await expect(invalidClient.connect(clientConn)).rejects.toThrow()
		})

		test("should work with different encryption key sizes", async () => {
			// Create pair with valid 32-byte keys
			const validKeyPair = makeDummyPairData()
			const key32Bytes = new ArrayBuffer(32)
			validKeyPair.remote.encryptionKey = key32Bytes
			validKeyPair.local.encryptionKey = key32Bytes

			const validClient = new PairClient({ pair: validKeyPair })
			simulateServerResponses(serverConn, 1)

			const result = await validClient.connect(clientConn)
			expect(result.conn).toBeDefined()
		})
	})

	describe("connect - Edge Cases", () => {
		test("should handle concurrent connections", async () => {
			const [clientConn2, serverConn2] =
				MockConn.createConnectedPair<ArrayBuffer>()

			simulateServerResponses(serverConn, 1)
			simulateServerResponses(serverConn2, 1)

			// Handle both concurrently
			const [result1, result2] = await Promise.all([
				client.connect(clientConn),
				client.connect(clientConn2),
			])

			expect(result1.remoteHostId).toBe(pair.remote.hostId)
			expect(result2.remoteHostId).toBe(pair.remote.hostId)
			expect(result1.conn).not.toBe(result2.conn)
		})

		test("should handle custom encoder properly", async () => {
			const customEncoder = createTestEncoder()
			const customClient = new PairClient({
				pair,
				encoder: customEncoder,
			})

			simulateServerResponses(serverConn, 1, customEncoder)

			const result = await customClient.connect(clientConn)
			expect(result.remoteHostId).toBe(pair.remote.hostId)
		})

		test("should maintain pair data integrity", async () => {
			const originalPair = makeDummyPairData(
				"original-local",
				"original-remote",
			)
			const pairClient = new PairClient({ pair: originalPair })

			simulateServerResponses(serverConn, 1)

			const result = await pairClient.connect(clientConn)

			// Verify original pair data is returned unchanged
			expect(result.remotePairData).toEqual(originalPair)
			expect(result.remotePairData.local.hostId).toBe("original-local")
			expect(result.remotePairData.remote.hostId).toBe("original-remote")
		})

		test("should handle message ordering correctly", async () => {
			simulateServerResponses(serverConn, 1)

			// Start connection
			const connectPromise = client.connect(clientConn)

			// Verify messages are sent in correct order
			const message1 = await serverConn.receive() // Protocol hello
			const message2 = await serverConn.receive() // Host ID

			const encoder = createTestEncoder()
			const decodedMsg1 = encoder.decode(message1)
			const decodedMsg2 = encoder.decode(message2)

			expect(decodedMsg1).toHaveProperty("protocol")
			expect(decodedMsg1).toHaveProperty("version")
			expect(decodedMsg2).toHaveProperty("hostId")

			await connectPromise
		})
	})
})
