import { MintayId } from "../../defines/id"
import { TypeSpec } from "../../defines/typeSpec"
import { InMemoryDb } from "../../inMemoryDb/db"
import { CardHandle, CardStore } from "../defines/card"
import { InMemoryCardHandle } from "./cardHandle"

export class InMemoryCardStore<T extends TypeSpec> implements CardStore<T> {
	private readonly db: InMemoryDb<T>

	constructor({ db }: { db: InMemoryDb<T> }) {
		this.db = db
	}

	public readonly getCardById = async (
		id: MintayId,
	): Promise<CardHandle<T> | null> => {
		const card = this.db.getCardById(id)
		if (!card) {
			return null
		}
		return new InMemoryCardHandle<T>({ id, db: this.db })
	}
}
