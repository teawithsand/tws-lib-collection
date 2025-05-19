import { CardId } from "../defines/typings/cardId"
import { StorageTypeSpec } from "../defines/typings/typeSpec"
import { InMemoryCard, InMemoryCollection, InMemoryDb } from "../inMemoryDb/db"
import { CardHandle } from "./defines/card"
import {
	CollectionGetCardsParams,
	CollectionHandle,
	CollectionStore,
} from "./defines/collection"

export class InMemoryCollectionHandle<T extends StorageTypeSpec>
	implements CollectionHandle<T>
{
	public readonly id: CardId
	private readonly db: InMemoryDb<T>
	private readonly defaultCardData: T["cardData"]

	constructor({
		id,
		db,
		defaultCardData,
	}: {
		id: CardId
		db: InMemoryDb<T>
		defaultCardData: T["cardData"]
	}) {
		this.id = id
		this.db = db
		this.defaultCardData = defaultCardData
	}

	public readonly save = async (data: T["collectionData"]): Promise<void> => {
		this.db.upsertCollection(this.id, { header: data })
	}

	public readonly update = async (
		partial: Partial<T["collectionData"]>,
	): Promise<void> => {
		const collection = this.db.getCollectionById(this.id)
		if (!collection) throw new Error("Collection not found")
		const updated = { ...collection.header, ...partial }
		this.db.upsertCollection(this.id, { header: updated })
	}

	public readonly read = async (): Promise<T["collectionData"]> => {
		const collection = this.db.getCollectionById(this.id)
		if (!collection) throw new Error("Collection not found")
		return collection.header
	}

	public readonly exists = async (): Promise<boolean> => {
		return this.db.getCollectionById(this.id) !== undefined
	}

	public readonly delete = async (): Promise<void> => {
		const allCards = this.db.getAllCardIds()
		for (const cardId of allCards) {
			const card = this.db.getCardById(cardId)
			if (card?.collection === this.id) {
				this.db.deleteCardById(cardId)
			}
		}
		this.db.deleteCollectionById(this.id)
	}

	public readonly getCardCount = async (): Promise<number> => {
		const allCards = this.db.getAllCardIds()
		return allCards.filter((cardId) => {
			const card = this.db.getCardById(cardId)
			return card?.collection === this.id
		}).length
	}

	public readonly getCards = async (
		params?: CollectionGetCardsParams,
	): Promise<CardHandle<T>[]> => {
		const allCards = this.db.getAllCardIds()
		const filteredCards = allCards.filter((cardId) => {
			const card = this.db.getCardById(cardId)
			return card?.collection === this.id
		})
		const offset = params?.offset ?? 0
		const limit = params?.limit ?? filteredCards.length
		const slice = filteredCards.slice(offset, offset + limit)
		return slice.map(
			(cardId) => new InMemoryCardHandle<T>({ id: cardId, db: this.db }),
		)
	}

	public readonly getCard = async (id: CardId): Promise<CardHandle<T>> => {
		const card = this.db.getCardById(id)
		if (!card) throw new Error("Card not found")
		if (card.collection !== this.id)
			throw new Error("Card does not belong to this collection")
		return new InMemoryCardHandle<T>({ id, db: this.db })
	}

	public readonly createCard = async (): Promise<CardHandle<T>> => {
		const newId = this.generateId()
		const newCard: InMemoryCard<T> = {
			data: this.defaultCardData,
			collection: this.id,
			states: [],
		}
		this.db.upsertCard(newId, newCard)
		return new InMemoryCardHandle<T>({ id: newId, db: this.db })
	}

	private readonly generateId = (): CardId => {
		// Simple unique ID generator for example purposes
		return Math.random().toString(36).substr(2, 9) as CardId
	}
}

export class InMemoryCardHandle<T extends StorageTypeSpec>
	implements CardHandle<T>
{
	public readonly id: CardId
	private readonly db: InMemoryDb<T>
	private collectionId: CardId

	constructor({ id, db }: { id: CardId; db: InMemoryDb<T> }) {
		this.id = id
		this.db = db
		const card = this.db.getCardById(id)
		this.collectionId = card ? card.collection : ""
	}

	public readonly save = async (data: T["cardData"]): Promise<void> => {
		const card = this.db.getCardById(this.id)
		if (!card) {
			const collection = this.db.getCollectionById(this.collectionId)
			if (!collection)
				throw new Error("Card not found and collection does not exist")
			const newCard: InMemoryCard<T> = {
				data,
				collection: this.collectionId,
				states: [],
			}
			this.db.upsertCard(this.id, newCard)
			return
		}
		const updatedCard = { ...card, data }
		this.db.upsertCard(this.id, updatedCard)
	}

	public readonly update = async (
		partial: Partial<T["cardData"]>,
	): Promise<void> => {
		const card = this.db.getCardById(this.id)
		if (!card) throw new Error("Card not found")
		const updatedData = { ...card.data, ...partial }
		const updatedCard = { ...card, data: updatedData }
		this.db.upsertCard(this.id, updatedCard)
	}

	public readonly read = async (): Promise<T["cardData"]> => {
		const card = this.db.getCardById(this.id)
		if (!card) throw new Error("Card not found")
		return card.data
	}

	public readonly exists = async (): Promise<boolean> => {
		return this.db.getCardById(this.id) !== undefined
	}

	public readonly delete = async (): Promise<void> => {
		this.db.deleteCardById(this.id)
	}

	public readonly setCollection = async (id: CardId): Promise<void> => {
		const card = this.db.getCardById(this.id)
		if (!card) throw new Error("Card not found")
		const updatedCard = { ...card, collection: id }
		this.db.upsertCard(this.id, updatedCard)
		this.collectionId = id
	}
}

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
		defaultCollectionHeader: T["collectionData"]
		defaultCardData: T["cardData"]
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
