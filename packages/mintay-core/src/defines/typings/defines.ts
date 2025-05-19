import { CardStats } from "../card/cardStats"

export interface CardStateExtractor<State, Queue extends string | number> {
	getPriority: (state: State) => number
	getQueue: (state: State) => Queue
	getStats: (state: State) => CardStats
}
