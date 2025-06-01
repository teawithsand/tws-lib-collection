import { CardStats } from "../card/cardStats"
import { StorageTypeSpec } from "./typeSpec"

export interface CardStateExtractor<S extends StorageTypeSpec> {
	getPriority: (state: S["cardState"]) => number
	getQueue: (state: S["cardState"]) => S["queue"]
	getStats: (state: S["cardState"]) => CardStats
}

export interface CardDataExtractor<S extends StorageTypeSpec> {
	getDiscoveryPriority: (cardData: S["cardData"]) => number
	getInitialQueue: (cardData: S["cardData"]) => S["queue"]
}
