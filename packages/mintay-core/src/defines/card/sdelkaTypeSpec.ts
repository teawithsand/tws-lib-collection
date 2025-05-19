import {
	SdelkaCardData,
	SdelkaCardEvent,
	SdelkaCardState,
	SdelkaCollectionData,
} from ".."
import { StorageTypeSpec } from "../typings/typeSpec"

export interface SdelkaTypeSpec extends StorageTypeSpec {
	collectionData: SdelkaCollectionData
	cardData: SdelkaCardData
	cardState: SdelkaCardState
	cardEvent: SdelkaCardEvent
}
