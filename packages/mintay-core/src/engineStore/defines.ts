import { CardId } from "../defines/typings/cardId"
import { StorageTypeSpec } from "../defines/typings/typeSpec"

/**
 * Interface representing an engine store that manages events and states for cards.
 * @template T - The type specification for card events and states.
 * @template Queue - The type used to identify queues, either string or number.
 */
export interface EngineStore<T extends StorageTypeSpec> {
	/**
	 * Pushes an event onto the stack for the specified card ID.
	 * @param id - The card ID to push the event for.
	 * @param event - The event to push.
	 * @returns A promise that resolves when the event has been pushed.
	 */
	push: (id: CardId, event: T["cardEvent"]) => Promise<void>

	/**
	 * Pops the top event from the stack for the specified card ID.
	 * @param id - The card ID to pop the event from.
	 * @returns A promise that resolves when the event has been popped.
	 */
	popCard: (id: CardId) => Promise<void>

	/**
	 * Pops the most recently pushed event from the store, regardless of card ID.
	 * @returns A promise that resolves when the event has been popped.
	 */
	pop: () => Promise<void>

	/**
	 * Retrieves the card ID with the highest priority from the specified queues.
	 * If no queues are specified, considers all queues.
	 * Only considers cards that have at least one event (excludes cards with no events).
	 * S
	 * @param queues - Optional array of queues to filter the search.
	 * @returns A promise that resolves to the card ID with the highest priority or null if none found.
	 */
	getTopCard: (queues?: T["queue"][]) => Promise<CardId | null>

	/**
	 * Retrieves the current state data for the specified card ID.
	 * @param id - The card ID to get the state for.
	 * @returns A promise that resolves to the current state of the card.
	 */
	getCardData: (id: CardId) => Promise<T["cardState"]>
}
