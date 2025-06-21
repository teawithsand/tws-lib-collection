import { describe, expect, test, vi } from "vitest"
import { WebRTCConnICE } from "./defines"
import { WebRTCClientImpl, WebRTCServerImpl } from "./implementation"

// Helper to simulate signaling and ICE candidate exchange
async function exchangeIceCandidates(
	clientIce: WebRTCConnICE,
	serverIce: WebRTCConnICE,
) {
	console.log("exchangeIceCandidates: Getting client local ICE candidates...")
	const clientCandidatesPromise = clientIce.getLocalIceCandidates()
	console.log("exchangeIceCandidates: Getting server local ICE candidates...")
	const serverCandidatesPromise = serverIce.getLocalIceCandidates()

	const [clientCandidates, serverCandidates] = await Promise.all([
		clientCandidatesPromise,
		serverCandidatesPromise,
	])
	console.log(
		`exchangeIceCandidates: Client candidates count: ${clientCandidates.length}`,
	)
	console.log(
		`exchangeIceCandidates: Server candidates count: ${serverCandidates.length}`,
	)

	console.log("exchangeIceCandidates: Adding client candidates to server...")
	const clientAddPromises = clientCandidates.map((c) => {
		console.log("exchangeIceCandidates: Server adding remote candidate:", c)
		return serverIce.addRemoteIceCandidate(c)
	})
	console.log("exchangeIceCandidates: Adding server candidates to client...")
	const serverAddPromises = serverCandidates.map((c) => {
		console.log("exchangeIceCandidates: Client adding remote candidate:", c)
		return clientIce.addRemoteIceCandidate(c)
	})

	console.log(
		"exchangeIceCandidates: Waiting for all candidates to be added...",
	)
	await Promise.all([...clientAddPromises, ...serverAddPromises])
	console.log("exchangeIceCandidates: All candidates added.")
}

// Helper to convert ArrayBuffer to string for easy comparison
const abToString = (buf: ArrayBuffer) => new TextDecoder().decode(buf)
// Helper to convert string to ArrayBuffer
const stringToAb = (str: string) => new TextEncoder().encode(str).buffer

// TODO(teawithsand): make tests pass on Firefox as well
/*
const describeOrSkip =
	typeof navigator !== "undefined" &&
	navigator.userAgent.toLowerCase().includes("firefox")
		? describe.skip
		: describe
*/

describe.skip("WebRTCClientImpl and WebRTCServerImpl Integration Test", () => {
	test("should establish a connection and exchange messages", async () => {
		// Set a longer timeout for this test as WebRTC setup can take time
		vi.setConfig({ testTimeout: 20000 })
		console.log("Test started")

		const rtcConfiguration: RTCConfiguration = {
			iceServers: [
				/*
				{
					urls: "stun:stun.l.google.com:19302",
				},
				{
					urls: "stun:stun1.l.google.com:19302",
				},
				*/
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
		const client = new WebRTCClientImpl(rtcConfiguration)
		const server = new WebRTCServerImpl({ configuration: rtcConfiguration })
		console.log("Client and Server impl instantiated")

		// 1. Client initiates
		console.log("Client: Calling begin()")
		const clientConnInit = await client.begin()
		console.log(
			"Client: begin() completed, clientSdp length:",
			clientConnInit.clientSdp.byteLength,
		)
		console.log("Client SDP Offer:\n", abToString(clientConnInit.clientSdp))

		// 2. Server answers
		console.log("Server: Calling answerConnect()")
		const serverAcceptResult = await server.answerConnect(
			clientConnInit.clientSdp,
		)
		console.log(
			"Server: answerConnect() completed, answerSdp length:",
			serverAcceptResult.answerSdp.byteLength,
		)
		console.log(
			"Server SDP Answer:\n",
			abToString(serverAcceptResult.answerSdp),
		)

		// 3. Client handles answer
		console.log("Client: Calling handleAnswerSdp()")
		const clientIce = await clientConnInit.handleAnswerSdp(
			serverAcceptResult.answerSdp,
		)
		console.log("Client: handleAnswerSdp() completed")
		const serverIce = serverAcceptResult.iceHandler

		// 4. Exchange ICE candidates
		console.log("Exchanging ICE candidates...")
		await exchangeIceCandidates(clientIce, serverIce)
		console.log("ICE candidates exchanged")

		// 5. Finalize connections
		console.log("Finalizing client connection...")
		const clientConnPromise = clientIce.finalize()
		console.log("Finalizing server connection...")
		const serverConnPromise = serverIce.finalize()

		const [clientConn, serverConn] = await Promise.all([
			clientConnPromise,
			serverConnPromise,
		])
		console.log(
			"Connections finalized. Client and server connections obtained.",
		)

		expect(clientConn).toBeDefined()
		expect(serverConn).toBeDefined()
		console.log("Connection objects defined checks passed.")

		// 6. Test sending message from client to server
		const messageFromClient = "Hello from client!"
		console.log(`Client: Sending message: "${messageFromClient}"`)
		const clientSendPromise = clientConn.send(stringToAb(messageFromClient))
		console.log("Client: Waiting for server to receive message...")
		const serverReceivePromise = serverConn.receive()

		await clientSendPromise
		console.log("Client: send() promise resolved.")
		const receivedByServer = await serverReceivePromise
		console.log(
			`Server: Received message: "${abToString(receivedByServer)}"`,
		)
		expect(abToString(receivedByServer)).toBe(messageFromClient)
		console.log("Client to Server message check passed.")

		// 7. Test sending message from server to client
		const messageFromServer = "Hello from server!"
		console.log(`Server: Sending message: "${messageFromServer}"`)
		const serverSendPromise = serverConn.send(stringToAb(messageFromServer))
		console.log("Server: Waiting for client to receive message...")
		const clientReceivePromise = clientConn.receive()

		await serverSendPromise
		console.log("Server: send() promise resolved.")
		const receivedByClient = await clientReceivePromise
		console.log(
			`Client: Received message: "${abToString(receivedByClient)}"`,
		)
		expect(abToString(receivedByClient)).toBe(messageFromServer)
		console.log("Server to Client message check passed.")

		// 8. Close connections
		console.log("Closing client connection...")
		clientConn.close()
		console.log("Closing server connection...")
		serverConn.close()
		console.log("Connections closed.")

		// Add a small delay to allow close operations to complete and avoid race conditions in cleanup
		await new Promise((resolve) => setTimeout(resolve, 100))
		console.log("Test finished.")
	}, 20000) // Vitest timeout for the test itself
})
