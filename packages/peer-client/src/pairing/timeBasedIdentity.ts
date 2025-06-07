/**
 * Configuration options for time-based identity generation
 */
export interface TimeBasedIdentityGenerateConfig {
	/** Time window in milliseconds (default: 30000ms = 30 seconds) */
	readonly timeWindow?: number
	/** Timestamp in milliseconds */
	readonly timestamp: number
	/** Time offset in milliseconds to add to the timestamp */
	readonly offset?: number
}

/**
 * Constructor configuration for TimeBasedIdentity
 */
export interface TimeBasedIdentityConstructorConfig {
	/** The secret key used for HMAC generation */
	readonly secret: string | ArrayBuffer
	/** Default time window in milliseconds (default: 30000ms = 30 seconds) */
	readonly timeWindow?: number
	/** Default time offset in milliseconds to add to timestamps (default: 0) */
	readonly offset?: number
}

/**
 * Utility class for generating time-based identifiers using HMAC-SHA-512
 */
export class TimeBasedIdentity {
	private readonly secret
	private readonly defaultTimeWindow
	private readonly defaultOffset

	/**
	 * Creates a new TimeBasedIdentity instance
	 * @param config - Constructor configuration options
	 */
	constructor({
		secret,
		timeWindow = 30000,
		offset = 0,
	}: TimeBasedIdentityConstructorConfig) {
		this.secret = secret
		this.defaultTimeWindow = timeWindow
		this.defaultOffset = offset
	}

	/**
	 * Generates a time-based identifier using HMAC-SHA-512
	 * @param config - Configuration options for identity generation
	 * @returns Promise resolving to base64-encoded HMAC identifier
	 */
	public readonly generateIdentity = async (
		config: TimeBasedIdentityGenerateConfig,
	): Promise<string> => {
		const {
			timeWindow = this.defaultTimeWindow,
			timestamp,
			offset = this.defaultOffset,
		} = config

		// Apply offset to timestamp
		const adjustedTimestamp = timestamp + offset

		// Calculate time slot for deterministic time-based generation
		const timeSlot = Math.floor(adjustedTimestamp / timeWindow)

		// Convert time slot to bytes
		const timeSlotBuffer = new ArrayBuffer(8)
		const timeSlotView = new DataView(timeSlotBuffer)
		timeSlotView.setBigUint64(0, BigInt(timeSlot), false) // big-endian

		// Import the secret key for HMAC
		const secretBuffer =
			typeof this.secret === "string"
				? new TextEncoder().encode(this.secret)
				: this.secret

		const cryptoKey = await crypto.subtle.importKey(
			"raw",
			secretBuffer,
			{ name: "HMAC", hash: "SHA-512" },
			false,
			["sign"],
		)

		// Generate HMAC signature
		const signature = await crypto.subtle.sign(
			"HMAC",
			cryptoKey,
			timeSlotBuffer,
		)

		// Convert to base64 for easy transmission/storage
		return this.arrayBufferToBase64(signature)
	}

	/**
	 * Validates a time-based identifier against the current time
	 * @param identifier - The identifier to validate
	 * @param config - Configuration options for validation
	 * @returns Promise resolving to true if identifier is valid for current time window
	 */
	public readonly validateIdentity = async (
		identifier: string,
		config: TimeBasedIdentityGenerateConfig,
	): Promise<boolean> => {
		try {
			const currentIdentity = await this.generateIdentity(config)
			return currentIdentity === identifier
		} catch {
			return false
		}
	}

	/**
	 * Validates a time-based identifier with tolerance for clock drift
	 * @param identifier - The identifier to validate
	 * @param tolerance - Number of time windows to check before/after current (default: 1)
	 * @param config - Configuration options for validation
	 * @returns Promise resolving to true if identifier is valid within tolerance
	 */
	public readonly validateIdentityWithTolerance = async (
		identifier: string,
		tolerance: number = 1,
		config: TimeBasedIdentityGenerateConfig,
	): Promise<boolean> => {
		const {
			timeWindow = this.defaultTimeWindow,
			timestamp,
			offset = this.defaultOffset,
		} = config

		// Check current time window and surrounding windows within tolerance
		for (
			let windowOffset = -tolerance;
			windowOffset <= tolerance;
			windowOffset++
		) {
			const adjustedTimestamp =
				timestamp + offset + windowOffset * timeWindow
			const testConfig = {
				...config,
				timestamp: adjustedTimestamp,
				offset: 0,
			}

			if (await this.validateIdentity(identifier, testConfig)) {
				return true
			}
		}

		return false
	}

	/**
	 * Gets the current time slot for a given timestamp and time window
	 * @param timestamp - Timestamp in milliseconds (default: current time)
	 * @param timeWindow - Time window in milliseconds (default: 30000ms)
	 * @returns The time slot number
	 */
	public readonly getCurrentTimeSlot = (
		timestamp: number = Date.now(),
		timeWindow: number = this.defaultTimeWindow,
	): number => {
		return Math.floor(timestamp / timeWindow)
	}

	/**
	 * Converts ArrayBuffer to base64 string
	 */
	private readonly arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
		const bytes = new Uint8Array(buffer)
		let binary = ""
		for (let i = 0; i < bytes.byteLength; i++) {
			binary += String.fromCharCode(bytes[i]!)
		}
		return btoa(binary)
	}
}
