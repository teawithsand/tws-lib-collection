import { DataConnection } from "peerjs"
import { Conn } from "../conn"
import { MessageQueue } from "../util/messageQueue"

// TODO: consider adding logger

export class PeerJsConn implements Conn<string> {
	private readonly dataConnection: DataConnection
	private readonly receiveQueue: MessageQueue<string>
	private readonly closePromise: Promise<void>
	private closePromiseResolve?: () => void

	public constructor(dataConnection: DataConnection) {
		this.dataConnection = dataConnection
		this.receiveQueue = new MessageQueue<string>()
		this.closePromise = new Promise<void>((resolve) => {
			this.closePromiseResolve = resolve
		})

		this.dataConnection.on("data", (data) => {
			if (typeof data === "string") {
				this.receiveQueue.send(data)
			} else {
				// For simplicity, we only support string messages.
				// Alternatively, serialize/deserialize or close with an error.
				console.warn("Received non-string data:", data)
				this.receiveQueue.setError(
					new Error("Received non-string data"),
				)
				this.close()
			}
		})

		this.dataConnection.on("error", (err) => {
			this.receiveQueue.setError(err)
			this.closePromiseResolve?.()
		})

		this.dataConnection.on("close", () => {
			this.receiveQueue.setError(
				new Error("Connection closed by remote peer."),
			)
			this.closePromiseResolve?.()
		})

		// Ensure the connection is open before resolving the constructor or relevant methods
		if (this.dataConnection.open) {
			// Already open
		} else {
			this.dataConnection.once("open", () => {
				// Connection is now open
			})
		}
	}

	public readonly send = (message: string): void => {
		if (!this.dataConnection.open) {
			throw new Error("Connection is not open.")
		}
		void this.dataConnection.send(message)
	}

	public readonly receive = async (): Promise<string> => {
		return this.receiveQueue.receive()
	}

	public readonly close = (): void => {
		if (this.dataConnection.open) {
			this.dataConnection.close()
		}
		this.receiveQueue.setError(new Error("Connection closed locally."))
		this.closePromiseResolve?.()
	}

	public readonly waitUntilClosed = async (): Promise<void> => {
		return this.closePromise
	}
}
