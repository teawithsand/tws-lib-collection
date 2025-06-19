import { TypeSpec } from "../../defines/typeSpec"
import { MintayCardEvent } from "./card/event/cardEvent"
import { MintayCardState } from "./card/state/cardState"
import { MintayCardQueue } from "./queue"

/**
 * Parameters for customizing Mintay type specifications.
 *
 * Use this type to define your own collection and card data structures for Mintay.
 * Pass your type as the generic argument to {@link MintayTypeSpec} to strongly type
 * collection and card data throughout the Mintay system.
 *
 * @property collectionData - The type of data associated with the collection as a whole.
 * @property cardData - The type of data associated with individual cards.
 */
export type MintayTypeSpecParams = {
	collectionData: Record<string, unknown>
	cardData: Record<string, unknown>
}

export interface MintayTypeSpec<T extends MintayTypeSpecParams>
	extends TypeSpec {
	/**
	 * Main type specification for Mintay collections and cards.
	 *
	 * This interface extends {@link TypeSpec} and provides strong typing for all core Mintay data:
	 * - Collection data
	 * - Card data
	 * - Card state
	 * - Card event
	 * - Card queue
	 *
	 * Use {@link MintayTypeSpec} with your own type parameter to ensure type safety and
	 * consistency across Mintay APIs, extractors, and stores.
	 *
	 * @typeParam T - The type parameter specifying the structure of collection and card data.
	 *
	 * @property collectionData - Strongly typed data for the collection, as defined by T.
	 * @property cardData - Strongly typed data for individual cards, as defined by T.
	 * @property cardState - State information for a card (see {@link MintayCardState}).
	 * @property cardEvent - Event or action data for a card (see {@link MintayCardEvent}).
	 * @property queue - The queue or scheduling state for a card (see {@link MintayCardQueue}).
	 *
	 * @see MintayTypeSpecParams for customizing the data types.
	 * @see TypeSpec for the generic base interface.
	 */
	collectionData: T["collectionData"]
	cardData: T["cardData"]
	cardState: MintayCardState
	cardEvent: MintayCardEvent
	queue: MintayCardQueue
}
