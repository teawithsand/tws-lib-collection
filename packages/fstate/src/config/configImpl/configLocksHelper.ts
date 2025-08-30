import {
	RwLockAdapter,
	RwLockAdapterMap,
	RwLockImpl,
} from "@teawithsand/lngext"

export class ConfigLocksHelper<T extends Record<string, unknown>> {
	private readonly keyLocksMap
	private readonly globalLock
	private readonly lockKeyTransform

	constructor({
		rwLockAdapterMap,
		globalLock,
		lockKeyTransform,
	}: {
		readonly rwLockAdapterMap: RwLockAdapterMap
		readonly globalLock: RwLockAdapter
		readonly lockKeyTransform?: (key: keyof T) => keyof T
	}) {
		this.keyLocksMap = rwLockAdapterMap
		this.globalLock = new RwLockImpl(globalLock)
		this.lockKeyTransform = lockKeyTransform
			? (x: keyof T) => lockKeyTransform(x).toString()
			: (x: keyof T) => x.toString()
	}

	public readonly withReadLock = async <R>(
		key: keyof T,
		callback: () => Promise<R>,
	): Promise<R> => {
		return await this.globalLock.withReadLock(async () => {
			const lockKey = this.lockKeyTransform(key)
			const lock = new RwLockImpl(this.keyLocksMap.getLock(lockKey))

			return await lock.withReadLock(async () => {
				return await callback()
			})
		})
	}

	public readonly withWriteLock = async <R>(
		key: keyof T,
		callback: () => Promise<R>,
	): Promise<R> => {
		return await this.globalLock.withReadLock(async () => {
			const lockKey = this.lockKeyTransform(key)
			const lock = new RwLockImpl(this.keyLocksMap.getLock(lockKey))

			return await lock.withWriteLock(async () => {
				return await callback()
			})
		})
	}

	public readonly withGlobalWriteLock = async <R>(
		callback: () => Promise<R>,
	): Promise<R> => {
		return await this.globalLock.withWriteLock(async () => {
			return await callback()
		})
	}
}
