import { RwLock } from "@teawithsand/lngext"
import { CardId } from "../../defines/typings/defines"
import { StorageTypeSpec } from "../../defines/typings/typeSpec"
import { CardHandle } from "../defines/card"

/**
 * Thread-safe wrapper for CardHandle using read-write locks.
 * Read operations (read, mustRead, readState, exists, getEventCount, getEvents) use read locks.
 * Write operations (save, update, delete, setCollection) use write locks.
 */
export class RwLockedCardHandle<T extends StorageTypeSpec>
	implements CardHandle<T>
{
	public readonly id: CardId
	private readonly handle: CardHandle<T>
	private readonly lock: RwLock

	constructor({ handle, lock }: { handle: CardHandle<T>; lock: RwLock }) {
		this.id = handle.id
		this.handle = handle
		this.lock = lock
	}

	public readonly save = async (data: T["cardData"]): Promise<void> => {
		return await this.lock.withWriteLock(async () => {
			return await this.handle.save(data)
		})
	}

	public readonly update = async (
		partial: Partial<T["cardData"]>,
	): Promise<void> => {
		return await this.lock.withWriteLock(async () => {
			return await this.handle.update(partial)
		})
	}

	public readonly read = async (): Promise<T["cardData"] | null> => {
		return await this.lock.withReadLock(async () => {
			return await this.handle.read()
		})
	}

	public readonly mustRead = async (): Promise<T["cardData"]> => {
		return await this.lock.withReadLock(async () => {
			return await this.handle.mustRead()
		})
	}

	public readonly readState = async (): Promise<T["cardState"] | null> => {
		return await this.lock.withReadLock(async () => {
			return await this.handle.readState()
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

	public readonly setCollection = async (id: CardId): Promise<void> => {
		return await this.lock.withWriteLock(async () => {
			return await this.handle.setCollection(id)
		})
	}

	public readonly getEventCount = async (): Promise<number> => {
		return await this.lock.withReadLock(async () => {
			return await this.handle.getEventCount()
		})
	}

	public readonly getEvents = async (params?: {
		offset?: number
		limit?: number
	}): Promise<T["cardEvent"][]> => {
		return await this.lock.withReadLock(async () => {
			return await this.handle.getEvents(params)
		})
	}
}
