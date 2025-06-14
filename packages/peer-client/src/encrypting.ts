import { Conn } from "./conn"

/**
 * Utility class for AES-GCM encryption key management
 */
export class EncryptionKeyManager {
	private constructor() {
		// Private constructor to prevent instantiation
	}

	/**
	 * Creates a new AES-GCM encryption key
	 */
	public static readonly generateKey = async (): Promise<CryptoKey> => {
		return crypto.subtle.generateKey(
			{
				name: "AES-GCM",
				length: 256,
			},
			true, // extractable
			["encrypt", "decrypt"],
		)
	}

	/**
	 * Exports a key to raw format for sharing
	 */
	public static readonly exportKey = async (
		key: CryptoKey,
	): Promise<ArrayBuffer> => {
		return crypto.subtle.exportKey("raw", key)
	}

	/**
	 * Imports a key from raw format
	 */
	public static readonly importKey = async (
		keyData: ArrayBuffer,
	): Promise<CryptoKey> => {
		return crypto.subtle.importKey(
			"raw",
			keyData,
			{
				name: "AES-GCM",
				length: 256,
			},
			true, // extractable
			["encrypt", "decrypt"],
		)
	}
}

/**
 * Configuration for the encrypting connection
 */
export interface EncryptingConnConfig {
	/**
	 * The encryption key to use for AES-GCM encryption
	 */
	readonly key: CryptoKey
}

/**
 * A connection wrapper that encrypts and decrypts ArrayBuffer messages using AES-GCM
 */
export class EncryptingConn implements Conn<ArrayBuffer> {
	private readonly innerConn: Conn<ArrayBuffer>
	private readonly key: CryptoKey

	public constructor(
		innerConn: Conn<ArrayBuffer>,
		{ key }: EncryptingConnConfig,
	) {
		this.innerConn = innerConn
		this.key = key
	}

	public readonly send = (message: ArrayBuffer): void => {
		// Encrypt and send asynchronously to avoid blocking
		this.encryptAndSend(message).catch((error) => {
			// Log error but don't throw since send is synchronous
			console.error("Failed to encrypt and send message:", error)
		})
	}

	private readonly encryptAndSend = async (
		message: ArrayBuffer,
	): Promise<void> => {
		// Generate a random IV (12 bytes for AES-GCM)
		const iv = crypto.getRandomValues(new Uint8Array(12))

		// Encrypt the message
		const encrypted = await crypto.subtle.encrypt(
			{
				name: "AES-GCM",
				iv,
			},
			this.key,
			message,
		)

		// Combine IV and encrypted data
		const combined = new Uint8Array(iv.length + encrypted.byteLength)
		combined.set(iv, 0)
		combined.set(new Uint8Array(encrypted), iv.length)

		// Send the combined buffer
		this.innerConn.send(combined.buffer)
	}

	public readonly receive = async (): Promise<ArrayBuffer> => {
		// Receive encrypted data
		const encryptedData = await this.innerConn.receive()
		const encryptedArray = new Uint8Array(encryptedData)

		// Extract IV and encrypted message
		if (encryptedArray.length < 12) {
			throw new Error(
				"Received data is too short to contain valid encrypted message",
			)
		}

		const iv = encryptedArray.slice(0, 12)
		const encrypted = encryptedArray.slice(12)

		// Decrypt the message
		const decrypted = await crypto.subtle.decrypt(
			{
				name: "AES-GCM",
				iv,
			},
			this.key,
			encrypted,
		)

		// Return the decrypted ArrayBuffer
		return decrypted
	}

	/**
	 * Closes inner connection.
	 *
	 * Besides it does nothing else.
	 */
	public readonly close = (): void => {
		this.innerConn.close()
	}
}
