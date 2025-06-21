import { Lock, LockImpl, QueueLockAdapter } from "@teawithsand/lngext"
import { SerializerReverse } from "@teawithsand/reserd"
import { JotaiStore } from "../libs"
import { ConfigImpl } from "./config"
import { ConfigStorage } from "./storage/storage"
import { Config, ConfigFieldSpec } from "./types"

/**
 * Builder class for creating config instances with a fluent API
 */
export class ConfigBuilder<T extends Record<string, unknown>> {
	private spec: Partial<Config<T>> = {}
	private storage?: ConfigStorage

	/**
	 * Add a field to the config specification
	 */
	public readonly addField = <K extends keyof T>(
		key: K,
		defaultValue: T[K],
		serializer: SerializerReverse<T[K], unknown>,
		storageKey?: string,
	): this => {
		this.spec[key] = {
			defaultValue,
			serializer,
			storageKey,
		} as ConfigFieldSpec<T[K]>
		return this
	}

	/**
	 * Set the storage backend
	 */
	public readonly setStorage = (storage: ConfigStorage): this => {
		this.storage = storage
		return this
	}

	/**
	 * Build the config instance
	 */
	public readonly build = ({
		store,
		lock,
		keyPrefix,
	}: {
		store: JotaiStore
		lock?: Lock
		keyPrefix?: string
	}): ConfigImpl<T> => {
		if (!this.storage) {
			throw new Error("Storage is required")
		}

		// Ensure all required fields are specified
		const specKeys = Object.keys(this.spec)
		if (specKeys.length === 0) {
			throw new Error("At least one field must be specified")
		}

		const finalLock = lock ?? new LockImpl(new QueueLockAdapter())

		return new ConfigImpl({
			spec: this.spec as Config<T>,
			storage: this.storage,
			store,
			lock: finalLock,
			...(keyPrefix !== undefined && { keyPrefix }),
		})
	}
}
