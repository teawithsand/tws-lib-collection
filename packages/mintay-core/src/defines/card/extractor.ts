import { CardStateExtractor } from "../typings/defines"
import { MintayCardState } from "./cardState"
import { CardStats } from "./cardStats"
import { MintayCardQueue } from "./queue"
import { MintayTypeSpec } from "./typeSpec"

export class MintayCardStateExtractor
	implements CardStateExtractor<MintayTypeSpec, MintayCardQueue>
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
