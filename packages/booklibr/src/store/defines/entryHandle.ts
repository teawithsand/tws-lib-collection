import { FsWriter } from "@teawithsand/fstate"
import {
	AbookAggregateData,
	AbookEntry,
	AbookEntryAggregateData,
	AbookEntryData,
	Id,
} from "../../defines"
import { AbookHandle } from "./abookHandle"
import { AbookWriteAggregate } from "./aggregate"

export type AbookEntryWriteOptions = {
	/**
	 * When not set, it should not be modified.
	 */
	data?: AbookEntryData

	parentAggregate?: AbookWriteAggregate<AbookAggregateData>
	aggregate?: AbookWriteAggregate<AbookEntryAggregateData>
}

export interface AbookEntryAggregator {
	aggregate: (
		data: AbookEntryData,
		blob: Blob,
	) => Promise<AbookEntryAggregateData>
}

export interface AbookEntryHandle {
	readonly abookHandle: AbookHandle
	readonly id: Id

	exists: () => Promise<boolean>
	read: () => Promise<AbookEntry | null>
	mustRead: () => Promise<AbookEntry>

	write: (options: AbookEntryWriteOptions) => Promise<void>

	getBlobWriter: () => Promise<FsWriter>
	readBlob: () => Promise<Blob | null>
	mustReadBlob: () => Promise<Blob>

	delete: () => Promise<void>

	computeAggregate: () => Promise<void>
}
