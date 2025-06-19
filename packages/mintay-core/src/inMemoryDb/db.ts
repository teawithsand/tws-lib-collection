import { MintayId } from "../defines"
import { TypeSpec } from "../defines/typeSpec"

/**
 * Represents a collection stored in memory.
 * @template T - The storage type specification.
 */
export type InMemoryCollection<T extends TypeSpec> = {
	/**
	 * Header information of the collection.
	 */
	header: T["collectionData"]
}

/**
 * Represents a card stored in memory.
 * @template T - The storage type specification.
 */
export type InMemoryCard<T extends TypeSpec> = {
	/**
	 * The data contained in the card.
	 */
	data: T["cardData"]
	/**
	 * The collection ID this card belongs to.
	 */
	collection: MintayId
	/**
	 * The states and events history of the card.
	 */
	states: { state: T["cardState"]; event: T["cardEvent"] }[]
}

/**
 * In-memory database for storing collections and cards.
 * @template T - The storage type specification.
 */
export class InMemoryDb<T extends TypeSpec> {
	constructor() {}

	/**
	 * Map of collections by their CardId.
	 */
	private readonly collections: Map<MintayId, InMemoryCollection<T>> =
		new Map()

	/**
	 * Map of cards by their CardId.
	 */
	private readonly cards: Map<MintayId, InMemoryCard<T>> = new Map()

	/**
	 * Get a collection by its CardId.
	 * @param id - The CardId of the collection.
	 * @returns The collection or undefined if not found.
	 */
	public readonly getCollectionById = (
		id: MintayId,
	): InMemoryCollection<T> | undefined => {
		return this.collections.get(id)
	}

	/**
	 * Get a card by its CardId.
	 * @param id - The CardId of the card.
	 * @returns The card or undefined if not found.
	 */
	public readonly getCardById = (
		id: MintayId,
	): InMemoryCard<T> | undefined => {
		return this.cards.get(id)
	}

	/**
	 * Delete a collection by its CardId.
	 * @param id - The CardId of the collection to delete.
	 * @returns True if the collection was deleted, false if not found.
	 */
	public readonly deleteCollectionById = (id: MintayId): boolean => {
		return this.collections.delete(id)
	}

	/**
	 * Delete a card by its CardId.
	 * @param id - The CardId of the card to delete.
	 * @returns True if the card was deleted, false if not found.
	 */
	public readonly deleteCardById = (id: MintayId): boolean => {
		return this.cards.delete(id)
	}

	/**
	 * Update or create a collection by its CardId.
	 * @param id - The CardId of the collection.
	 * @param collection - The collection data to set.
	 */
	public readonly upsertCollection = (
		id: MintayId,
		collection: InMemoryCollection<T>,
	): void => {
		this.collections.set(id, collection)
	}

	/**
	 * Update or create a card by its CardId.
	 * @param id - The CardId of the card.
	 * @param card - The card data to set.
	 */
	public readonly upsertCard = (
		id: MintayId,
		card: InMemoryCard<T>,
	): void => {
		this.cards.set(id, card)
	}

	/**
	 * Get all collection CardIds.
	 * @returns An array of all collection CardIds.
	 */
	public readonly getAllCollectionIds = (): MintayId[] => {
		return Array.from(this.collections.keys())
	}

	/**
	 * Get all card CardIds.
	 * @returns An array of all card CardIds.
	 */
	public readonly getAllCardIds = (): MintayId[] => {
		return Array.from(this.cards.keys())
	}
}
