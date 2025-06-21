export enum AddressGeneratorAlgorithm {
	SHA_256 = "SHA-256",
	SHA_512 = "SHA-512",
}

export type TimeAddressData = {
	secret: ArrayBuffer
	params: TimeAddressGenerationParams
}

/**
 * Parameters for address generation.
 */
export type TimeAddressGenerationParams = {
	hash: AddressGeneratorAlgorithm
	timeWindowMs: number
}

/**
 * Utility class for generating addresses from a secret and date, with customizable HMAC hash and time window.
 */
export class TimeAddressGenerator {
	private readonly timeWindowMs: number
	private readonly keyPromise: Promise<CryptoKey>

	/**
	 * Creates an AddressGenerator instance.
	 * @param secret - The secret to use for address generation (ArrayBuffer only)
	 * @param params - Parameters for address generation
	 */
	public constructor(
		secret: ArrayBuffer,
		{ hash, timeWindowMs }: TimeAddressGenerationParams,
	) {
		this.timeWindowMs = timeWindowMs
		const keyData = new Uint8Array(secret)
		this.keyPromise = crypto.subtle.importKey(
			"raw",
			keyData,
			{ name: "HMAC", hash: hash },
			false,
			["sign"],
		)
	}

	/**
	 * Generates an address for the given date using HMAC (TOTP style).
	 * @param date - The date to use as the base for the time window (default: now)
	 * @returns The generated address as a base64 string
	 */
	public readonly generate = async (
		date: Date = new Date(),
	): Promise<ArrayBuffer> => {
		const windowStart =
			Math.floor(date.getTime() / this.timeWindowMs) * this.timeWindowMs
		const windowBytes = new Uint8Array(8)
		new DataView(windowBytes.buffer).setBigUint64(
			0,
			BigInt(windowStart),
			true,
		)
		const key = await this.keyPromise
		const signature = await crypto.subtle.sign("HMAC", key, windowBytes)
		return signature
	}
}
