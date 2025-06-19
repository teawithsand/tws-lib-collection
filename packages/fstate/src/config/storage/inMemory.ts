import { ConfigStorage } from "./storage"

/**
 * In-memory implementation of ConfigStorage for testing and fallback scenarios
 */
export class InMemoryConfigStorage implements ConfigStorage {
	private readonly storage = new Map<string, unknown>()

	public readonly get = async (key: string): Promise<unknown | null> => {
		return this.storage.get(key) ?? null
	}

	public readonly set = async (
		key: string,
		value: unknown,
	): Promise<void> => {
		this.storage.set(key, value)
	}

	public readonly delete = async (key: string): Promise<void> => {
		this.storage.delete(key)
	}

	public readonly has = async (key: string): Promise<boolean> => {
		return this.storage.has(key)
	}
}
