import { CardId } from "../../defines/typings/cardId"
import { StorageTypeSpec } from "../../defines/typings/typeSpec"
import { InMemoryDb } from "../../inMemoryDb/db"
import { CardHandle, CardStore } from "../defines/card"
import { InMemoryCardHandle } from "./cardHandle"

export class InMemoryCardStore<T extends StorageTypeSpec>
	implements CardStore<T>
{
	private readonly db: InMemoryDb<T>

	constructor({ db }: { db: InMemoryDb<T> }) {
		this.db = db
	}

	public readonly getCardById = async (
		id: CardId,
	): Promise<CardHandle<T> | null> => {
		const card = this.db.getCardById(id)
		if (!card) {
			return null
		}
		return new InMemoryCardHandle<T>({ id, db: this.db })
	}
}
