import { CardId } from "../../defines/typings/cardId"
import { StorageTypeSpec } from "../../defines/typings/typeSpec"

export interface CardHandle<T extends StorageTypeSpec> {
	readonly id: CardId

	save: (data: T["cardData"]) => Promise<void>
	update: (partial: Partial<T["cardData"]>) => Promise<void>
	read: () => Promise<T["cardData"]>
	exists: () => Promise<boolean>
	delete: () => Promise<void>

	setCollection: (id: CardId) => Promise<void>
}

export interface CardStore<T extends StorageTypeSpec> {
	getCardById: (id: CardId) => Promise<CardHandle<T> | null>
}
