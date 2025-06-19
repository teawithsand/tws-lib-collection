import { generateUuid } from "@teawithsand/lngext"
import { CardId } from "../../defines/typings/defines"
import { StorageTypeSpec } from "../../defines/typings/typeSpec"
import { InMemoryCard, InMemoryDb } from "../../inMemoryDb/db"
import { CardHandle } from "../defines/card"
import {
	CollectionGetCardsParams,
	CollectionHandle,
} from "../defines/collection"
import { InMemoryCardHandle } from "./cardHandle"

export class InMemoryCollectionHandle<T extends StorageTypeSpec>
	implements CollectionHandle<T>
{
	public readonly id: CardId
	private readonly db: InMemoryDb<T>
	private readonly defaultCardDataFactory: () => T["cardData"]

	constructor({
		id,
		db,
		defaultCardDataFactory,
	}: {
		id: CardId
		db: InMemoryDb<T>
		defaultCardDataFactory: () => T["cardData"]
	}) {
		this.id = id
		this.db = db
		this.defaultCardDataFactory = defaultCardDataFactory
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

	public readonly read = async (): Promise<T["collectionData"] | null> => {
		const collection = this.db.getCollectionById(this.id)
		if (!collection) return null
		return collection.header
	}

	public readonly mustRead = async (): Promise<T["collectionData"]> => {
		const data = await this.read()
		if (data === null) throw new Error("Collection not found")
		return data
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
		if (params?.offset && params.offset < 0) {
			throw new Error("Offset cannot be negative")
		}
		if (params?.limit && params.limit < 0) {
			throw new Error("Limit cannot be negative")
		}
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
		const newId = generateUuid() as CardId
		const newCard: InMemoryCard<T> = {
			data: this.defaultCardDataFactory(),
			collection: this.id,
			states: [],
		}
		this.db.upsertCard(newId, newCard)
		return new InMemoryCardHandle<T>({ id: newId, db: this.db })
	}
}
