import {
	Encoder,
	EncoderUtil,
	JsonEncoder,
	TextBufferEncoder,
} from "@teawithsand/reserd"
import { z } from "zod"
import { Conn } from "../../conn"
import { EncryptingConn, EncryptionKeyManager } from "../../encrypting"
import { PairData } from "../defines"
import { HostIdMessageSchema, ProtocolHelloMessageSchema } from "./messages"

export type PairClientConfig = {
	/**
	 * Pair data for this connection (local/remote info).
	 */
	pair: PairData
	/**
	 * Encoder for converting messages to/from ArrayBuffer. Optional, defaults to JSON+TextBuffer encoder.
	 */
	encoder?: Encoder<unknown, ArrayBuffer>
}

export type PairClientResult = {
	conn: EncryptingConn
	remoteHostId: string
	remotePairData: PairData
}

/**
 * Handles outgoing peer connections, authenticates with remote host, and sets up encrypted communication.
 */
export class PairClient {
	private readonly pair: PairData
	private readonly encoder: Encoder<unknown, ArrayBuffer>

	/**
	 * Constructs a new PairClient instance.
	 * @param config Configuration object containing pair data and optional encoder
	 */
	public constructor({ pair, encoder }: PairClientConfig) {
		this.pair = pair
		this.encoder =
			encoder ??
			EncoderUtil.compose(new JsonEncoder(), new TextBufferEncoder())
	}

	/**
	 * Performs protocol version negotiation with the server.
	 * @param conn The connection to negotiate protocol version on
	 * @throws Error if protocol version does not match
	 */
	private readonly negotiateProtocolVersion = async (
		conn: Conn<ArrayBuffer>,
	): Promise<void> => {
		const protocolMsg: z.infer<typeof ProtocolHelloMessageSchema> = {
			protocol: "tws-peer-pair",
			version: 1,
		}
		await conn.send(this.encoder.encode(protocolMsg))
		const serverMsgRaw = await conn.receive()
		const serverMsg = this.encoder.decode(serverMsgRaw)
		const { version } = ProtocolHelloMessageSchema.parse(serverMsg)
		if (version !== 1) {
			throw new Error(
				`Protocol version mismatch: expected 1, got ${version}`,
			)
		}
	}

	/**
	 * Sends the local hostId to the server using HostIdMessageSchema.
	 * @param conn The connection to send the hostId message on
	 */
	private readonly sendLocalHostId = async (
		conn: Conn<ArrayBuffer>,
	): Promise<void> => {
		const hostIdMsg: z.infer<typeof HostIdMessageSchema> =
			HostIdMessageSchema.parse({ hostId: this.pair.local.hostId })
		await conn.send(this.encoder.encode(hostIdMsg))
	}

	/**
	 * Sets up the encrypted connection using the local pair data.
	 * @param conn The connection to wrap with encryption
	 * @returns Promise resolving to the encrypted connection
	 */
	private readonly setupEncryptingConn = async (
		conn: Conn<ArrayBuffer>,
	): Promise<EncryptingConn> => {
		const encryptKey = await EncryptionKeyManager.importKey(
			this.pair.remote.encryptionKey,
		)
		const decryptKey = await EncryptionKeyManager.importKey(
			this.pair.local.encryptionKey,
		)
		return EncryptingConn.createWithKeys(conn, encryptKey, decryptKey)
	}

	/**
	 * Handles the connection handshake, authenticates with remote host, and returns encrypted connection if allowed.
	 * @param conn Outgoing connection to server
	 * @returns Encrypted connection and remote server info
	 * @throws Error if handshake fails
	 */
	public readonly connect = async (
		conn: Conn<ArrayBuffer>,
	): Promise<PairClientResult> => {
		await this.negotiateProtocolVersion(conn)
		await this.sendLocalHostId(conn)
		const encryptingConn = await this.setupEncryptingConn(conn)
		return {
			conn: encryptingConn,
			remoteHostId: this.pair.remote.hostId,
			remotePairData: this.pair,
		}
	}
}
