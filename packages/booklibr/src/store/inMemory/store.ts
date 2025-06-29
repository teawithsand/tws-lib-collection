import { generateUuid } from "@teawithsand/lngext"
import { AbookHeaderData } from "../../defines"
import { AbookStore } from "../defines"
import { AbookAggregator, AbookHandle } from "../defines/abookHandle"
import { AbookEntryAggregator } from "../defines/entryHandle"
import { InMemoryAbookHandle } from "./abookHandle"
import { InternalAbook } from "./internal"

export class InMemoryAbookStore implements AbookStore {
	private abooks = new Map<string, InternalAbook>()

	public constructor(
		public readonly abookAggregator: AbookAggregator,
		public readonly abookEntryAggregator: AbookEntryAggregator,
	) {}

	public getAbook(id: string): InternalAbook | undefined {
		return this.abooks.get(id)
	}

	public deleteAbook(id: string): boolean {
		return this.abooks.delete(id)
	}

	public readonly createAbook = async (
		data: AbookHeaderData,
	): Promise<AbookHandle> => {
		const id = generateUuid()
		this.abooks.set(id, {
			headerData: data,
			entries: new Map(),
			aggregate: null,
		})
		const handle = new InMemoryAbookHandle(this, id)
		await handle.computeAggregate()
		return handle
	}

	public readonly listAbooks = async (): Promise<AbookHandle[]> => {
		return Array.from(this.abooks.keys()).map(
			(id) => new InMemoryAbookHandle(this, id),
		)
	}
}
