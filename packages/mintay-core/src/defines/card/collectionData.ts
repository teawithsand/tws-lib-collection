/**
 * Represents the data structure for a collection of cards used by Mintay.
 */
export type MintayCollectionData = {
	/** The unique global identifier of the collection. */
	globalId: string

	/** The title of the collection. */
	title: string

	/** A brief description of the collection. */
	description: string

	/** The timestamp when the collection was created. */
	createdAtTimestamp: number

	/** The timestamp when the collection was last updated. */
	lastUpdatedAtTimestamp: number
}

export class MintayCollectionDataUtil {
	private constructor() {}

	public static readonly getDefaultData = (): MintayCollectionData => ({
		globalId: "",
		title: "",
		description: "",
		createdAtTimestamp: 0,
		lastUpdatedAtTimestamp: 0,
	})
}
