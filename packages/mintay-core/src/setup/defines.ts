import { SerializerReverse } from "@teawithsand/reserd"
import { CardStore, CollectionStore } from "../cardStore"
import {
	CardDataExtractor,
	CardEngineExtractor,
	CardId,
	CollectionDataExtractor,
	MintayTypeSpec,
	MintayTypeSpecParams,
} from "../defines"
import { EngineStore } from "../engineStore"
import { FsrsParameters } from "../fsrs"

/**
 * Configuration parameters required to initialize a Mintay instance.
 * This interface defines the essential components needed to handle custom collection and card data types.
 *
 * @template T - The type specification parameters that define the custom collection and card data types.
 */
export interface MintayParams<T extends MintayTypeSpecParams> {
	/**
	 * Extractor for collection-specific data.
	 * Responsible for extracting and processing collection metadata and custom properties.
	 * This extractor defines how collection data is accessed and manipulated within the system.
	 */
	collectionDataExtractor: CollectionDataExtractor<MintayTypeSpec<T>>

	/**
	 * Extractor for card-specific data.
	 * Responsible for extracting and processing individual card content and custom properties.
	 * This extractor defines how card data is accessed and manipulated within the system.
	 */
	cardDataExtractor: CardDataExtractor<MintayTypeSpec<T>>

	/**
	 * Extractor for card engine-specific data.
	 * Responsible for extracting and processing card learning state and engine-related properties
	 * required for spaced repetition algorithms. This extractor defines how the learning engine
	 * accesses card performance data, scheduling information, and other engine-specific metadata.
	 */
	cardEngineExtractor: CardEngineExtractor<MintayTypeSpec<T>>

	/**
	 * Serializer for collection data persistence.
	 * Handles the conversion between collection data objects and their string representation
	 * for storage and retrieval operations. Ensures data integrity across application sessions.
	 */
	collectionDataSerializer: SerializerReverse<T["collectionData"]>

	/**
	 * Serializer for card data persistence.
	 * Handles the conversion between card data objects and their string representation
	 * for storage and retrieval operations. Ensures data integrity across application sessions.
	 */
	cardDataSerializer: SerializerReverse<T["cardData"]>

	/**
	 * Default card data used when creating new cards.
	 * This value serves as the initial state for card data when no specific data is provided
	 * during card creation. It ensures that all cards have consistent default properties.
	 */
	defaultCardDataFactory: () => MintayTypeSpec<T>["cardData"]

	/**
	 * Default collection data used when creating new collections.
	 * This value serves as the initial state for collection data when no specific data is provided
	 * during collection creation. It ensures that all collections have consistent default properties.
	 */
	defaultCollectionDataFactory: () => MintayTypeSpec<T>["collectionData"]
}

/**
 * Represents the main entry point for interacting with Mintay's core functionalities.
 * It provides access to card collections, individual cards, and engine stores.
 */
export interface Mintay<T extends MintayTypeSpecParams> {
	/**
	 * Provides access to the collection store, allowing management of card collections.
	 */
	readonly collectionStore: CollectionStore<MintayTypeSpec<T>>

	/**
	 * Provides access to the card store, allowing direct management of individual cards.
	 */
	readonly cardStore: CardStore<MintayTypeSpec<T>>

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
	) => EngineStore<MintayTypeSpec<T>>
}
