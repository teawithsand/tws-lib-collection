import {
	Card as FSRSCard,
	State as FSRSState,
	Rating,
	FSRSParameters as TsFSRSParameters,
} from "ts-fsrs"
import { MintayAnswer } from "../mintay/types/answer"
import { MintayCardStateFSRS } from "../mintay/types/card/state/cardState"
import { MintayCardQueue } from "../mintay/types/queue"
import { type FsrsParameters as MintayFSRSParameters } from "./params"

export class FSRSBridge {
	private constructor() {}

	public static readonly convertStateFromFSRS = (
		state: FSRSState,
	): MintayCardQueue => {
		switch (state) {
			case FSRSState.New:
				return MintayCardQueue.NEW
			case FSRSState.Learning:
				return MintayCardQueue.LEARNING
			case FSRSState.Review:
				return MintayCardQueue.LEARNED
			case FSRSState.Relearning:
				return MintayCardQueue.RELEARNING
			default:
				throw new Error(`Unknown FSRSState: ${state}`)
		}
	}

	public static readonly convertCardFromFSRS = (
		card: FSRSCard,
	): MintayCardStateFSRS => {
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
		state: MintayCardQueue,
	): FSRSState => {
		switch (state) {
			case MintayCardQueue.NEW:
				return FSRSState.New
			case MintayCardQueue.LEARNING:
				return FSRSState.Learning
			case MintayCardQueue.LEARNED:
				return FSRSState.Review
			case MintayCardQueue.RELEARNING:
				return FSRSState.Relearning
			default:
				throw new Error(`Unknown MintayCardState: ${state}`)
		}
	}

	public static readonly convertCardToFSRS = (
		card: MintayCardStateFSRS,
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

	public static readonly convertParamsToFSRS = (
		params: MintayFSRSParameters,
	): TsFSRSParameters => {
		return {
			request_retention: params.requestRetention,
			maximum_interval: params.maximumInterval,
			w: params.w,
			enable_fuzz: params.enableFuzz,
			enable_short_term: params.enableShortTerm,
		}
	}

	public static readonly convertAnswerToRating = (
		answer: MintayAnswer,
	): Rating.Again | Rating.Hard | Rating.Good | Rating.Easy => {
		switch (answer) {
			case MintayAnswer.AGAIN:
				return Rating.Again
			case MintayAnswer.HARD:
				return Rating.Hard
			case MintayAnswer.GOOD:
				return Rating.Good
			case MintayAnswer.EASY:
				return Rating.Easy
			default:
				throw new Error(`Unknown MintayAnswer: ${answer}`)
		}
	}
}
