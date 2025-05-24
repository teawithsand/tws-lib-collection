import { CardId } from "../../defines/typings/cardId"
import { StorageTypeSpec } from "../../defines/typings/typeSpec"
import { InMemoryCollection, InMemoryDb } from "../../inMemoryDb/db"
import { CollectionHandle, CollectionStore } from "../defines/collection"
import { InMemoryCollectionHandle } from "./collectionHandle"

export class InMemoryCollectionStore<T extends StorageTypeSpec>
	implements CollectionStore<T>
{
	private readonly db: InMemoryDb<T>
	private readonly defaultCollectionHeader: T["collectionData"]
	private readonly defaultCardData: T["cardData"]

	constructor({
		db,
		defaultCollectionHeader = {} as T["collectionData"],
		defaultCardData = {} as T["cardData"],
	}: {
		db: InMemoryDb<T>
		defaultCollectionHeader?: T["collectionData"]
		defaultCardData?: T["cardData"]
	}) {
		this.db = db
		this.defaultCollectionHeader = defaultCollectionHeader
		this.defaultCardData = defaultCardData
	}

	public readonly create = async (): Promise<CollectionHandle<T>> => {
		const newId = this.generateId()
		const newCollection: InMemoryCollection<T> = {
			header: this.defaultCollectionHeader,
		}
		this.db.upsertCollection(newId, newCollection)
		return new InMemoryCollectionHandle<T>({
			id: newId,
			db: this.db,
			defaultCardData: this.defaultCardData,
		})
	}

	public readonly get = (id: CardId): CollectionHandle<T> => {
		return new InMemoryCollectionHandle<T>({
			id,
			db: this.db,
			defaultCardData: this.defaultCardData,
		})
	}

	private readonly generateId = (): CardId => {
		return Math.random().toString(36).substr(2, 9) as CardId
	}
}
