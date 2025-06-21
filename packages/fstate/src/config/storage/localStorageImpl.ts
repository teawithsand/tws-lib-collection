import { Encoder, JsonEncoder } from "@teawithsand/reserd"
import { ConfigStorage } from "./storage"

/**
 * LocalStorage-based config storage implementation with configurable encoding
 */
export class LocalStorageConfigStorage implements ConfigStorage {
	private readonly encoder: Encoder<unknown, string>

	public constructor({
		encoder = new JsonEncoder<unknown>(),
	}: {
		encoder?: Encoder<unknown, string>
	} = {}) {
		this.encoder = encoder
	}

	public readonly get = async (key: string): Promise<unknown | null> => {
		if (typeof localStorage === "undefined") {
			return null
		}

		try {
			const value = localStorage.getItem(key)
			return value === null ? null : this.encoder.decode(value)
		} catch {
			return null
		}
	}

	public readonly set = async (
		key: string,
		value: unknown,
	): Promise<void> => {
		if (typeof localStorage === "undefined") {
			throw new Error("localStorage is not available")
		}

		try {
			const encodedValue = this.encoder.encode(value)
			localStorage.setItem(key, encodedValue)
		} catch (error) {
			throw new Error(`Failed to store value in localStorage: ${error}`)
		}
	}

	public readonly delete = async (key: string): Promise<void> => {
		if (typeof localStorage === "undefined") {
			return
		}

		localStorage.removeItem(key)
	}

	public readonly has = async (key: string): Promise<boolean> => {
		if (typeof localStorage === "undefined") {
			return false
		}

		return localStorage.getItem(key) !== null
	}
}
