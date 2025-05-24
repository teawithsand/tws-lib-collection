import { MintayCardQueue } from "./queue"

// See: https://github.com/open-spaced-repetition/ts-fsrs?tab=readme-ov-file#5-understanding-card-attributes

/**
 * Represents the Free Spaced Repetition Scheduler (FSRS) state of a Mintay card.
 * This information is used by the FSRS algorithm to determine the next review date.
 */
export type MintayCardStateFSRS = {
	/**
	 * The timestamp indicating when the card is next due for review.
	 * This is a Unix timestamp (milliseconds since epoch).
	 */
	dueTimestamp: number
	/**
	 * A numerical measure of how well the information on the card is retained in memory.
	 * Higher stability means the information is less likely to be forgotten.
	 */
	stability: number
	/**
	 * A numerical measure reflecting the inherent difficulty of the card's content.
	 * Higher difficulty means the card is harder to learn and remember.
	 */
	difficulty: number
	/**
	 * The number of days that have passed since the card was last reviewed.
	 */
	elapsedDays: number
	/**
	 * The interval, in days, scheduled between the last review and the upcoming one.
	 */
	scheduledDays: number
	/**
	 * The total number of times the card has been reviewed by the user.
	 */
	reps: number
	/**
	 * The number of times the user has forgotten or incorrectly recalled the information on the card.
	 */
	lapses: number
	/**
	 * The current learning phase or queue of the card within the FSRS system.
	 * (e.g., New, Learning, Review, Relearning).
	 */
	state: MintayCardQueue
	/**
	 * The timestamp of the most recent review, if the card has been reviewed at least once.
	 * This is a Unix timestamp (milliseconds since epoch), or null if never reviewed.
	 */
	lastReviewTimestamp: number | null
}

/**
 * Represents the overall state of a Mintay card, primarily encompassing its FSRS data.
 */
export type MintayCardState = {
	/**
	 * The FSRS-specific state information for the card.
	 */
	fsrs: MintayCardStateFSRS
}
