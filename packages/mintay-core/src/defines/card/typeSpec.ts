import { MintayCardEvent, MintayCardQueue, MintayCardState } from ".."
import { StorageTypeSpec } from "../typings/typeSpec"

/**
 * Lets you customize preset mintay types with your own collection and card data types.
 */
export type MintayTypeSpecParams = {
	collectionData: Record<string, unknown>
	cardData: Record<string, unknown>
}

export interface MintayTypeSpec<T extends MintayTypeSpecParams>
	extends StorageTypeSpec {
	collectionData: T["collectionData"]
	cardData: T["cardData"]
	cardState: MintayCardState
	cardEvent: MintayCardEvent
	queue: MintayCardQueue
}
