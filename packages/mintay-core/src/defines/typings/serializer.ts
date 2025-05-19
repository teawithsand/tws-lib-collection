import { StorageTypeSpec } from "./typeSpec"

export interface TypeSpecSerializer<T extends StorageTypeSpec> {
	readonly deserializeCardData: (data: unknown) => T["cardData"]
	readonly deserializeCollectionHeader: (data: unknown) => T["collectionData"]
	readonly serializeCardData: (data: T["cardData"]) => unknown
	readonly serializeCollectionHeader: (data: T["collectionData"]) => unknown
	readonly serializeEvent: (event: T["cardEvent"]) => unknown
	readonly deserializeEvent: (data: unknown) => T["cardEvent"]
	readonly serializeState: (state: T["cardState"]) => unknown
	readonly deserializeState: (data: unknown) => T["cardState"]
}
