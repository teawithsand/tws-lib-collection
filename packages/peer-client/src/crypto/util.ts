export enum DeriveKeyAlgorithm {
	HMAC_SHA256 = "HMAC_SHA256",
	HMAC_SHA512 = "HMAC_SHA512",
}

export enum KeyExchangeAlgorithm {
	ECDH_P256 = "ECDH_P256",
	ECDH_P384 = "ECDH_P384",
	ECDH_P521 = "ECDH_P521",
	X25519 = "X25519",
}

export enum SymmetricEncryptionAlgorithm {
	AES_GCM = "AES_GCM",
}

/**
 * Cryptographic utility class for deriving keys from secrets using WebCrypto APIs.
 * Provides fast key derivation functionality with type-based differentiation using HMAC.
 */
export class CryptoUtil {
	private constructor() {}

	/**
	 * Performs constant-time comparison of two ArrayBuffers to prevent timing attacks.
	 * Always compares the full length of both buffers regardless of differences found.
	 *
	 * @param a - First ArrayBuffer to compare
	 * @param b - Second ArrayBuffer to compare
	 * @returns true if buffers are equal, false otherwise
	 */
	public static readonly constantTimeCompare = (
		a: ArrayBuffer,
		b: ArrayBuffer,
	): boolean => {
		if (a.byteLength !== b.byteLength) {
			return false
		}

		const viewA = new Uint8Array(a)
		const viewB = new Uint8Array(b)
		let result = 0

		for (let i = 0; i < viewA.length; i++) {
			result |= viewA[i]! ^ viewB[i]!
		}

		return result === 0
	}

	public static readonly deriveKey = async (
		secret: ArrayBuffer,
		keyIdentifier: string,
		algo: DeriveKeyAlgorithm,
	): Promise<ArrayBuffer> => {
		const hashAlgo = (() => {
			switch (algo) {
				case DeriveKeyAlgorithm.HMAC_SHA256:
					return "SHA-256"
				case DeriveKeyAlgorithm.HMAC_SHA512:
					return "SHA-512"
				default:
					throw new Error(`Unsupported algorithm: ${algo}`)
			}
		})()

		const baseKey = await crypto.subtle.importKey(
			"raw",
			secret,
			{ name: "HMAC", hash: hashAlgo },
			false,
			["sign"],
		)

		const keyData = new TextEncoder().encode(keyIdentifier)
		const derivedKey = await crypto.subtle.sign("HMAC", baseKey, keyData)

		return derivedKey
	}

	/**
	 * Generates an ephemeral key exchange key pair for secure key exchange.
	 * The private key is not extractable to ensure forward secrecy.
	 *
	 * @param algo - The key exchange algorithm to use
	 * @returns Promise that resolves to an object containing the key pair and exportable public key
	 */
	public static readonly generateEphemeralKXKeyPair = async (
		algo: KeyExchangeAlgorithm,
	): Promise<{
		keyPair: CryptoKeyPair
		publicKeyBytes: ArrayBuffer
	}> => {
		const keyGenerationParams = (() => {
			switch (algo) {
				case KeyExchangeAlgorithm.ECDH_P256:
					return { name: "ECDH", namedCurve: "P-256" }
				case KeyExchangeAlgorithm.ECDH_P384:
					return { name: "ECDH", namedCurve: "P-384" }
				case KeyExchangeAlgorithm.ECDH_P521:
					return { name: "ECDH", namedCurve: "P-521" }
				case KeyExchangeAlgorithm.X25519:
					return { name: "X25519" }
				default:
					throw new Error(
						`Unsupported key exchange algorithm: ${algo}`,
					)
			}
		})()

		const keyPair = (await crypto.subtle.generateKey(
			keyGenerationParams,
			false,
			["deriveKey"],
		)) as CryptoKeyPair // Safe cast since these algorithms always generate key pairs

		const publicKeyBytes = await crypto.subtle.exportKey(
			"raw",
			keyPair.publicKey,
		)
		return { keyPair, publicKeyBytes }
	}

	/**
	 * Derives an encryption key by combining a local private key with a remote public key using key exchange.
	 * Uses the specified key exchange algorithm to generate a shared secret, then derives key material.
	 *
	 * @param params - The parameters for key derivation
	 * @param params.localPrivateKey - The local key exchange private key
	 * @param params.remotePublicKeyBytes - The remote party's public key as raw bytes
	 * @param params.algo - The key exchange algorithm used
	 * @returns Promise that resolves to derived key material as ArrayBuffer
	 */
	public static readonly deriveEncryptionKeyFromKX = async ({
		localPrivateKey,
		remotePublicKeyBytes,
		algo,
	}: {
		localPrivateKey: CryptoKey
		remotePublicKeyBytes: ArrayBuffer
		algo: KeyExchangeAlgorithm
	}): Promise<ArrayBuffer> => {
		const importParams = (() => {
			switch (algo) {
				case KeyExchangeAlgorithm.ECDH_P256:
					return { name: "ECDH", namedCurve: "P-256" }
				case KeyExchangeAlgorithm.ECDH_P384:
					return { name: "ECDH", namedCurve: "P-384" }
				case KeyExchangeAlgorithm.ECDH_P521:
					return { name: "ECDH", namedCurve: "P-521" }
				case KeyExchangeAlgorithm.X25519:
					return { name: "X25519" }
				default:
					throw new Error(
						`Unsupported key exchange algorithm: ${algo}`,
					)
			}
		})()

		const remotePublicKey = await crypto.subtle.importKey(
			"raw",
			remotePublicKeyBytes,
			importParams,
			false,
			[],
		)

		const deriveParams =
			algo === KeyExchangeAlgorithm.X25519
				? { name: "X25519", public: remotePublicKey }
				: { name: "ECDH", public: remotePublicKey }

		const keyMaterial = await crypto.subtle.importKey(
			"raw",
			await crypto.subtle.deriveBits(deriveParams, localPrivateKey, 256),
			{ name: "HKDF" },
			false,
			["deriveBits"],
		)

		return crypto.subtle.deriveBits(
			{
				name: "HKDF",
				hash: "SHA-256",
				salt: new Uint8Array(0),
				info: new Uint8Array(0),
			},
			keyMaterial,
			256,
		)
	}

	/**
	 * Converts an ArrayBuffer to a symmetric encryption key for the specified algorithm.
	 * The key is not extractable to ensure security.
	 *
	 * @param keyMaterial - The raw key material as ArrayBuffer
	 * @param algo - The symmetric encryption algorithm to create the key for
	 * @returns Promise that resolves to a CryptoKey for symmetric encryption/decryption
	 */
	public static readonly arrayBufferToSymmetricKey = async (
		keyMaterial: ArrayBuffer,
		algo: SymmetricEncryptionAlgorithm,
	): Promise<CryptoKey> => {
		const keyParams = (() => {
			switch (algo) {
				case SymmetricEncryptionAlgorithm.AES_GCM:
					return { name: "AES-GCM" }
				default:
					throw new Error(
						`Unsupported symmetric encryption algorithm: ${algo}`,
					)
			}
		})()

		return crypto.subtle.importKey("raw", keyMaterial, keyParams, false, [
			"encrypt",
			"decrypt",
		])
	}
}
