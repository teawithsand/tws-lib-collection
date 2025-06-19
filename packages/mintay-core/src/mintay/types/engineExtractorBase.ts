import { CardDataExtractor, CardEngineExtractor } from "../../defines/extractor"
import { CardStats } from "./card/cardStats"
import { MintayCardState } from "./card/state/cardState"
import { MintayCardQueue } from "./queue"
import { MintayTypeSpec, MintayTypeSpecParams } from "./typeSpec"

/**
 * Implements some default logic for CardEngineExtractor for mintay types.
 */
export class MintayCardEngineExtractor<T extends MintayTypeSpecParams>
	implements CardEngineExtractor<MintayTypeSpec<T>>
{
	constructor(
		private readonly cardDataExtractor: CardDataExtractor<
			MintayTypeSpec<T>
		>,
	) {}

	public readonly getPriority = (
		state: MintayCardState | null,
		data: MintayTypeSpec<T>["cardData"],
	): number => {
		if (state && state.fsrs.dueTimestamp) {
			return state.fsrs.dueTimestamp
		} else {
			return this.cardDataExtractor.getDiscoveryPriority(data)
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
