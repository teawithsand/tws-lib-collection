import {
	Encoder,
	EncoderUtil,
	JsonEncoder,
	TextBufferEncoder,
} from "@teawithsand/reserd"
import { z } from "zod"
import { Conn } from "../../conn"
import { EncryptingConn } from "../../encrypting"
import { PairData } from "../defines"
import { HostIdMessageSchema, ProtocolHelloMessageSchema } from "./messages"

export type PairServerConfig = {
	/**
	 * List of allowed pairs (local/remote info). Used to check remote hostId.
	 */
	pairs: PairData[]
	/**
	 * Optional custom checker for remote hostId. If provided, used instead of pairs list.
	 */
	remoteHostIdChecker?: (hostId: string) => boolean
	/**
	 * Encoder for converting messages to/from ArrayBuffer.
	 */
	encoder?: Encoder<unknown, ArrayBuffer>
}

export type PairServerResult = {
	conn: EncryptingConn
	remoteHostId: string
	remotePairData: PairData
}

/**
 * Handles incoming peer connections, authenticates remote host, and sets up encrypted communication.
 */
export class PairServer {
	private readonly pairs: PairData[]
	private readonly remoteHostIdChecker:
		| ((hostId: string) => boolean)
		| undefined
	private readonly encoder: Encoder<unknown, ArrayBuffer>

	public constructor({
		pairs,
		remoteHostIdChecker,
		encoder,
	}: PairServerConfig) {
		this.pairs = pairs
		this.remoteHostIdChecker = remoteHostIdChecker
		this.encoder =
			encoder ??
			EncoderUtil.compose(new JsonEncoder(), new TextBufferEncoder())
	}

	/**
	 * Handles protocol version negotiation.
	 * @param conn The connection to negotiate protocol version on
	 * @throws Error if protocol version does not match
	 */
	private readonly negotiateProtocolVersion = async (
		conn: Conn<ArrayBuffer>,
	): Promise<void> => {
		const protocolMsgRaw = await conn.receive()
		const protocolMsg = this.encoder.decode(protocolMsgRaw)
		const { version } = ProtocolHelloMessageSchema.parse(protocolMsg)
		if (version !== 1) {
			throw new Error(
				`Protocol version mismatch: expected 1, got ${version}`,
			)
		}
		// Send protocol hello response back to client
		const responseMsg: z.infer<typeof ProtocolHelloMessageSchema> = {
			protocol: "tws-peer-pair",
			version: 1,
		}
		await conn.send(this.encoder.encode(responseMsg))
	}

	/**
	 * Receives and validates the remote hostId message.
	 * @param conn The connection to receive the hostId message from
	 * @returns remoteHostId string
	 * @throws Error if hostId message is invalid
	 */
	private readonly receiveRemoteHostId = async (
		conn: Conn<ArrayBuffer>,
	): Promise<string> => {
		const hostIdMsgRaw = await conn.receive()
		const hostIdMsg = this.encoder.decode(hostIdMsgRaw)
		const { hostId } = HostIdMessageSchema.parse(hostIdMsg)
		return hostId
	}

	/**
	 * Finds and validates the matching pair for the given remoteHostId.
	 * @param remoteHostId The remote host ID to find and validate
	 * @returns The matching pair data
	 * @throws Error if no matching pair or not allowed by checker
	 */
	private readonly findAndValidatePair = (remoteHostId: string): PairData => {
		const pair = this.pairs.find((p) => p.remote.hostId === remoteHostId)
		if (!pair) {
			throw new Error("Remote hostId not allowed or unknown")
		}
		if (
			this.remoteHostIdChecker &&
			!this.remoteHostIdChecker(remoteHostId)
		) {
			throw new Error("Remote hostId not allowed by checker")
		}
		return pair
	}

	/**
	 * Sets up the encrypted connection using the given pair.
	 * @param conn The connection to wrap with encryption
	 * @param pair The pair data containing encryption keys
	 * @returns Promise resolving to the encrypted connection
	 */
	private readonly setupEncryptingConn = async (
		conn: Conn<ArrayBuffer>,
		pair: PairData,
	): Promise<EncryptingConn> => {
		const encryptKey = await crypto.subtle.importKey(
			"raw",
			pair.remote.encryptionKey,
			{ name: "AES-GCM" },
			false,
			["encrypt", "decrypt"],
		)
		const decryptKey = await crypto.subtle.importKey(
			"raw",
			pair.local.encryptionKey,
			{ name: "AES-GCM" },
			false,
			["encrypt", "decrypt"],
		)
		return EncryptingConn.createWithKeys(conn, encryptKey, decryptKey)
	}

	/**
	 * Handles an incoming connection, authenticates remote host, and returns encrypted connection if allowed.
	 * @param conn Incoming connection to handle
	 * @returns Encrypted connection and remote client info
	 * @throws Error if remote host is not allowed or pairing fails
	 */
	public readonly handleIncomingConn = async (
		conn: Conn<ArrayBuffer>,
	): Promise<PairServerResult> => {
		await this.negotiateProtocolVersion(conn)
		const remoteHostId = await this.receiveRemoteHostId(conn)
		const pair = this.findAndValidatePair(remoteHostId)
		const encryptingConn = await this.setupEncryptingConn(conn, pair)
		return {
			conn: encryptingConn,
			remoteHostId,
			remotePairData: pair,
		}
	}
}
