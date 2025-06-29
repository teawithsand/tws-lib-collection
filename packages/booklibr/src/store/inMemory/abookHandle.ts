import { generateUuid } from "@teawithsand/lngext"
import {
	Abook,
	AbookAggregateData,
	AbookData,
	AbookEntry,
	AbookEntryAggregateData,
	AbookEntryData,
} from "../../defines"
import { AbookHandle, AbookWriteHeaderOptions } from "../defines/abookHandle"
import { AbookWriteAggregateType } from "../defines/aggregate"
import { AbookEntryHandle } from "../defines/entryHandle"
import { AbookNotFoundError } from "../defines/error"
import { InMemoryAbookEntryHandle } from "./entryHandle"
import { InternalAbook, InternalAbookEntry } from "./internal"
import { InMemoryAbookStore } from "./store"

export class InMemoryAbookHandle implements AbookHandle {
	public constructor(
		private readonly store: InMemoryAbookStore,
		public readonly id: string,
	) {}

	public readonly exists = async (): Promise<boolean> => {
		return !!this.getAbook()
	}

	public readonly read = async (): Promise<Abook | null> => {
		const internalAbook = this.getAbook()
		if (!internalAbook) {
			return null
		}

		const entries = new Map<string, AbookEntry>()
		for (const [id, entry] of internalAbook.entries) {
			const aggregate: AbookEntryAggregateData = {
				metadata: null,
				blobSize: entry.blob?.size ?? null,
			}
			entries.set(id, new AbookEntry({ data: entry.data, aggregate }))
		}

		const aggregate: AbookAggregateData = internalAbook.aggregate ?? {
			totalEntries: -1, // Cleared aggregate indicator
			totalDurationMillis: -1, // Cleared aggregate indicator
		}

		const data: AbookData = {
			header: internalAbook.headerData,
			entries,
		}

		return new Abook({
			data: data,
			aggregate,
		})
	}

	public readonly mustRead = async (): Promise<Abook> => {
		const abook = await this.read()
		if (!abook) {
			throw new AbookNotFoundError(`Abook with id ${this.id} not found`)
		}
		return abook
	}

	public readonly write = async (
		options: AbookWriteHeaderOptions,
	): Promise<void> => {
		const abook = this.getAbookOrThrow()
		if (options.data) {
			abook.headerData = options.data
		}

		const aggregateOptions = options.aggregate
		if (aggregateOptions) {
			switch (aggregateOptions.type) {
				case AbookWriteAggregateType.RECOMPUTE:
					await this.computeAggregate()
					break
				case AbookWriteAggregateType.CLEAR:
					abook.aggregate = null
					break
				case AbookWriteAggregateType.LEAVE_UNMODIFIED:
					break
				case AbookWriteAggregateType.SET:
					abook.aggregate = aggregateOptions.data
					break
			}
		} else {
			await this.computeAggregate()
		}
	}

	public readonly createEntry = async (
		data: AbookEntryData,
	): Promise<AbookEntryHandle> => {
		const abook = this.getAbookOrThrow()
		const id = generateUuid()

		const entry: InternalAbookEntry = {
			data: data,
			blob: null,
			aggregate: null,
		}

		abook.entries.set(id, entry)

		return new InMemoryAbookEntryHandle(this.store, this, id)
	}

	public readonly listEntries = async (): Promise<AbookEntryHandle[]> => {
		const abook = this.getAbookOrThrow()
		return Array.from(abook.entries.keys()).map(
			(id) => new InMemoryAbookEntryHandle(this.store, this, id),
		)
	}

	public readonly delete = async (): Promise<void> => {
		this.store.deleteAbook(this.id)
	}

	public readonly computeAggregate = async (): Promise<void> => {
		const abook = this.getAbookOrThrow()
		const richAbook = await this.mustRead()
		abook.aggregate = await this.store.abookAggregator.aggregate(
			richAbook.data,
		)
	}

	private readonly getAbook = (): InternalAbook | undefined => {
		return this.store.getAbook(this.id)
	}

	private readonly getAbookOrThrow = (): InternalAbook => {
		const abook = this.getAbook()
		if (!abook) {
			throw new AbookNotFoundError(`Abook with id ${this.id} not found`)
		}
		return abook
	}
}
