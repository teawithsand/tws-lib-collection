import { CardId } from "../../defines/typings/cardId"
import { StorageTypeSpec } from "../../defines/typings/typeSpec"
import { InMemoryCard, InMemoryDb } from "../../inMemoryDb/db"
import { CardHandle } from "../defines/card"

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
		this.collectionId = card ? card.collection : ("" as CardId)
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

	public readonly readState = async (): Promise<T["cardState"] | null> => {
		const card = this.db.getCardById(this.id)
		if (!card) throw new Error("Card not found")

		if (card.states.length === 0) {
			return null
		}

		return card.states[card.states.length - 1]!.state
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
