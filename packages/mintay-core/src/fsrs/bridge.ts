import { Card as FSRSCard, State as FSRSState } from "ts-fsrs"
import { SdelkaCardStateFSRS } from "../defines/card/sdelkaCardState"
import { SdelkaCardQueue } from "../defines/card/sdelkaQueue"

export class FSRSBridge {
	private constructor() {}

	public static readonly convertStateFromFSRS = (
		state: FSRSState,
	): SdelkaCardQueue => {
		switch (state) {
			case FSRSState.New:
				return SdelkaCardQueue.NEW
			case FSRSState.Learning:
				return SdelkaCardQueue.LEARNING
			case FSRSState.Review:
				return SdelkaCardQueue.LEARNED
			case FSRSState.Relearning:
				return SdelkaCardQueue.RELEARNING
			default:
				throw new Error(`Unknown FSRSState: ${state}`)
		}
	}

	public static readonly convertCardFromFSRS = (
		card: FSRSCard,
	): SdelkaCardStateFSRS => {
		return {
			dueTimestamp: card.due.getTime(),
			stability: card.stability,
			difficulty: card.difficulty,
			elapsedDays: card.elapsed_days,
			scheduledDays: card.scheduled_days,
			reps: card.reps,
			lapses: card.lapses,
			state: FSRSBridge.convertStateFromFSRS(card.state),
			lastReviewTimestamp: card.last_review
				? card.last_review.getTime()
				: null,
		}
	}

	public static readonly convertStateToFSRS = (
		state: SdelkaCardQueue,
	): FSRSState => {
		switch (state) {
			case SdelkaCardQueue.NEW:
				return FSRSState.New
			case SdelkaCardQueue.LEARNING:
				return FSRSState.Learning
			case SdelkaCardQueue.LEARNED:
				return FSRSState.Review
			case SdelkaCardQueue.RELEARNING:
				return FSRSState.Relearning
			default:
				throw new Error(`Unknown SdelkaCardState: ${state}`)
		}
	}

	public static readonly convertCardToFSRS = (
		card: SdelkaCardStateFSRS,
	): FSRSCard => {
		const fsrsCard: FSRSCard = {
			due: new Date(card.dueTimestamp),
			stability: card.stability,
			difficulty: card.difficulty,
			elapsed_days: card.elapsedDays,
			scheduled_days: card.scheduledDays,
			reps: card.reps,
			lapses: card.lapses,
			state: FSRSBridge.convertStateToFSRS(card.state),
			...(card.lastReviewTimestamp !== null && {
				last_review: new Date(card.lastReviewTimestamp),
			}),
		}
		return fsrsCard
	}
}
