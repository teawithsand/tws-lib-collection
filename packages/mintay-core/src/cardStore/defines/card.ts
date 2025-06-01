import { CardId } from "../../defines/typings/cardId"
import { StorageTypeSpec } from "../../defines/typings/typeSpec"

/**
 * Handle for managing individual card operations.
 * Provides methods to create, read, update, and delete card data and state.
 */
export interface CardHandle<T extends StorageTypeSpec> {
	/** The unique identifier of this card */
	readonly id: CardId

	/** 
	 * Saves complete card data. Creates the card if it doesn't exist, 
	 * or replaces existing data if it does.
	 */
	save: (data: T["cardData"]) => Promise<void>
	
	/** 
	 * Updates card data with partial changes, merging with existing data.
	 * Throws error if card doesn't exist.
	 */
	update: (partial: Partial<T["cardData"]>) => Promise<void>
	
	/** 
	 * Reads the current card data.
	 * Throws error if card doesn't exist.
	 */
	read: () => Promise<T["cardData"]>
	
	/** Checks if the card exists in storage */
	exists: () => Promise<boolean>
	
	/** 
	 * Deletes the card from storage.
	 * Does nothing if card doesn't exist.
	 */
	delete: () => Promise<void>

	/** 
	 * Moves the card to a different collection.
	 * Throws error if card doesn't exist.
	 */
	setCollection: (id: CardId) => Promise<void>
}

/**
 * Store for managing card operations and retrieval.
 * Provides access to individual cards via CardHandle instances.
 */
export interface CardStore<T extends StorageTypeSpec> {
	/** 
	 * Retrieves a card handle by its ID.
	 * Returns null if the card doesn't exist.
	 */
	getCardById: (id: CardId) => Promise<CardHandle<T> | null>
}
