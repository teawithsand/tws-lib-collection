import { MintayId } from "../../defines/id"
import { TypeSpec } from "../../defines/typeSpec"
import { InMemoryCard, InMemoryDb } from "../../inMemoryDb/db"
import { CardHandle } from "../defines/card"

export class InMemoryCardHandle<T extends TypeSpec> implements CardHandle<T> {
	public readonly id: MintayId
	private readonly db: InMemoryDb<T>
	private collectionId: MintayId

	constructor({ id, db }: { id: MintayId; db: InMemoryDb<T> }) {
		this.id = id
		this.db = db
		const card = this.db.getCardById(id)
		this.collectionId = card ? card.collection : ("" as MintayId)
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

	public readonly read = async (): Promise<T["cardData"] | null> => {
		const card = this.db.getCardById(this.id)
		if (!card) return null
		return card.data
	}

	public readonly mustRead = async (): Promise<T["cardData"]> => {
		const data = await this.read()
		if (data === null) throw new Error("Card not found")
		return data
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

	public readonly setCollection = async (id: MintayId): Promise<void> => {
		const card = this.db.getCardById(this.id)
		if (!card) throw new Error("Card not found")
		const updatedCard = { ...card, collection: id }
		this.db.upsertCard(this.id, updatedCard)
		this.collectionId = id
	}

	public readonly getEventCount = async (): Promise<number> => {
		const card = this.db.getCardById(this.id)
		if (!card) throw new Error("Card not found")
		return card.states.length
	}

	public readonly getEvents = async (params?: {
		offset?: number
		limit?: number
	}): Promise<T["cardEvent"][]> => {
		const card = this.db.getCardById(this.id)
		if (!card) throw new Error("Card not found")

		if (params?.offset !== undefined && params.offset < 0) {
			throw new Error("Offset cannot be negative")
		}
		if (params?.offset !== undefined && !Number.isFinite(params.offset)) {
			throw new Error("Offset must be a finite number")
		}
		if (params?.limit !== undefined && params.limit < 0) {
			throw new Error("Limit cannot be negative")
		}
		if (params?.limit !== undefined && !Number.isFinite(params.limit)) {
			throw new Error("Limit must be a finite number")
		}

		const offset = params?.offset ?? 0
		const limit = params?.limit ?? card.states.length

		return card.states
			.slice(offset, offset + limit)
			.map((stateItem) => stateItem.event)
	}
}
