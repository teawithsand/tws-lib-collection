import { CardId } from "../../defines/typings/cardId"
import { StorageTypeSpec } from "../../defines/typings/typeSpec"
import { CardHandle } from "./card"

export type CollectionGetCardsParams = {
	offset?: number
	limit?: number
}

export interface CollectionHandle<T extends StorageTypeSpec> {
	readonly id: CardId

	save: (data: T["collectionData"]) => Promise<void>
	update: (partial: Partial<T["collectionData"]>) => Promise<void>
	read: () => Promise<T["collectionData"]>
	exists: () => Promise<boolean>
	delete: () => Promise<void>

	getCardCount: () => Promise<number>
	getCards: (offset?: CollectionGetCardsParams) => Promise<CardHandle<T>[]>

	getCard: (id: CardId) => Promise<CardHandle<T>>
	createCard: () => Promise<CardHandle<T>>
}

export interface CollectionStore<T extends StorageTypeSpec> {
	create: () => Promise<CollectionHandle<T>>
	get: (id: CardId) => CollectionHandle<T>
}
