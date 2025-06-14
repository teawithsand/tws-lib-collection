import { CardStats } from "../card/cardStats"
import { StorageTypeSpec } from "./typeSpec"

export type CardId = string | number

export interface CardExtractor<S extends StorageTypeSpec> {
	getPriority: (state: S["cardState"] | null, data: S["cardData"]) => number
	getQueue: (state: S["cardState"] | null, data: S["cardData"]) => S["queue"]
	getStats: (state: S["cardState"] | null, data: S["cardData"]) => CardStats
}
