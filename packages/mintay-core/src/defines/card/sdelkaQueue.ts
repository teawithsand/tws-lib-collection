/**
 * Enum representing the different states of a card in the Sdelka learning queue.
 *
 * @enum {number}
 * @property {number} NEW - The card is newly added to the queue.
 * @property {number} LEARNING - The card is currently being learned.
 * @property {number} LEARNED - The card has been learned.
 * @property {number} RELEARNING - The card is being reviewed or relearned.
 */
export enum SdelkaCardQueue {
	NEW = 0,
	LEARNING = 1,
	LEARNED = 2,
	RELEARNING = 3,
}
