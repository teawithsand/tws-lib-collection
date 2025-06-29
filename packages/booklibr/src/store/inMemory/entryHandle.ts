import { FsWriter } from "@teawithsand/fstate"
import { AbookEntry, AbookEntryAggregateData } from "../../defines"
import { AbookWriteAggregateType } from "../defines/aggregate"
import {
	AbookEntryHandle,
	AbookEntryWriteOptions,
} from "../defines/entryHandle"
import {
	AbookEntryBlobNotFoundError,
	AbookEntryNotFoundError,
	AbookNotFoundError,
} from "../defines/error"
import { InMemoryAbookHandle } from "./abookHandle"
import { InMemoryFsWriter } from "./fsWriter"
import { InternalAbook, InternalAbookEntry } from "./internal"
import { InMemoryAbookStore } from "./store"

export class InMemoryAbookEntryHandle implements AbookEntryHandle {
	public constructor(
		private readonly store: InMemoryAbookStore,
		public readonly abookHandle: InMemoryAbookHandle,
		public readonly id: string,
	) {}

	private readonly getAbookOrThrow = (): InternalAbook => {
		const abook = this.store.getAbook(this.abookHandle.id)
		if (!abook) {
			throw new AbookNotFoundError(
				`Abook with id ${this.abookHandle.id} not found`,
			)
		}
		return abook
	}

	private readonly getEntryOrThrow = (): InternalAbookEntry => {
		const abook = this.getAbookOrThrow()
		const entry = abook.entries.get(this.id)
		if (!entry) {
			throw new AbookEntryNotFoundError(
				`Entry with id ${this.id} not found`,
			)
		}
		return entry
	}

	public readonly exists = async (): Promise<boolean> => {
		const abook = this.store.getAbook(this.abookHandle.id)
		return !!abook?.entries.has(this.id)
	}

	public readonly read = async (): Promise<AbookEntry | null> => {
		if (!(await this.exists())) {
			return null
		}
		const internalEntry = this.getEntryOrThrow()
		const aggregate: AbookEntryAggregateData = internalEntry.aggregate ?? {
			metadata: null, // The tests don't cover this
			blobSize: internalEntry.blob?.size ?? null,
		}
		return new AbookEntry({ data: internalEntry.data, aggregate })
	}

	public readonly mustRead = async (): Promise<AbookEntry> => {
		const entry = await this.read()
		if (!entry) {
			throw new AbookNotFoundError(`Entry with id ${this.id} not found`)
		}
		return entry
	}

	public readonly write = async (
		options: AbookEntryWriteOptions,
	): Promise<void> => {
		const entry = this.getEntryOrThrow()
		if (options.data) {
			entry.data = options.data
		}

		const aggregateOptions = options.aggregate
		if (aggregateOptions) {
			switch (aggregateOptions.type) {
				case AbookWriteAggregateType.RECOMPUTE:
					await this.computeAggregate()
					break
				case AbookWriteAggregateType.CLEAR:
					entry.aggregate = null
					break
				case AbookWriteAggregateType.LEAVE_UNMODIFIED:
					break
				case AbookWriteAggregateType.SET:
					entry.aggregate = aggregateOptions.data
					break
			}
		} else {
			await this.computeAggregate()
		}

		const parentAggregateOptions = options.parentAggregate
		if (parentAggregateOptions) {
			switch (parentAggregateOptions.type) {
				case AbookWriteAggregateType.RECOMPUTE:
					await this.abookHandle.computeAggregate()
					break
				case AbookWriteAggregateType.CLEAR:
					await this.abookHandle.write({
						aggregate: {
							type: AbookWriteAggregateType.CLEAR,
						},
					})
					break
				case AbookWriteAggregateType.LEAVE_UNMODIFIED:
					await this.abookHandle.write({
						aggregate: {
							type: AbookWriteAggregateType.LEAVE_UNMODIFIED,
						},
					})
					break
				case AbookWriteAggregateType.SET:
					await this.abookHandle.write({
						aggregate: {
							type: AbookWriteAggregateType.SET,
							data: parentAggregateOptions.data,
						},
					})
					break
			}
		} else {
			await this.abookHandle.computeAggregate()
		}
	}

	public readonly getBlobWriter = async (): Promise<FsWriter> => {
		const entry = this.getEntryOrThrow()
		return new InMemoryFsWriter(async (blob) => {
			if (blob instanceof Blob) {
				entry.blob = blob
			} else {
				entry.blob = new Blob([blob])
			}
		})
	}

	public readonly readBlob = async (): Promise<Blob | null> => {
		const entry = this.getEntryOrThrow()
		return entry.blob ?? null
	}

	public readonly mustReadBlob = async (): Promise<Blob> => {
		const entry = this.getEntryOrThrow()
		if (!entry.blob) {
			throw new AbookEntryBlobNotFoundError("No blob for this entry")
		}
		return entry.blob
	}

	public readonly delete = async (): Promise<void> => {
		const abook = this.getAbookOrThrow()
		abook.entries.delete(this.id)
		await this.abookHandle.computeAggregate()
	}

	public readonly computeAggregate = async (): Promise<void> => {
		const entry = this.getEntryOrThrow()
		if (!entry.blob) {
			entry.aggregate = null
			return
		}
		entry.aggregate = await this.store.abookEntryAggregator.aggregate(
			entry.data,
			entry.blob,
		)
	}
}
