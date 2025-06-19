import { createEmptyCard, FSRS } from "ts-fsrs"
import { FSRSBridge } from "../../fsrs"
import { FsrsParameters } from "../../fsrs/params"
import { MintayAnswer, MintayCardState } from "../../mintay/types"
import {
	MintayCardEvent,
	MintayCardEventType,
} from "../../mintay/types/card/event/cardEvent"
import { CardStateReducer } from "./defines"

export class MintayCardStateReducer
	implements CardStateReducer<MintayCardEvent, MintayCardState>
{
	private readonly fsrs

	constructor(params: Readonly<FsrsParameters>) {
		this.fsrs = new FSRS(FSRSBridge.convertParamsToFSRS(params))
	}

	private readonly fixStateTimestamp = (
		state: MintayCardState,
		timestamp: number,
	): MintayCardState => ({
		...state,
		fsrs: {
			...state.fsrs,
			dueTimestamp: state.fsrs.dueTimestamp || timestamp,
		},
	})

	public readonly getPossibleStates = (
		state: MintayCardState,
		timestamp: number,
	): Map<MintayAnswer, MintayCardState> => {
		const tuples = [
			MintayAnswer.AGAIN,
			MintayAnswer.HARD,
			MintayAnswer.GOOD,
			MintayAnswer.EASY,
		].map((answer): [MintayAnswer, MintayCardState] => {
			state = this.fixStateTimestamp(state, timestamp)

			return [
				answer,
				this.fold(state, {
					type: MintayCardEventType.ANSWER,
					answer,
					timestamp,
				}),
			]
		})

		return new Map(tuples)
	}

	public readonly fold = (
		state: MintayCardState,
		event: MintayCardEvent,
	): MintayCardState => {
		switch (event.type) {
			case MintayCardEventType.ANSWER: {
				state = this.fixStateTimestamp(state, event.timestamp)
				const fsrsCard = FSRSBridge.convertCardToFSRS(state.fsrs)
				const rating = FSRSBridge.convertAnswerToRating(event.answer)
				const now = new Date(event.timestamp)

				const allSchedules = this.fsrs.repeat(fsrsCard, now)
				const schedule = allSchedules[rating]

				return {
					fsrs: FSRSBridge.convertCardFromFSRS(schedule.card),
				}
			}
			default:
				return state
		}
	}

	public readonly getDefaultState = (): MintayCardState => {
		const card = createEmptyCard(0)
		const fsrs = FSRSBridge.convertCardFromFSRS(card)

		fsrs.dueTimestamp = 0

		return {
			fsrs: fsrs,
		}
	}
}
