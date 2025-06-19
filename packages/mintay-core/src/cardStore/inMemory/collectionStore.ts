import { generateUuid } from "@teawithsand/lngext"
import { MintayId } from "../../defines/id"
import { TypeSpec } from "../../defines/typeSpec"
import { InMemoryCollection, InMemoryDb } from "../../inMemoryDb/db"
import { CollectionHandle, CollectionStore } from "../defines/collection"
import { InMemoryCollectionHandle } from "./collectionHandle"

export class InMemoryCollectionStore<T extends TypeSpec>
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

	public readonly list = async (): Promise<MintayId[]> => {
		return this.db.getAllCollectionIds()
	}

	public readonly create = async (): Promise<CollectionHandle<T>> => {
		const newId = generateUuid() as MintayId
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

	public readonly get = (id: MintayId): CollectionHandle<T> => {
		return new InMemoryCollectionHandle<T>({
			id,
			db: this.db,
			defaultCardDataFactory: this.defaultCardDataFactory,
		})
	}
}
