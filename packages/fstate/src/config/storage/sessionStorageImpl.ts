import { Encoder, JsonEncoder } from "@teawithsand/reserd"
import { ConfigStorage } from "./storage"

/**
 * SessionStorage-based config storage implementation with configurable encoding
 */
export class SessionStorageConfigStorage implements ConfigStorage {
	private readonly encoder: Encoder<unknown, string>

	public constructor({
		encoder = new JsonEncoder<unknown>(),
	}: {
		encoder?: Encoder<unknown, string>
	} = {}) {
		this.encoder = encoder
	}

	public readonly get = async (key: string): Promise<unknown | null> => {
		if (typeof sessionStorage === "undefined") {
			return null
		}

		try {
			const value = sessionStorage.getItem(key)
			return value === null ? null : this.encoder.decode(value)
		} catch {
			return null
		}
	}

	public readonly set = async (
		key: string,
		value: unknown,
	): Promise<void> => {
		if (typeof sessionStorage === "undefined") {
			throw new Error("sessionStorage is not available")
		}

		try {
			const encodedValue = this.encoder.encode(value)
			sessionStorage.setItem(key, encodedValue)
		} catch (error) {
			throw new Error(`Failed to store value in sessionStorage: ${error}`)
		}
	}

	public readonly delete = async (key: string): Promise<void> => {
		if (typeof sessionStorage === "undefined") {
			return
		}

		sessionStorage.removeItem(key)
	}

	public readonly has = async (key: string): Promise<boolean> => {
		if (typeof sessionStorage === "undefined") {
			return false
		}

		return sessionStorage.getItem(key) !== null
	}
}
