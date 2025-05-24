import type { ObjectStore } from "@teawithsand/blob-store"
import { ABook } from "../defines/abook/abook"
import { ABookSerializer } from "../defines/abook/stored"
import { Id, WithId } from "../utils/withId"
import { ABookStore } from "./abookStore"

export class ObjectStoreABookStore implements ABookStore {
	private readonly store: ObjectStore<void>

	constructor({ store }: { store: ObjectStore<void> }) {
		this.store = store
	}

	public readonly getABooks = async (): Promise<WithId<ABook>[]> => {
		const keys = await this.store.getKeys("")
		const abooks: WithId<ABook>[] = []
		for (const id of keys) {
			const abook = await this.getABook(id)
			if (abook) abooks.push({ id, data: abook })
		}
		return abooks
	}

	public readonly saveABook = async (id: Id, abook: ABook): Promise<void> => {
		const stored = ABookSerializer.serialize(abook)
		const blob = new Blob([JSON.stringify(stored)], {
			type: "application/json",
		})
		await this.store.setBlob(id, blob)
	}

	public readonly deleteABook = async (id: Id): Promise<void> => {
		await this.store.setBlob(id, null)
	}

	public readonly getABook = async (id: Id): Promise<ABook | null> => {
		const blob = await this.store.getBlob(id)
		if (!blob) return null
		try {
			const text = await blob.text()
			const stored = JSON.parse(text)
			return ABookSerializer.deserialize(stored)
		} catch {
			return null
		}
	}
}
