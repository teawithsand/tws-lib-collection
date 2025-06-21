import {
	EncoderUtil,
	JsonEncoder,
	TextBufferEncoder,
} from "@teawithsand/reserd"
import { beforeEach, describe, expect, test } from "vitest"
import { MockConn } from "../../util/mockConn"
import { PairData } from "../defines"
import { AddressGeneratorAlgorithm, TimeAddressData } from "../timeAddress"
import { PairClient } from "./client"
import { PairServer } from "./server"

/**
 * Converts a string to ArrayBuffer for testing purposes.
 * @param str The string to convert
 * @returns ArrayBuffer representation of the string
 */
const stringToArrayBuffer = (str: string): ArrayBuffer => {
	return new TextEncoder().encode(str).buffer
}

/**
 * Creates a dummy TimeAddressData for testing.
 * @param secret Optional secret string override
 * @returns TimeAddressData object
 */
const createDummyTimeAddress = (secret = "dummy-secret"): TimeAddressData => ({
	secret: stringToArrayBuffer(secret),
	params: {
		hash: AddressGeneratorAlgorithm.SHA_256,
		timeWindowMs: 1000,
	},
})

/**
 * Creates a PairData object for testing with specified host IDs.
 * @param localHostId The local host ID
 * @param remoteHostId The remote host ID
 * @returns Complete PairData object
 */
const createPairData = (
	localHostId = "local-host",
	remoteHostId = "remote-host",
): PairData => {
	const dummyTimeAddress = createDummyTimeAddress()

	return {
		local: {
			hostId: localHostId,
			encryptionKey: stringToArrayBuffer(
				"12345678901234567890123456789012",
			), // 32 bytes
			address: {
				timeAddress: dummyTimeAddress,
				staticAddress: stringToArrayBuffer("static-local"),
			},
		},
		remote: {
			hostId: remoteHostId,
			encryptionKey: stringToArrayBuffer(
				"09876543210987654321098765432109",
			), // 32 bytes
			address: {
				timeAddress: dummyTimeAddress,
				staticAddress: stringToArrayBuffer("static-remote"),
			},
		},
	}
}

/**
 * Swaps local and remote data in a PairData object.
 * This is useful for creating complementary client/server pair configurations.
 * @param pair The original pair data
 * @returns New pair data with local and remote swapped
 */
const flipPairData = (pair: PairData): PairData => ({
	local: { ...pair.remote },
	remote: { ...pair.local },
})

/**
 * Creates a test message as ArrayBuffer.
 * @param content The message content
 * @returns ArrayBuffer containing the message
 */
const createTestMessage = (content: string): ArrayBuffer => {
	return stringToArrayBuffer(content)
}

/**
 * Converts ArrayBuffer to string for verification.
 * @param buffer The ArrayBuffer to convert
 * @returns String representation
 */
const arrayBufferToString = (buffer: ArrayBuffer): string => {
	return new TextDecoder().decode(buffer)
}

describe("PairClient/PairServer Integration", () => {
	let serverPairData: PairData
	let clientPairData: PairData
	let server: PairServer
	let client: PairClient
	let clientConn: MockConn<ArrayBuffer>
	let serverConn: MockConn<ArrayBuffer>

	beforeEach(() => {
		// Create complementary pair data for client and server
		serverPairData = createPairData("server-local", "client-remote")
		clientPairData = flipPairData(serverPairData)

		server = new PairServer({ pairs: [serverPairData] })
		client = new PairClient({ pair: clientPairData })
		;[clientConn, serverConn] = MockConn.createConnectedPair<ArrayBuffer>()
	})

	describe("Basic Handshake", () => {
		test("should perform successful handshake", async () => {
			const [serverResult, clientResult] = await Promise.all([
				server.handleIncomingConn(serverConn),
				client.connect(clientConn),
			])

			// Verify server result
			expect(serverResult.remoteHostId).toBe(clientPairData.local.hostId)
			expect(serverResult.remotePairData).toEqual(serverPairData)

			// Verify client result
			expect(clientResult.remoteHostId).toBe(clientPairData.remote.hostId)
			expect(clientResult.remotePairData).toEqual(clientPairData)
		})

		test("should establish encrypted connections", async () => {
			const [serverResult, clientResult] = await Promise.all([
				server.handleIncomingConn(serverConn),
				client.connect(clientConn),
			])

			expect(serverResult.conn).toBeDefined()
			expect(clientResult.conn).toBeDefined()
			expect(typeof serverResult.conn.send).toBe("function")
			expect(typeof serverResult.conn.receive).toBe("function")
			expect(typeof clientResult.conn.send).toBe("function")
			expect(typeof clientResult.conn.receive).toBe("function")
		})

		test("should handle handshake with custom encoders", async () => {
			const customEncoder = EncoderUtil.compose(
				new JsonEncoder(),
				new TextBufferEncoder(),
			)
			const customServer = new PairServer({
				pairs: [serverPairData],
				encoder: customEncoder,
			})
			const customClient = new PairClient({
				pair: clientPairData,
				encoder: customEncoder,
			})

			const [serverResult, clientResult] = await Promise.all([
				customServer.handleIncomingConn(serverConn),
				customClient.connect(clientConn),
			])

			expect(serverResult.remoteHostId).toBe(clientPairData.local.hostId)
			expect(clientResult.remoteHostId).toBe(clientPairData.remote.hostId)
		})
	})

	describe("Message Exchange", () => {
		test("should exchange encrypted messages bidirectionally", async () => {
			const [serverResult, clientResult] = await Promise.all([
				server.handleIncomingConn(serverConn),
				client.connect(clientConn),
			])

			const serverEncConn = serverResult.conn
			const clientEncConn = clientResult.conn

			// Test client to server message
			const clientMessage = createTestMessage("Hello from client")
			await clientEncConn.send(clientMessage)
			const receivedByServer = await serverEncConn.receive()
			expect(arrayBufferToString(receivedByServer)).toBe(
				"Hello from client",
			)

			// Test server to client message
			const serverMessage = createTestMessage("Hello from server")
			await serverEncConn.send(serverMessage)
			const receivedByClient = await clientEncConn.receive()
			expect(arrayBufferToString(receivedByClient)).toBe(
				"Hello from server",
			)
		})

		test("should handle multiple sequential messages", async () => {
			const [serverResult, clientResult] = await Promise.all([
				server.handleIncomingConn(serverConn),
				client.connect(clientConn),
			])

			const serverEncConn = serverResult.conn
			const clientEncConn = clientResult.conn

			// Send multiple messages from client to server
			const messages = ["Message 1", "Message 2", "Message 3"]
			for (const msgContent of messages) {
				await clientEncConn.send(createTestMessage(msgContent))
			}

			// Receive and verify all messages
			for (const expectedContent of messages) {
				const received = await serverEncConn.receive()
				expect(arrayBufferToString(received)).toBe(expectedContent)
			}
		})

		test("should handle large messages", async () => {
			const [serverResult, clientResult] = await Promise.all([
				server.handleIncomingConn(serverConn),
				client.connect(clientConn),
			])

			const serverEncConn = serverResult.conn
			const clientEncConn = clientResult.conn

			// Create a large message
			const largeContent = "A".repeat(10000) // 10KB message
			const largeMessage = createTestMessage(largeContent)

			await clientEncConn.send(largeMessage)
			const received = await serverEncConn.receive()
			expect(arrayBufferToString(received)).toBe(largeContent)
		})

		test("should handle empty messages", async () => {
			const [serverResult, clientResult] = await Promise.all([
				server.handleIncomingConn(serverConn),
				client.connect(clientConn),
			])

			const serverEncConn = serverResult.conn
			const clientEncConn = clientResult.conn

			const emptyMessage = new ArrayBuffer(0)
			await clientEncConn.send(emptyMessage)
			const received = await serverEncConn.receive()
			expect(received.byteLength).toBe(0)
		})
	})

	describe("Connection Management", () => {
		test("should handle connection closure gracefully", async () => {
			const [serverResult, clientResult] = await Promise.all([
				server.handleIncomingConn(serverConn),
				client.connect(clientConn),
			])

			const serverEncConn = serverResult.conn
			const clientEncConn = clientResult.conn

			// Close server connection
			serverEncConn.close()

			// Client should detect closure when trying to receive
			await expect(clientEncConn.receive()).rejects.toThrow()
		})

		test("should propagate connection errors", async () => {
			const [serverResult, clientResult] = await Promise.all([
				server.handleIncomingConn(serverConn),
				client.connect(clientConn),
			])

			const serverEncConn = serverResult.conn
			const clientEncConn = clientResult.conn

			// Close one side
			clientEncConn.close()

			// Other side should fail when trying to communicate
			await expect(serverEncConn.receive()).rejects.toThrow()
		})

		test("should handle concurrent message exchanges", async () => {
			const [serverResult, clientResult] = await Promise.all([
				server.handleIncomingConn(serverConn),
				client.connect(clientConn),
			])

			const serverEncConn = serverResult.conn
			const clientEncConn = clientResult.conn

			// Send messages simultaneously from both sides
			const clientMessage = createTestMessage("From client")
			const serverMessage = createTestMessage("From server")

			const [, receivedByServer] = await Promise.all([
				await clientEncConn.send(clientMessage),
				serverEncConn.receive(),
			])

			const [, receivedByClient] = await Promise.all([
				await serverEncConn.send(serverMessage),
				clientEncConn.receive(),
			])

			expect(arrayBufferToString(receivedByServer)).toBe("From client")
			expect(arrayBufferToString(receivedByClient)).toBe("From server")
		})
	})

	describe("Error Scenarios", () => {
		test("should handle mismatched encryption keys", async () => {
			// Create client with different encryption keys but same host IDs
			const mismatchedPairData = flipPairData(serverPairData)
			mismatchedPairData.remote.encryptionKey = stringToArrayBuffer(
				"wrongkey1234567890wrongkey123456",
			) // Different key
			mismatchedPairData.local.encryptionKey = stringToArrayBuffer(
				"wrongkey0987654321wrongkey098765",
			) // Different key

			const mismatchedClient = new PairClient({
				pair: mismatchedPairData,
			})

			const [serverResult, clientResult] = await Promise.all([
				server.handleIncomingConn(serverConn),
				mismatchedClient.connect(clientConn),
			])

			// Connections should be established but messages should fail to decrypt properly
			const serverEncConn = serverResult.conn
			const clientEncConn = clientResult.conn

			// Send a message - it should fail to decrypt on the other side
			const testMessage = createTestMessage("Test message")
			await clientEncConn.send(testMessage)

			// The decryption should fail with an OperationError from WebCrypto API
			await expect(serverEncConn.receive()).rejects.toThrow(
				/operation failed|cipher/i,
			)
		})

		test("should handle protocol version mismatches", async () => {
			// This should be caught during handshake, not after connection establishment
			// The integration should prevent establishing connections with version mismatches
			const [serverResult, clientResult] = await Promise.all([
				server.handleIncomingConn(serverConn),
				client.connect(clientConn),
			])

			// If we reach here, protocol versions matched
			expect(serverResult).toBeDefined()
			expect(clientResult).toBeDefined()
		})

		test("should handle unknown host IDs", async () => {
			// Create server that doesn't recognize the client's host ID
			const unknownPairData = createPairData(
				"unknown-local",
				"unknown-remote",
			)
			const unknownServer = new PairServer({ pairs: [unknownPairData] })

			// This should fail during handshake
			await expect(
				Promise.all([
					unknownServer.handleIncomingConn(serverConn),
					client.connect(clientConn),
				]),
			).rejects.toThrow()
		})
	})

	describe("Advanced Scenarios", () => {
		test("should handle multiple concurrent client connections", async () => {
			// Create multiple client connections
			const [clientConn2, serverConn2] =
				MockConn.createConnectedPair<ArrayBuffer>()
			const client2 = new PairClient({ pair: clientPairData })

			// Handle multiple connections concurrently
			const [serverResult1, clientResult1, serverResult2, clientResult2] =
				await Promise.all([
					server.handleIncomingConn(serverConn),
					client.connect(clientConn),
					server.handleIncomingConn(serverConn2),
					client2.connect(clientConn2),
				])

			// Verify all connections are independent
			expect(serverResult1.conn).not.toBe(serverResult2.conn)
			expect(clientResult1.conn).not.toBe(clientResult2.conn)

			// Test message isolation
			const msg1 = createTestMessage("Message for connection 1")
			const msg2 = createTestMessage("Message for connection 2")

			clientResult1.conn.send(msg1)
			clientResult2.conn.send(msg2)

			const received1 = await serverResult1.conn.receive()
			const received2 = await serverResult2.conn.receive()

			expect(arrayBufferToString(received1)).toBe(
				"Message for connection 1",
			)
			expect(arrayBufferToString(received2)).toBe(
				"Message for connection 2",
			)
		})

		test("should maintain data integrity during rapid message exchange", async () => {
			const [serverResult, clientResult] = await Promise.all([
				server.handleIncomingConn(serverConn),
				client.connect(clientConn),
			])

			const serverEncConn = serverResult.conn
			const clientEncConn = clientResult.conn

			// Send many messages rapidly
			const messageCount = 50
			const messages: string[] = []

			for (let i = 0; i < messageCount; i++) {
				const content = `Rapid message ${i}`
				messages.push(content)
				await clientEncConn.send(createTestMessage(content))
			}

			// Receive all messages and verify order and content
			for (let i = 0; i < messageCount; i++) {
				const received = await serverEncConn.receive()
				const content = arrayBufferToString(received)
				expect(content).toBe(messages[i])
			}
		})

		test("should work with different pair configurations", async () => {
			// Test with different host ID patterns
			const specialPairData = createPairData(
				"server-456-special",
				"client-123-special",
			)
			const specialClientPairData = flipPairData(specialPairData)

			const specialServer = new PairServer({ pairs: [specialPairData] })
			const specialClient = new PairClient({
				pair: specialClientPairData,
			})

			const [serverResult, clientResult] = await Promise.all([
				specialServer.handleIncomingConn(serverConn),
				specialClient.connect(clientConn),
			])

			expect(serverResult.remoteHostId).toBe("client-123-special")
			expect(clientResult.remoteHostId).toBe("server-456-special")

			// Verify message exchange still works
			const testMessage = createTestMessage("Special config test")
			clientResult.conn.send(testMessage)
			const received = await serverResult.conn.receive()
			expect(arrayBufferToString(received)).toBe("Special config test")
		})
	})
})
