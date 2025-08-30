import {
	QueueRwLockAdapter,
	RwLockAdapter,
	RwLockAdapterMap,
	SingleRwLockAdapterMap,
} from "@teawithsand/lngext"
import { SerializerReverse } from "@teawithsand/reserd"
import { JotaiStore } from "../../libs"
import { ConfigStorage } from "../storage"
import { ConfigFieldSpec, ConfigSpec, ConfigStorageCacheMode } from "../types"
import { ConfigImpl } from "./config"

/**
 * Builder class for creating ConfigImpl instances with a fluent API
 */
export class ConfigBuilder<T extends Record<string, unknown>> {
	private spec: Partial<ConfigSpec<T>> = {}
	private rwLockAdapterMap?: RwLockAdapterMap
	private globalLock?: RwLockAdapter
	private storageKeyTransform?: (key: keyof T) => keyof T
	private lockKeyTransform?: (key: keyof T) => keyof T
	private cacheMode: ConfigStorageCacheMode = ConfigStorageCacheMode.DISABLED

	private constructor() {}

	/**
	 * Create a new ConfigBuilder instance
	 */
	public static readonly create = <
		T extends Record<string, unknown>,
	>(): ConfigBuilder<T> => {
		return new ConfigBuilder<T>()
	}

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
	 * Set the RW lock adapter map for field-level locking
	 */
	public readonly setRwLockAdapterMap = (
		rwLockAdapterMap: RwLockAdapterMap,
	): this => {
		this.rwLockAdapterMap = rwLockAdapterMap
		return this
	}

	/**
	 * Set the global lock adapter for config-wide operations
	 */
	public readonly setGlobalLock = (globalLock: RwLockAdapter): this => {
		this.globalLock = globalLock
		return this
	}

	/**
	 * Set storage key transform function
	 */
	public readonly setStorageKeyTransform = (
		transform: (key: keyof T) => keyof T,
	): this => {
		this.storageKeyTransform = transform
		return this
	}

	/**
	 * Set lock key transform function
	 */
	public readonly setLockKeyTransform = (
		transform: (key: keyof T) => keyof T,
	): this => {
		this.lockKeyTransform = transform
		return this
	}

	/**
	 * Set storage cache mode
	 */
	public readonly setCacheMode = (
		cacheMode: ConfigStorageCacheMode,
	): this => {
		this.cacheMode = cacheMode
		return this
	}

	/**
	 * Build the config instance
	 */
	public readonly build = (params: {
		store: JotaiStore
		storage: ConfigStorage
	}): ConfigImpl<T> => {
		// Ensure all required fields are specified
		const specKeys = Object.keys(this.spec)
		if (specKeys.length === 0) {
			throw new Error("At least one field must be specified")
		}

		const finalRwLockAdapterMap =
			this.rwLockAdapterMap ??
			new SingleRwLockAdapterMap(new QueueRwLockAdapter())
		const finalGlobalLock = this.globalLock ?? new QueueRwLockAdapter()

		return new ConfigImpl({
			spec: this.spec as ConfigSpec<T>,
			storage: params.storage,
			store: params.store,
			rwLockAdapterMap: finalRwLockAdapterMap,
			globalLock: finalGlobalLock,
			...(this.storageKeyTransform && {
				storageKeyTransform: this.storageKeyTransform,
			}),
			...(this.lockKeyTransform && {
				lockKeyTransform: this.lockKeyTransform,
			}),
			cacheMode: this.cacheMode,
		})
	}
}
