/**
 * Represents the data structure for a card used by Sdelka.
 */
export type SdelkaCardData = {
	/** The unique global identifier of the card. */
	globalId: string

	/** The main content or body of the card. */
	content: string

	/** The timestamp indicating when the card was created. */
	createdAtTimestamp: number

	/** The timestamp indicating the last time the card was updated. */
	lastUpdatedAtTimestamp: number
}
