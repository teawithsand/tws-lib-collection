import { CardStats } from "../card/cardStats"
import { StorageTypeSpec } from "./typeSpec"

/**
 * Universal identifier type used throughout the system for both cards and collections.
 * Named `CardId` for historical reasons, but now represents any ID used in the system.
 * Can be either a string or number depending on the implementation requirements.
 */
export type CardId = string | number

/**
 * Extractor interface for card engine-related operations.
 * Responsible for extracting engine-specific information from card state and data
 * to support the spaced repetition learning algorithm.
 *
 * @template S - The storage type specification that defines the card state, data, and queue types.
 */
export interface CardEngineExtractor<S extends StorageTypeSpec> {
	/**
	 * Calculates the priority of a card for scheduling purposes.
	 * Higher priority cards are typically shown first during study sessions.
	 *
	 * @param state - The current learning state of the card, or null if the card is new.
	 * @param data - The card's data containing content and metadata.
	 * @returns A numeric priority value where higher numbers indicate higher priority.
	 */
	getPriority: (state: S["cardState"] | null, data: S["cardData"]) => number

	/**
	 * Determines which queue a card belongs to based on its current state and data.
	 * Queues are used to categorize cards for different types of study sessions
	 * (e.g., new cards, review cards, learning cards).
	 *
	 * @param state - The current learning state of the card, or null if the card is new.
	 * @param data - The card's data containing content and metadata.
	 * @returns The queue identifier that the card should be placed in.
	 */
	getQueue: (state: S["cardState"] | null, data: S["cardData"]) => S["queue"]

	/**
	 * Extracts statistical information about a card's learning progress.
	 * Provides metrics such as review count, success rate, and other performance indicators.
	 *
	 * @param state - The current learning state of the card, or null if the card is new.
	 * @param data - The card's data containing content and metadata.
	 * @returns A CardStats object containing the card's performance metrics.
	 */
	getStats: (state: S["cardState"] | null, data: S["cardData"]) => CardStats
}

/**
 * Extractor interface for card data operations.
 * Responsible for extracting essential information from card data
 * that is used for identification and discovery within the system.
 *
 * @template S - The storage type specification that defines the card data type.
 */
export interface CardDataExtractor<S extends StorageTypeSpec> {
	/**
	 * Extracts a globally unique identifier from card data.
	 * This ID is used for synchronization and exports across devices,
	 * ensuring consistent card identification outside of a single device.
	 *
	 * @param data - The card's data containing content and metadata.
	 * @returns A string representing the card's global unique identifier.
	 */
	getGlobalId: (data: S["cardData"]) => string

	/**
	 * Determines the discovery priority of a card.
	 * This priority affects when new cards are introduced to the user,
	 * with higher priority cards being discovered first.
	 *
	 * @param data - The card's data containing content and metadata.
	 * @returns A numeric priority value where higher numbers indicate higher discovery priority.
	 */
	getDiscoveryPriority: (data: S["cardData"]) => number
}

/**
 * Extractor interface for collection data operations.
 * Responsible for extracting essential information from collection data
 * that is used for identification within the system.
 *
 * @template S - The storage type specification that defines the collection data type.
 */
export interface CollectionDataExtractor<S extends StorageTypeSpec> {
	/**
	 * Extracts a globally unique identifier from collection data.
	 * This ID is used for synchronization and exports across devices,
	 * ensuring consistent collection identification outside of a single device.
	 *
	 * @param data - The collection's data containing metadata and configuration.
	 * @returns A string representing the collection's global unique identifier.
	 */
	getGlobalId: (data: S["collectionData"]) => string
}
