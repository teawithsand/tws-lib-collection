import Peer from "peerjs"
import { Conn } from "../conn"
import { MessageQueue } from "../util/messageQueue"
import { PeerJsConn } from "./peerjs-conn"

// TODO: consider adding logger

export interface PeerJsServerAddress {
	readonly peerId: string
}

export class PeerJsServer {
	private peer: Peer
	private readonly incomingConnections: MessageQueue<Conn<string>>

	public constructor(existingPeer: Peer) {
		this.incomingConnections = new MessageQueue<Conn<string>>()
		this.peer = existingPeer

		if (this.peer.destroyed || this.peer.disconnected) {
			throw new Error(
				"Provided Peer instance is already destroyed or disconnected.",
			)
		}

		if (this.peer.open) {
			this.subscribeToConnections()
		} else {
			this.peer.once("open", () => {
				this.subscribeToConnections()
			})
		}

		this.peer.once("error", (err) => {
			this.incomingConnections.setError(err) // Propagate error to accepters
		})
	}

	private readonly ensurePeer = async (): Promise<Peer> => {
		if (this.peer.destroyed) {
			throw new Error("Peer is destroyed.")
		}
		if (this.peer.disconnected) {
			// This attempts to reconnect the disconnected peer.
			// Depending on the desired behavior, you might want to throw an error instead.
			return new Promise((resolve, reject) => {
				this.peer.once("open", (id) => {
					if (id) {
						// Re-subscribe if necessary, though typically .on handlers persist.
						// this.subscribeToConnections();
						resolve(this.peer)
					} else {
						reject(new Error("Failed to reconnect server peer."))
					}
				})
				this.peer.once("error", (err) => {
					this.incomingConnections.setError(err)
					reject(
						new Error(
							`PeerJS server error during reconnect: ${err.type}`,
						),
					)
				})
				this.peer.reconnect()
			})
		}
		if (!this.peer.open) {
			return new Promise((resolve, reject) => {
				this.peer.once("open", (peerId) => {
					if (peerId) {
						// subscribeToConnections should have been called by constructor or open event
						resolve(this.peer)
					} else {
						reject(new Error("Failed to get peer ID for server."))
					}
				})
				this.peer.once("error", (err) => {
					this.incomingConnections.setError(err)
					reject(new Error(`PeerJS server error: ${err.type}`))
				})
			})
		}
		return this.peer
	}

	private readonly subscribeToConnections = (): void => {
		this.peer.on("connection", (dataConnection) => {
			// Wait for the data connection to be truly open
			dataConnection.once("open", () => {
				const conn = new PeerJsConn(dataConnection)
				// Always queue connections now
				try {
					this.incomingConnections.send(conn)
				} catch (e) {
					// Queue might be full or errored
					console.warn("Failed to queue incoming connection:", e)
					conn.close() // Close the connection if we can't queue it
				}
			})
			dataConnection.once("error", (err) => {
				console.warn("Incoming data connection failed to open:", err)
				// Don't add to queue if it errors before opening
			})
		})
	}

	public readonly accept = async (): Promise<Conn<string>> => {
		// Ensure peer is initialized so it can receive connections
		await this.ensurePeer()
		return this.incomingConnections.receive()
	}

	public readonly getAddress = async (): Promise<PeerJsServerAddress> => {
		const localPeer = await this.ensurePeer()
		if (!localPeer.id) {
			throw new Error(
				"PeerJS server does not have an ID after ensuring peer.",
			)
		}
		return { peerId: localPeer.id }
	}

	public readonly close = (): void => {
		this.incomingConnections.setError(
			new Error("PeerJsServer closed."),
			true,
		)
	}
}
