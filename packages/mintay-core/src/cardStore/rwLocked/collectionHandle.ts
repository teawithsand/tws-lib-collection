import { RwLock } from "@teawithsand/lngext"
import { CardId } from "../../defines/typings/defines"
import { StorageTypeSpec } from "../../defines/typings/typeSpec"
import { CardHandle } from "../defines/card"
import {
	CollectionGetCardsParams,
	CollectionHandle,
} from "../defines/collection"

/**
 * Thread-safe wrapper for CollectionHandle using read-write locks.
 * Read operations (read, exists, getCardCount, getCards, getCard) use read locks.
 * Write operations (save, update, delete, createCard) use write locks.
 */
export class RwLockedCollectionHandle<T extends StorageTypeSpec>
	implements CollectionHandle<T>
{
	public readonly id: CardId
	private readonly handle: CollectionHandle<T>
	private readonly lock: RwLock

	constructor({
		handle,
		lock,
	}: {
		handle: CollectionHandle<T>
		lock: RwLock
	}) {
		this.id = handle.id
		this.handle = handle
		this.lock = lock
	}

	public readonly save = async (data: T["collectionData"]): Promise<void> => {
		return await this.lock.withWriteLock(async () => {
			return await this.handle.save(data)
		})
	}

	public readonly update = async (
		partial: Partial<T["collectionData"]>,
	): Promise<void> => {
		return await this.lock.withWriteLock(async () => {
			return await this.handle.update(partial)
		})
	}

	public readonly read = async (): Promise<T["collectionData"] | null> => {
		return await this.lock.withReadLock(async () => {
			return await this.handle.read()
		})
	}

	public readonly mustRead = async (): Promise<T["collectionData"]> => {
		return await this.lock.withReadLock(async () => {
			return await this.handle.mustRead()
		})
	}

	public readonly exists = async (): Promise<boolean> => {
		return await this.lock.withReadLock(async () => {
			return await this.handle.exists()
		})
	}

	public readonly delete = async (): Promise<void> => {
		return await this.lock.withWriteLock(async () => {
			return await this.handle.delete()
		})
	}

	public readonly getCardCount = async (): Promise<number> => {
		return await this.lock.withReadLock(async () => {
			return await this.handle.getCardCount()
		})
	}

	public readonly getCards = async (
		params?: CollectionGetCardsParams,
	): Promise<CardHandle<T>[]> => {
		return await this.lock.withReadLock(async () => {
			return await this.handle.getCards(params)
		})
	}

	public readonly getCard = async (id: CardId): Promise<CardHandle<T>> => {
		return await this.lock.withReadLock(async () => {
			return await this.handle.getCard(id)
		})
	}

	public readonly createCard = async (): Promise<CardHandle<T>> => {
		return await this.lock.withWriteLock(async () => {
			return await this.handle.createCard()
		})
	}
}
