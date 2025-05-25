import Peer from "peerjs"
import { Client, Conn } from "../conn"
import { PeerJsConn } from "./peerjs-conn"

export interface PeerJsClientAddress {
	readonly peerId: string
}

export class PeerJsClient implements Client<PeerJsClientAddress, string> {
	private peer: Peer

	public constructor(existingPeer: Peer) {
		this.peer = existingPeer
		// Ensure peer is not destroyed or disconnected
		if (this.peer.destroyed || this.peer.disconnected) {
			throw new Error(
				"Provided Peer instance is already destroyed or disconnected.",
			)
		}
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
						resolve(this.peer)
					} else {
						reject(new Error("Failed to reconnect peer."))
					}
				})
				this.peer.once("error", (err) => {
					reject(
						new Error(
							`PeerJS client error during reconnect: ${err.type}`,
						),
					)
				})
				this.peer.reconnect()
			})
		}
		if (!this.peer.open) {
			return new Promise((resolve, reject) => {
				this.peer.once("open", (id) => {
					if (id) {
						resolve(this.peer)
					} else {
						reject(new Error("Failed to get peer ID."))
					}
				})
				this.peer.once("error", (err) => {
					reject(new Error(`PeerJS client error: ${err.type}`))
				})
			})
		}
		return this.peer
	}

	public readonly connect = async (
		address: PeerJsClientAddress,
	): Promise<Conn<string>> => {
		const localPeer = await this.ensurePeer()
		const dataConnection = localPeer.connect(address.peerId, {
			reliable: true,
		})

		return new Promise<Conn<string>>((resolve, reject) => {
			dataConnection.once("open", () => {
				resolve(new PeerJsConn(dataConnection))
			})
			dataConnection.once("error", (err) => {
				reject(
					new Error(
						`Failed to connect to ${address.peerId}: ${err.type}`,
					),
				)
			})
		})
	}
}
