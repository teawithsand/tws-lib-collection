import { CardStateExtractor } from "../typings/defines"
import { CardStats } from "./cardStats"
import { MintayCardState } from "./sdelkaCardState"
import { MintayCardQueue } from "./sdelkaQueue"

export class MintayCardStateExtractor
	implements CardStateExtractor<MintayCardState, MintayCardQueue>
{
	public readonly getPriority = (state: MintayCardState): number =>
		-state.fsrs.dueTimestamp

	public readonly getQueue = (state: MintayCardState): MintayCardQueue =>
		state.fsrs.state

	public readonly getStats = (state: MintayCardState): CardStats => ({
		repeats: state.fsrs.reps,
		lapses: state.fsrs.lapses,
	})
}
