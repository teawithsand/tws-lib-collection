/**
 * Statistics related to a card's review history.
 */
export type CardStats = {
	/** Number of times the card has been repeated successfully */
	repeats: number
	/** Number of times the card has been forgotten or failed (lapses) */
	lapses: number
}
