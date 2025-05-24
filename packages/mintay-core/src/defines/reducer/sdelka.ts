import { createEmptyCard, FSRS } from "ts-fsrs"
import { FSRSBridge } from "../../fsrs"
import { FsrsParameters } from "../../fsrs/params"
import { SdelkaAnswer, SdelkaCardState } from "../card"
import { SdelkaCardEvent, SdelkaCardEventType } from "../card/sdelkaCardEvent"
import { CardStateReducer } from "./defines"

export class SdelkaCardStateReducer
	implements CardStateReducer<SdelkaCardEvent, SdelkaCardState>
{
	private readonly fsrs

	constructor(params: Readonly<FsrsParameters>) {
		this.fsrs = new FSRS(FSRSBridge.convertParamsToFSRS(params))
	}

	public readonly getPossibleStates = (
		state: SdelkaCardState,
		timestamp: number,
	): Map<SdelkaAnswer, SdelkaCardState> => {
		const tuples = [
			SdelkaAnswer.AGAIN,
			SdelkaAnswer.HARD,
			SdelkaAnswer.GOOD,
			SdelkaAnswer.EASY,
		].map((answer): [SdelkaAnswer, SdelkaCardState] => {
			return [
				answer,
				this.fold(state, {
					type: SdelkaCardEventType.ANSWER,
					answer,
					timestamp,
				}),
			]
		})

		return new Map(tuples)
	}

	public readonly fold = (
		state: SdelkaCardState,
		event: SdelkaCardEvent,
	): SdelkaCardState => {
		switch (event.type) {
			case SdelkaCardEventType.ANSWER: {
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

	public readonly getDefaultState = (): SdelkaCardState => {
		const card = createEmptyCard(0)
		const fsrs = FSRSBridge.convertCardFromFSRS(card)

		fsrs.dueTimestamp = 0

		return {
			fsrs: fsrs,
		}
	}
}
