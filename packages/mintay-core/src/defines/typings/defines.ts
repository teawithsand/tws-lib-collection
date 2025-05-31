import { CardStats } from "../card/cardStats"
import { StorageTypeSpec } from "./typeSpec"

export interface CardStateExtractor<
	S extends StorageTypeSpec,
	Queue extends string | number,
> {
	getPriority: (state: S["cardState"], data: S["cardData"]) => number
	getQueue: (state: S["cardState"], data: S["cardData"]) => Queue
	getStats: (state: S["cardState"], data: S["cardData"]) => CardStats
}
