import { RwLock, RwLockAdapter, RwLockImpl } from "@teawithsand/lngext"
import { MintayId } from "../../defines/id"
import { TypeSpec } from "../../defines/typeSpec"
import { CollectionHandle, CollectionStore } from "../defines/collection"
import { RwLockedCollectionHandle } from "./collectionHandle"

/**
 * Thread-safe wrapper for CollectionStore using read-write locks.
 * Each CollectionHandle returned is also wrapped with thread-safety.
 * Store operations (list) use read locks, creation operations (create) use write locks.
 */
export class RwLockedCollectionStore<T extends TypeSpec>
	implements CollectionStore<T>
{
	private readonly store: CollectionStore<T>
	private readonly lockAdapter: RwLockAdapter
	private readonly storeLock: RwLock

	constructor({
		store,
		lockAdapter,
	}: {
		store: CollectionStore<T>
		lockAdapter: RwLockAdapter
	}) {
		this.store = store
		this.lockAdapter = lockAdapter
		this.storeLock = new RwLockImpl(lockAdapter)
	}

	public readonly list = async (): Promise<MintayId[]> => {
		return await this.storeLock.withReadLock(async () => {
			return await this.store.list()
		})
	}

	public readonly create = async (): Promise<CollectionHandle<T>> => {
		return await this.storeLock.withWriteLock(async () => {
			const handle = await this.store.create()
			return new RwLockedCollectionHandle<T>({
				handle,
				lock: new RwLockImpl(this.lockAdapter),
			})
		})
	}

	public readonly get = (id: MintayId): CollectionHandle<T> => {
		const handle = this.store.get(id)
		return new RwLockedCollectionHandle<T>({
			handle,
			lock: new RwLockImpl(this.lockAdapter),
		})
	}
}
