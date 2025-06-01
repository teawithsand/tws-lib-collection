import { CardDataExtractor, CardStateExtractor } from "../typings/defines"
import { MintayCardData } from "./cardData"
import { MintayCardState } from "./cardState"
import { CardStats } from "./cardStats"
import { MintayCardQueue } from "./queue"
import { MintayTypeSpec } from "./typeSpec"

export class MintayCardStateExtractor
	implements CardStateExtractor<MintayTypeSpec>
{
	public readonly getPriority = (state: MintayCardState): number =>
		state.fsrs.dueTimestamp

	public readonly getQueue = (state: MintayCardState): MintayCardQueue =>
		state.fsrs.state

	public readonly getStats = (state: MintayCardState): CardStats => ({
		repeats: state.fsrs.reps,
		lapses: state.fsrs.lapses,
	})
}

export class MintayCardDataExtractor
	implements CardDataExtractor<MintayTypeSpec>
{
	public readonly getDiscoveryPriority = (
		cardData: MintayCardData,
	): number => {
		return cardData.discoveryPriority
	}

	public readonly getInitialQueue = (): MintayCardQueue => {
		return MintayCardQueue.NEW
	}
}
