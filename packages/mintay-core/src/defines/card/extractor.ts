import { CardExtractor } from "../typings/defines"
import { MintayCardData } from "./cardData"
import { MintayCardState } from "./cardState"
import { CardStats } from "./cardStats"
import { MintayCardQueue } from "./queue"
import { MintayTypeSpec } from "./typeSpec"

export class MintayCardExtractor implements CardExtractor<MintayTypeSpec> {
	public readonly getPriority = (
		state: MintayCardState | null,
		data: MintayCardData,
	): number => {
		if (state && state.fsrs.dueTimestamp) {
			return state.fsrs.dueTimestamp
		} else {
			return data.discoveryPriority
		}
	}

	public readonly getQueue = (
		state: MintayCardState | null,
	): MintayCardQueue => {
		if (state) {
			return state.fsrs.state
		} else {
			return MintayCardQueue.NEW
		}
	}

	public readonly getStats = (state: MintayCardState | null): CardStats => {
		if (state) {
			return {
				repeats: state.fsrs.reps,
				lapses: state.fsrs.lapses,
			}
		} else {
			return {
				lapses: 0,
				repeats: 0,
			}
		}
	}
}
