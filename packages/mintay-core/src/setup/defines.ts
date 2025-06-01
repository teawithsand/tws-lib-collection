import { CardStore, CollectionStore } from "../cardStore"
import { MintayTypeSpec } from "../defines"
import { CardId } from "../defines/typings/cardId"
import { EngineStore } from "../engineStore"
import { FsrsParameters } from "../fsrs"

/**
 * Represents the main entry point for interacting with Mintay's core functionalities.
 * It provides access to card collections, individual cards, and engine stores.
 */
export interface Mintay {
	/**
	 * Provides access to the collection store, allowing management of card collections.
	 */
	readonly collectionStore: CollectionStore<MintayTypeSpec>

	/**
	 * Provides access to the card store, allowing direct management of individual cards.
	 */
	readonly cardStore: CardStore<MintayTypeSpec>

	/**
	 * Retrieves an engine store for a specific card collection.
	 * The engine store is responsible for managing the learning state of cards within that collection.
	 * @param id The ID of the card collection.
	 * @param parameters The FSRS parameters to be used by the engine.
	 * @returns An EngineStore instance for the specified collection.
	 */
	getEngineStore: (
		id: CardId,
		parameters: FsrsParameters,
	) => EngineStore<MintayTypeSpec>
}
