import { generateUuid } from "@teawithsand/lngext"
import { AbookHeaderData, Id } from "../../defines"
import { AbookAggregatorImpl } from "../aggregate/abookAggregator"
import { AbookStore } from "../defines"
import { AbookAggregator, AbookHandle } from "../defines/abookHandle"
import { AbookEntryAggregator } from "../defines/entryHandle"
import { InMemoryAbookHandle } from "./abookHandle"
import { InternalAbook } from "./internal"

export class InMemoryAbookStore implements AbookStore {
	private abooks = new Map<string, InternalAbook>()

	public readonly abookAggregator: AbookAggregator
	public readonly abookEntryAggregator: AbookEntryAggregator

	public constructor(options: {
		abookEntryAggregator: AbookEntryAggregator
		abookAggregator?: AbookAggregator
	}) {
		this.abookAggregator =
			options.abookAggregator ?? AbookAggregatorImpl.create()
		this.abookEntryAggregator = options.abookEntryAggregator
	}

	public getAbook(id: string): InternalAbook | undefined {
		return this.abooks.get(id)
	}

	public deleteAbook(id: string): boolean {
		return this.abooks.delete(id)
	}

	public setAbook(id: string, abook: InternalAbook): void {
		this.abooks.set(id, abook)
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

	public readonly get = async (id: Id): Promise<AbookHandle> => {
		const idStr = id.toString()
		// Always return a handle, even if the abook doesn't exist
		// The handle will return exists() = false if it doesn't exist
		return new InMemoryAbookHandle(this, idStr)
	}
}
