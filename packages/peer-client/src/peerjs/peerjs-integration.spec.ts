import Peer, { PeerJSOption } from "peerjs"
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest"
import { Conn } from "../conn"
import { PeerJsClient } from "./peerjs-client"
import { PeerJsServer, PeerJsServerAddress } from "./peerjs-server"

// Helper function to create and open a Peer instance
const createPeer = (id?: string, config?: RTCConfiguration): Promise<Peer> => {
	return new Promise((resolve, reject) => {
		// Peer constructor can take an optional ID and options.
		const peerOptions: PeerJSOption = {
			...(config && { config }), // Add config if provided
		}
		const peer = id ? new Peer(id, peerOptions) : new Peer(peerOptions)
		const timeout = setTimeout(
			() =>
				reject(
					new Error(
						`Peer creation ${id ? "for " + id : ""} timed out after 15s`,
					),
				),
			15000,
		) // 15 seconds timeout

		peer.on("open", (peerId) => {
			clearTimeout(timeout)
			console.log(`Peer opened with ID: ${peerId}`)
			resolve(peer)
		})
		peer.on("error", (err) => {
			clearTimeout(timeout)
			console.error(`Peer error for ${id ? id : peer.id}:`, err)
			reject(err)
		})
		peer.on("disconnected", () => {
			console.warn(`Peer ${peer.id} disconnected from signaling server.`)
		})
		peer.on("close", () => {
			console.log(`Peer ${peer.id} connection closed.`)
		})
	})
}

// TODO(teawithsand): make tests pass on Firefox as well
/*
const describeOrSkip =
	typeof navigator !== "undefined" &&
	navigator.userAgent.toLowerCase().includes("firefox")
		? describe.skip
		: describe
*/

describe.skip("PeerJsClient and PeerJsServer Integration Test", () => {
	let serverPeer: Peer
	let clientPeer: Peer
	let peerServer: PeerJsServer
	let peerClient: PeerJsClient

	vi.setConfig({ testTimeout: 30000 }) // 30 seconds

	beforeAll(async () => {
		try {
			const rtcConfiguration: RTCConfiguration = {
				iceServers: [
					{
						urls: "stun:127.0.0.1:3478",
					},
					{
						urls: "turn:127.0.0.1:3478",
						username: "testuser",
						credential: "testpassword",
					},
				],
			}
			console.log("beforeAll: Creating server peer...")
			serverPeer = await createPeer(undefined, rtcConfiguration)
			console.log(
				`beforeAll: Server peer created with ID: ${serverPeer.id}`,
			)

			console.log("beforeAll: Creating client peer...")
			clientPeer = await createPeer(undefined, rtcConfiguration)
			console.log(
				`beforeAll: Client peer created with ID: ${clientPeer.id}`,
			)

			if (!serverPeer || !clientPeer) {
				throw new Error("Failed to create one or both Peer instances.")
			}
			if (!serverPeer.open || !clientPeer.open) {
				throw new Error(
					"One or both Peer instances are not open after creation.",
				)
			}

			peerServer = new PeerJsServer(serverPeer)
			peerClient = new PeerJsClient(clientPeer)
			console.log(
				"beforeAll: PeerJsServer and PeerJsClient instantiated.",
			)
		} catch (error) {
			console.error("Error in beforeAll:", error)
			if (serverPeer && !serverPeer.destroyed) serverPeer.destroy()
			if (clientPeer && !clientPeer.destroyed) clientPeer.destroy()
			throw error
		}
	})

	afterAll(async () => {
		console.log("afterAll: Cleaning up...")

		if (clientPeer && !clientPeer.destroyed) {
			console.log(`afterAll: Destroying client peer ${clientPeer.id}`)
			clientPeer.destroy()
		}
		if (serverPeer && !serverPeer.destroyed) {
			console.warn(
				`afterAll: Server peer ${serverPeer.id} was not destroyed. Destroying manually.`,
			)
			serverPeer.destroy()
		}
		console.log("afterAll: Cleanup complete.")
		await new Promise((resolve) => setTimeout(resolve, 200))
	})

	test("should establish a connection and exchange messages", async () => {
		console.log("Test: Starting connection establishment...")

		const serverAddressPromise: Promise<PeerJsServerAddress> =
			peerServer.getAddress()
		console.log("Test: Waiting for server address...")
		const serverAddress = await serverAddressPromise
		console.log("Test: Server address obtained:", serverAddress)

		expect(serverAddress.peerId).toBe(serverPeer.id)

		console.log(
			`Test: Client connecting to server address: ${serverAddress.peerId}`,
		)
		const clientConnPromise: Promise<Conn<string>> =
			peerClient.connect(serverAddress)

		console.log("Test: Server accepting connection...")
		const serverConnPromise: Promise<Conn<string>> = peerServer.accept()

		let clientConn: Conn<string>
		let serverConn: Conn<string>

		try {
			;[clientConn, serverConn] = await Promise.all([
				clientConnPromise,
				serverConnPromise,
			])
			console.log("Test: Connections established for client and server.")
		} catch (error) {
			console.error("Test: Error establishing connection:", error)
			console.error(
				`Client peer state: id=${clientPeer?.id}, open=${clientPeer?.open}, disconnected=${clientPeer?.disconnected}, destroyed=${clientPeer?.destroyed}`,
			)
			console.error(
				`Server peer state: id=${serverPeer?.id}, open=${serverPeer?.open}, disconnected=${serverPeer?.disconnected}, destroyed=${serverPeer?.destroyed}`,
			)
			throw error
		}

		expect(clientConn).toBeDefined()
		expect(serverConn).toBeDefined()
		console.log("Test: Connection objects defined checks passed.")

		const messageFromClient = `Hello from client ${clientPeer.id} at ${new Date().toISOString()}!`
		console.log(`Test: Client sending message: "${messageFromClient}"`)
		await clientConn.send(messageFromClient)
		console.log("Test: Client waiting for server to receive message...")
		const receivedByServer = await serverConn.receive()
		console.log(`Test: Server received message: "${receivedByServer}"`)
		expect(receivedByServer).toBe(messageFromClient)
		console.log("Test: Client to Server message check passed.")

		const messageFromServer = `Hello from server ${serverPeer.id} at ${new Date().toISOString()}!`
		console.log(`Test: Server sending message: "${messageFromServer}"`)
		await serverConn.send(messageFromServer)
		console.log("Test: Server waiting for client to receive message...")
		const receivedByClient = await clientConn.receive()
		console.log(`Test: Client received message: "${receivedByClient}"`)
		expect(receivedByClient).toBe(messageFromServer)
		console.log("Test: Server to Client message check passed.")

		console.log("Test: Closing client connection object...")
		clientConn.close()
		console.log("Test: Closing server connection object...")
		serverConn.close()
		console.log("Test: Individual connection objects closed.")

		await expect(clientConn.receive()).rejects.toThrow(/Connection closed/)
		await expect(serverConn.receive()).rejects.toThrow(/Connection closed/)
		console.log("Test: Post-close receive checks passed.")
	})
})
