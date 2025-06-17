/**
 * Represents the data structure for a collection of cards used by Mintay.
 */
export type MintayCollectionData = {
	/** The unique global identifier of the collection. */
	globalId: string

	/** The timestamp when the collection was created. */
	createdAtTimestamp: number

	/** The timestamp when the collection was last updated. */
	lastUpdatedAtTimestamp: number

	/** External data to be used by client application. It has role analogous to content of MintayCardData. */
	content: string
}

export class MintayCollectionDataUtil {
	private constructor() {}

	public static readonly getDefaultData = (): MintayCollectionData => ({
		globalId: "",
		createdAtTimestamp: 0,
		lastUpdatedAtTimestamp: 0,
		content: "",
	})
}
