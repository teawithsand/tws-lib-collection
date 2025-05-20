/**
 * Represents the different sources of truth for an ABook.
 */
export enum ABookTruthSourceType {
	/**
	 * Indicates that the ABook's primary source of truth is its internal storage.
	 */
	INTERNAL_STORAGE = 1,
}

export type ABookTruthSource = {
	type: ABookTruthSourceType.INTERNAL_STORAGE
}
