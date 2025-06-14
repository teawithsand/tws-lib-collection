import { RwLock, RwLockAdapter, RwLockImpl } from "@teawithsand/lngext"
import { CardId } from "../../defines/typings/defines"
import { StorageTypeSpec } from "../../defines/typings/typeSpec"
import { EngineStore } from "../defines"

/**
 * Thread-safe wrapper for EngineStore using read-write locks.
 * Read operations (getTopCard, getCardData) use read locks.
 * Write operations (push, popCard, pop) use write locks.
 */
export class RwLockedEngineStore<T extends StorageTypeSpec>
	implements EngineStore<T>
{
	private readonly store: EngineStore<T>
	private readonly lock: RwLock

	constructor({
		store,
		lockAdapter,
	}: {
		store: EngineStore<T>
		lockAdapter: RwLockAdapter
	}) {
		this.store = store
		this.lock = new RwLockImpl(lockAdapter)
	}

	public readonly push = async (
		id: CardId,
		event: T["cardEvent"],
	): Promise<void> => {
		return await this.lock.withWriteLock(async () => {
			return await this.store.push(id, event)
		})
	}

	public readonly popCard = async (id: CardId): Promise<void> => {
		return await this.lock.withWriteLock(async () => {
			return await this.store.popCard(id)
		})
	}

	public readonly pop = async (): Promise<void> => {
		return await this.lock.withWriteLock(async () => {
			return await this.store.pop()
		})
	}

	public readonly getTopCard = async (
		queues?: T["queue"][],
	): Promise<CardId | null> => {
		return await this.lock.withReadLock(async () => {
			return await this.store.getTopCard(queues)
		})
	}

	public readonly getCardData = async (
		id: CardId,
	): Promise<T["cardState"]> => {
		return await this.lock.withReadLock(async () => {
			return await this.store.getCardData(id)
		})
	}
}
