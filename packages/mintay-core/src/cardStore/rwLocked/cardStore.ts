import { RwLock, RwLockAdapter, RwLockImpl } from "@teawithsand/lngext"
import { MintayId } from "../../defines/id"
import { TypeSpec } from "../../defines/typeSpec"
import { CardHandle, CardStore } from "../defines/card"
import { RwLockedCardHandle } from "./cardHandle"

/**
 * Thread-safe wrapper for CardStore using read-write locks.
 * Each CardHandle returned is also wrapped with thread-safety.
 * Store operations (getCardById) use read locks.
 */
export class RwLockedCardStore<T extends TypeSpec> implements CardStore<T> {
	private readonly store: CardStore<T>
	private readonly lockAdapter: RwLockAdapter
	private readonly storeLock: RwLock

	constructor({
		store,
		lockAdapter,
	}: {
		store: CardStore<T>
		lockAdapter: RwLockAdapter
	}) {
		this.store = store
		this.lockAdapter = lockAdapter
		this.storeLock = new RwLockImpl(lockAdapter)
	}

	public readonly getCardById = async (
		id: MintayId,
	): Promise<CardHandle<T> | null> => {
		return await this.storeLock.withReadLock(async () => {
			const handle = await this.store.getCardById(id)
			if (handle === null) {
				return null
			}
			return new RwLockedCardHandle<T>({
				handle,
				lock: new RwLockImpl(this.lockAdapter),
			})
		})
	}
}
