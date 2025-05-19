import { CardStateExtractor } from "../typings/defines"
import { CardStats } from "./cardStats"
import { SdelkaCardState } from "./sdelkaCardState"
import { SdelkaCardQueue } from "./sdelkaQueue"

export class SdelkaCardStateExtractor
	implements CardStateExtractor<SdelkaCardState, SdelkaCardQueue>
{
	public readonly getPriority = (state: SdelkaCardState): number =>
		-state.fsrs.dueTimestamp

	public readonly getQueue = (state: SdelkaCardState): SdelkaCardQueue =>
		state.fsrs.state

	public readonly getStats = (state: SdelkaCardState): CardStats => ({
		repeats: state.fsrs.reps,
		lapses: state.fsrs.lapses,
	})
}
