import { Conn } from "../../conn"
import {
	CryptoUtil,
	DeriveKeyAlgorithm,
	KeyExchangeAlgorithm,
	SymmetricEncryptionAlgorithm,
} from "../../crypto/util"
import { EncryptingConn } from "../../encrypting"
import { Pair } from "../defines"
import { DeviceInfoMessage, DeviceInfoMessageSchema } from "../messages"

export type PairMakerResult = {
	pair: Pair
}

export type PairMakerConfig = {
	localDeviceName: string
	timeBasedIdentifierWindowMillis: number
	timeBaseIdentifierOffsetMillis: number
}

export class PairMaker {
	private readonly localDeviceName: string
	private readonly timeBasedIdentifierWindowMillis: number
	private readonly timeBaseIdentifierOffsetMillis: number

	constructor({
		localDeviceName,
		timeBasedIdentifierWindowMillis,
		timeBaseIdentifierOffsetMillis,
	}: PairMakerConfig) {
		this.localDeviceName = localDeviceName
		this.timeBasedIdentifierWindowMillis = timeBasedIdentifierWindowMillis
		this.timeBaseIdentifierOffsetMillis = timeBaseIdentifierOffsetMillis
	}

	/**
	 * Creates a new pair using the provided pairing secret.
	 * The pairing secret is expected to be a random value shared between both parties.
	 * Performs a secure handshake to verify both parties have the same secret.
	 *
	 * @param paringSecret - A random secret used to generate the public pair identifier.
	 * @param conn - Connection to communicate with the remote party for handshake.
	 * @returns A promise that resolves to the PairMakerResult containing the created pair.
	 * @throws Error if the handshake fails or remote party doesn't have the same secret.
	 */
	public readonly makePair = async (
		paringSecret: ArrayBuffer,
		conn: Conn<ArrayBuffer>,
	): Promise<PairMakerResult> => {
		const initialEncKeyMaterial = await CryptoUtil.deriveKey(
			paringSecret,
			"init-enc-key",
			DeriveKeyAlgorithm.HMAC_SHA256,
		)

		const initialEncConn = new EncryptingConn(conn, {
			key: await CryptoUtil.arrayBufferToSymmetricKey(
				initialEncKeyMaterial,
				SymmetricEncryptionAlgorithm.AES_GCM,
			),
		})

		const { keyPair, publicKeyBytes } =
			await CryptoUtil.generateEphemeralKXKeyPair(
				KeyExchangeAlgorithm.X25519,
			)

		initialEncConn.send(publicKeyBytes)
		const remotePublicKeyBytes = await initialEncConn.receive()

		const finalEncKeyMaterial = await CryptoUtil.deriveEncryptionKeyFromKX({
			algo: KeyExchangeAlgorithm.X25519,
			localPrivateKey: keyPair.privateKey,
			remotePublicKeyBytes,
		})

		const finalEncConn = new EncryptingConn(conn, {
			key: await CryptoUtil.arrayBufferToSymmetricKey(
				finalEncKeyMaterial,
				SymmetricEncryptionAlgorithm.AES_GCM,
			),
		})

		// Now finalEncConn can be used to exchange data. It's future proof,
		//  now even when paringSecret is leaked communication will remain secure.

		const remoteDeviceInfo = await this.exchangeDeviceInfo(finalEncConn)

		const pair: Pair = {
			remoteDeviceName: remoteDeviceInfo.deviceName,
			remoteStaticAddress: remoteDeviceInfo.staticAddress,
			remoteDynamicAddressGenerationData:
				remoteDeviceInfo.dynamicAddressGenerationData,
			localDeviceName: this.localDeviceName,
			timeBasedIdentifierWindowMillis:
				this.timeBasedIdentifierWindowMillis,
			timeBaseIdentifierOffsetMillis: this.timeBaseIdentifierOffsetMillis,
		}

		return { pair }
	}

	/**
	 * Exchanges device information with the remote party using the secure connection.
	 * Sends local device info and receives remote device info.
	 *
	 * @param encConn - The secure encrypted connection to use for data exchange.
	 * @returns A promise that resolves to the remote device information.
	 * @throws Error if message validation fails or communication errors occur.
	 */
	private readonly exchangeDeviceInfo = async (
		encConn: EncryptingConn,
	): Promise<DeviceInfoMessage> => {
		// Send local device information
		const localDeviceInfo: DeviceInfoMessage = {
			deviceName: this.localDeviceName,
			staticAddress: await this.generateStaticAddress(),
			dynamicAddressGenerationData:
				await this.generateDynamicAddressData(),
		}

		const localDeviceInfoBuffer = new TextEncoder().encode(
			JSON.stringify(localDeviceInfo),
		)
		await encConn.send(localDeviceInfoBuffer)

		// Receive remote device information
		const remoteDeviceInfoBuffer = await encConn.receive()
		const remoteDeviceInfoJson = new TextDecoder().decode(
			remoteDeviceInfoBuffer,
		)

		try {
			const remoteDeviceInfoRaw = JSON.parse(remoteDeviceInfoJson)
			const remoteDeviceInfo =
				DeviceInfoMessageSchema.parse(remoteDeviceInfoRaw)
			return remoteDeviceInfo
		} catch (error) {
			throw new Error(`Failed to parse remote device info: ${error}`)
		}
	}

	/**
	 * Generates a static address for this device.
	 * This is a placeholder implementation that should be replaced with actual address generation logic.
	 *
	 * @returns A promise that resolves to the static address string.
	 */
	private readonly generateStaticAddress = async (): Promise<string> => {
		// TODO: Implement actual static address generation
		return `static-${this.localDeviceName}-${Date.now()}`
	}

	/**
	 * Generates dynamic address generation data for this device.
	 * This is a placeholder implementation that should be replaced with actual generation logic.
	 *
	 * @returns A promise that resolves to the dynamic address generation data.
	 */
	private readonly generateDynamicAddressData = async (): Promise<
		DeviceInfoMessage["dynamicAddressGenerationData"]
	> => {
		// TODO: Implement actual dynamic address generation data
		const seed = crypto.getRandomValues(new Uint8Array(32)).buffer
		return {
			seed,
			algorithm: "placeholder-algorithm",
			parameters: {
				windowMillis: this.timeBasedIdentifierWindowMillis,
				offsetMillis: this.timeBaseIdentifierOffsetMillis,
			},
		}
	}
}
