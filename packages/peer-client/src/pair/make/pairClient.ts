import {
	Encoder,
	EncoderUtil,
	JsonEncoder,
	TextBufferEncoder,
} from "@teawithsand/reserd"
import { Base64Encoder } from "@teawithsand/reserd/src/encoding/base64Encoder"
import { Conn } from "../../conn"
import { EncryptingConn, EncryptionKeyManager } from "../../encrypting"
import { PairData, PairLocalData, PairRemoteData } from "../defines"
import { TimeAddressData } from "../timeAddress"
import {
	PairingHmacMessage,
	PairingHmacMessageSchema,
	PairLocalDataMessage,
	PairRemoteDataMessageSchema,
	ProtocolHelloMessage,
	ProtocolHelloMessageSchema,
} from "./messages"

export enum PairMakeDataRole {
	SECRET_OFFERER = "secret-offerer",
	SECRET_CONSUMER = "secret-consumer",
}

/**
 * Data required to initiate the pairing protocol as either offerer or consumer.
 *
 * @property authSecret - Shared secret (as ArrayBuffer) used for HMAC authentication and encryption key derivation.
 * @property role - Role of this party in the pairing process (offerer or consumer).
 * @property hostId - Public identifier for this host, used for identification during connection.
 * @property ownPublicAddress - Public address of this host, exchanged with the remote party.
 * @property timeAddressData - Time-based address data for this host, exchanged with the remote party.
 */
export type PairMakeData = {
	authSecret: ArrayBuffer
	role: PairMakeDataRole
	hostId: string
	ownPublicAddress: string
	timeAddressData: TimeAddressData
}

/**
 * Handles the pairing protocol handshake, authentication, and secure data exchange.
 */
export class PairMaker {
	private readonly conn: Conn<ArrayBuffer>
	private readonly makeData: PairMakeData
	private readonly encoder: Encoder<unknown, ArrayBuffer>
	private readonly textBufferEncoder = new TextBufferEncoder()
	private readonly base64Encoder = new Base64Encoder()

	/**
	 * Constructs a PairClient for the pairing protocol.
	 * @param params Object containing all required arguments
	 *   - conn: Underlying connection for message exchange
	 *   - makeData: Pairing secret and role
	 *   - encoder: Encoder for converting messages to/from ArrayBuffer
	 */
	public constructor({
		conn,
		makeData,
		encoder,
	}: {
		conn: Conn<ArrayBuffer>
		makeData: PairMakeData
		encoder: Encoder<unknown, ArrayBuffer>
	}) {
		this.conn = conn
		this.makeData = makeData
		this.encoder =
			encoder ??
			EncoderUtil.compose(new JsonEncoder(), new TextBufferEncoder())
	}

	/**
	 * Runs the full pairing protocol and returns the resulting PairData.
	 * @returns PairData containing local and remote pairing info
	 * @throws Error if protocol negotiation or authentication fails
	 */
	public readonly pair = async (): Promise<PairData> => {
		await this.exchangeProtocolHello()
		await this.performHmacAuthentication()
		const encryptingConn = await this.switchToEncryptedConn()
		return await this.exchangePairingData(encryptingConn)
	}

	private readonly exchangeProtocolHello =
		async (): Promise<ProtocolHelloMessage> => {
			const protocolVersion = 1
			const helloMsg: ProtocolHelloMessage = {
				protocol: "tws-peer-pair",
				version: protocolVersion,
			}
			await this.conn.send(this.encoder.encode(helloMsg))
			const remoteHelloBuf = await this.conn.receive()
			const remoteHelloObjUnknown = this.encoder.decode(remoteHelloBuf)
			const remoteHelloObj = ProtocolHelloMessageSchema.parse(
				remoteHelloObjUnknown,
			)
			if (
				remoteHelloObj.protocol !== "tws-peer-pair" ||
				typeof remoteHelloObj.version !== "number"
			) {
				throw new Error(
					"Remote party does not support required pairing protocol",
				)
			}
			return remoteHelloObj
		}

	private readonly performHmacAuthentication = async (): Promise<void> => {
		const hmac = await this.computeHmac(
			this.makeData.authSecret,
			this.makeData.role,
		)
		const hmacMsg: PairingHmacMessage = {
			hmac: this.base64Encoder.encode(hmac),
		}
		await this.conn.send(this.encoder.encode(hmacMsg))
		const remoteHmacBuf = await this.conn.receive()
		const remoteHmacMsgUnknown = this.encoder.decode(remoteHmacBuf)
		const remoteHmacMsg =
			PairingHmacMessageSchema.parse(remoteHmacMsgUnknown)
		const expectedRemoteRole =
			this.makeData.role === PairMakeDataRole.SECRET_OFFERER
				? PairMakeDataRole.SECRET_CONSUMER
				: PairMakeDataRole.SECRET_OFFERER
		const expectedRemoteHmac = await this.computeHmac(
			this.makeData.authSecret,
			expectedRemoteRole,
		)
		if (
			remoteHmacMsg.hmac !== this.base64Encoder.encode(expectedRemoteHmac)
		) {
			throw new Error("Remote party failed HMAC authentication")
		}
	}

	private readonly switchToEncryptedConn =
		async (): Promise<EncryptingConn> => {
			return EncryptingConn.createWithSingleKey(
				this.conn,
				await EncryptionKeyManager.importKey(this.makeData.authSecret),
			)
		}

	private readonly exchangePairingData = async (
		encryptingConn: EncryptingConn,
	): Promise<PairData> => {
		const localData: PairLocalData = {
			hostId: this.makeData.hostId,
			encryptionKey: await EncryptionKeyManager.exportKey(
				await EncryptionKeyManager.generateKey(),
			),
			address: {
				timeAddress: this.makeData.timeAddressData,
				staticAddress: this.textBufferEncoder.encode(
					this.makeData.ownPublicAddress,
				),
			},
		}
		const localMsg: PairLocalDataMessage = {
			hostId: localData.hostId,
			encryptionKey: this.base64Encoder.encode(localData.encryptionKey),
			address: {
				timeAddress: localData.address.timeAddress,
				staticAddress: this.base64Encoder.encode(
					localData.address.staticAddress,
				),
			},
		}
		await encryptingConn.send(this.encoder.encode(localMsg))
		const remoteDataBuf = await encryptingConn.receive()
		const remoteMsgUnknown = this.encoder.decode(remoteDataBuf)
		const remoteMsg = PairRemoteDataMessageSchema.parse(remoteMsgUnknown)
		const remoteData: PairRemoteData = {
			hostId: remoteMsg.hostId,
			encryptionKey: this.base64Encoder.decode(remoteMsg.encryptionKey),
			address: {
				timeAddress: remoteMsg.address.timeAddress,
				staticAddress: this.base64Encoder.decode(
					remoteMsg.address.staticAddress,
				),
			},
		}
		return {
			local: localData,
			remote: remoteData,
		}
	}

	private readonly computeHmac = async (
		key: ArrayBuffer,
		role: PairMakeDataRole,
	): Promise<ArrayBuffer> => {
		const cryptoKey = await crypto.subtle.importKey(
			"raw",
			key,
			{ name: "HMAC", hash: "SHA-256" },
			false,
			["sign"],
		)
		const sig = await crypto.subtle.sign(
			"HMAC",
			cryptoKey,
			new TextEncoder().encode(role),
		)
		return sig
	}
}
