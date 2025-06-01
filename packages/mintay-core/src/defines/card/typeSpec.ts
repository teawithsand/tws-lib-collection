import {
	MintayCardData,
	MintayCardEvent,
	MintayCardQueue,
	MintayCardState,
	MintayCollectionData,
} from ".."
import { StorageTypeSpec } from "../typings/typeSpec"

export interface MintayTypeSpec extends StorageTypeSpec {
	collectionData: MintayCollectionData
	cardData: MintayCardData
	cardState: MintayCardState
	cardEvent: MintayCardEvent
	queue: MintayCardQueue
}
