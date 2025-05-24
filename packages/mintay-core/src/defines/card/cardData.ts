/**
 * Represents the data structure for a card used by Mintay.
 */
export type MintayCardData = {
	/** The unique global identifier of the card. */
	globalId: string

	/** The main content or body of the card. */
	content: string

	/** The timestamp indicating when the card was created. */
	createdAtTimestamp: number

	/** The timestamp indicating the last time the card was updated. */
	lastUpdatedAtTimestamp: number
}
export class MintayCardDataUtil {
	private constructor() {}

	public static readonly getDefaultData = (): MintayCardData => ({
		globalId: "",
		content: "",
		createdAtTimestamp: 0,
		lastUpdatedAtTimestamp: 0,
	})
}
