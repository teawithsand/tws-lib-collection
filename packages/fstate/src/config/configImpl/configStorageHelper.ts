import { ConfigFieldLoadError, ConfigFieldStoreError } from "../errors"
import { ConfigStorage } from "../storage/storage"
import { ConfigFieldSpec, ConfigSpec, ConfigStorageCacheMode } from "../types"

export class ConfigStorageHelper<T extends Record<string, unknown>> {
	public readonly cacheMode

	private readonly spec
	private readonly storageKeyTransform
	private readonly storage

	private readonly valuesCache: Map<keyof T, T[keyof T]> = new Map()

	constructor({
		spec,
		storage,
		storageKeyTransform,
		cacheMode,
	}: {
		readonly spec: ConfigSpec<T>
		readonly storage: ConfigStorage
		readonly storageKeyTransform: (key: keyof T) => keyof T
		readonly cacheMode: ConfigStorageCacheMode
	}) {
		this.spec = spec
		this.storageKeyTransform = storageKeyTransform
		this.storage = storage
		this.cacheMode = cacheMode
	}

	private static readonly extractStorageKeyFromSpec = <
		T extends Record<string, unknown>,
	>(
		key: keyof T,
		spec: ConfigFieldSpec<any>,
	) => {
		return spec.storageKey ?? key
	}

	private readonly readFromStorageNoLock = async <E extends keyof T>(
		key: E,
	) => {
		const storageKey = ConfigStorageHelper.extractStorageKeyFromSpec(
			key as keyof T,
			this.spec[key],
		)

		const transformedStorageKey = this.storageKeyTransform(
			storageKey.toString(),
		).toString()

		try {
			if (await this.storage.has(transformedStorageKey)) {
				const res = await this.storage.get(
					transformedStorageKey.toString(),
				)

				return await this.spec[key].serializer.deserialize(res)
			} else {
				return this.spec[key].defaultValue
			}
		} catch (error) {
			throw new ConfigFieldLoadError(
				`Failed to load field: '${String(key)}'`,
				error,
			)
		}
	}

	private readonly writeToStorageNoLock = async <E extends keyof T>(
		key: E,
		value: T[E],
	) => {
		const storageKey = ConfigStorageHelper.extractStorageKeyFromSpec(
			key as keyof T,
			this.spec[key],
		)

		const transformedStorageKey = this.storageKeyTransform(
			storageKey.toString(),
		)

		try {
			const serialized = await this.spec[key].serializer.serialize(value)

			await this.storage.set(transformedStorageKey.toString(), serialized)

			if (this.cacheMode === ConfigStorageCacheMode.READ_AFTER_WRITE) {
				this.valuesCache.set(key, await this.readFromStorageNoLock(key))
			} else if (this.cacheMode === ConfigStorageCacheMode.AFTER_WRITE) {
				this.valuesCache.set(key, value)
			}
		} catch (error) {
			throw new ConfigFieldStoreError(
				`Failed to store field: '${String(key)}'`,
				error,
			)
		}
	}

	/**
	 * Persist a value for `key`.
	 *
	 * @template E The config field key
	 * @param key Field key
	 * @param value Value to persist
	 * @returns Promise resolved when the write completes
	 */
	public readonly write = async <E extends keyof T>(key: E, value: T[E]) => {
		return this.writeToStorageNoLock(key, value)
	}

	/**
	 * Read a value for `key`.
	 *
	 * @template E The config field key
	 * @param key Field key
	 * @returns Promise resolving to the value or the field default
	 */
	public readonly read = async <E extends keyof T>(key: E): Promise<T[E]> => {
		if (this.valuesCache.has(key)) {
			return this.valuesCache.get(key)! as T[E]
		}

		return this.readFromStorageNoLock(key)
	}

	public readonly clearCache = async () => {
		this.valuesCache.clear()
	}
}
