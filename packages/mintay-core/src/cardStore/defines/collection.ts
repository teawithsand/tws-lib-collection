import { MintayId } from "../../defines/id"
import { TypeSpec } from "../../defines/typeSpec"
import { CardHandle } from "./card"

export type CollectionGetCardsParams = {
	offset?: number
	limit?: number
}

export interface CollectionHandle<T extends TypeSpec> {
	readonly id: MintayId

	save: (data: T["collectionData"]) => Promise<void>
	update: (partial: Partial<T["collectionData"]>) => Promise<void>
	read: () => Promise<T["collectionData"] | null>
	mustRead: () => Promise<T["collectionData"]>
	exists: () => Promise<boolean>
	delete: () => Promise<void>

	getCardCount: () => Promise<number>
	getCards: (offset?: CollectionGetCardsParams) => Promise<CardHandle<T>[]>

	getCard: (id: MintayId) => Promise<CardHandle<T>>
	createCard: () => Promise<CardHandle<T>>
}

export interface CollectionStore<T extends TypeSpec> {
	list: () => Promise<MintayId[]>
	create: () => Promise<CollectionHandle<T>>
	get: (id: MintayId) => CollectionHandle<T>
}
