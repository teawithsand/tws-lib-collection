import { deepCopy } from "@teawithsand/lngext"
import { ABook } from "../defines/abook/abook"
import { Id, WithId } from "../utils/withId"
import { ABookStore } from "./abookStore"

export class InMemoryAbookStore implements ABookStore {
	private store = new Map<Id, ABook>()

	public readonly getABooks = async (): Promise<WithId<ABook>[]> => {
		return Array.from(this.store.entries()).map(([id, abook]) => ({
			id,
			data: abook,
		}))
	}

	public readonly saveABook = async (id: Id, abook: ABook): Promise<void> => {
		// Create a deep copy to prevent reference issues
		const abookCopy = deepCopy(abook)
		this.store.set(id, abookCopy)
	}

	public readonly deleteABook = async (id: Id): Promise<void> => {
		this.store.delete(id)
	}

	public readonly getABook = async (id: Id): Promise<ABook | null> => {
		return this.store.has(id) ? this.store.get(id)! : null
	}
}
