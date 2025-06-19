import { generateUuid } from "@teawithsand/lngext"
import { CardId } from "../../defines/typings/defines"
import { StorageTypeSpec } from "../../defines/typings/typeSpec"
import { InMemoryCollection, InMemoryDb } from "../../inMemoryDb/db"
import { CollectionHandle, CollectionStore } from "../defines/collection"
import { InMemoryCollectionHandle } from "./collectionHandle"

export class InMemoryCollectionStore<T extends StorageTypeSpec>
	implements CollectionStore<T>
{
	private readonly db: InMemoryDb<T>
	private readonly defaultCardDataFactory
	private readonly defaultCollectionDataFactory

	constructor({
		db,
		defaultCardDataFactory,
		defaultCollectionDataFactory,
	}: {
		db: InMemoryDb<T>
		defaultCardDataFactory: () => T["cardData"]
		defaultCollectionDataFactory: () => T["collectionData"]
	}) {
		this.db = db
		this.defaultCardDataFactory = defaultCardDataFactory
		this.defaultCollectionDataFactory = defaultCollectionDataFactory
	}

	public readonly list = async (): Promise<CardId[]> => {
		return this.db.getAllCollectionIds()
	}

	public readonly create = async (): Promise<CollectionHandle<T>> => {
		const newId = generateUuid() as CardId
		const newCollection: InMemoryCollection<T> = {
			header: this.defaultCollectionDataFactory(),
		}
		this.db.upsertCollection(newId, newCollection)
		return new InMemoryCollectionHandle<T>({
			id: newId,
			db: this.db,
			defaultCardDataFactory: this.defaultCardDataFactory,
		})
	}

	public readonly get = (id: CardId): CollectionHandle<T> => {
		return new InMemoryCollectionHandle<T>({
			id,
			db: this.db,
			defaultCardDataFactory: this.defaultCardDataFactory,
		})
	}
}
