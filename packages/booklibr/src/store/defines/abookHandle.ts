import {
	Abook,
	AbookAggregateData,
	AbookData,
	AbookEntryData,
	AbookHeaderData,
	Id,
} from "../../defines"
import { AbookWriteAggregate } from "./aggregate"
import { AbookEntryHandle } from "./entryHandle"

export type AbookWriteHeaderOptions = {
	/**
	 * When not set, it should not be modified.
	 */
	data?: AbookHeaderData
	aggregate?: AbookWriteAggregate<AbookAggregateData>
}

export interface AbookAggregator {
	aggregate: (data: AbookData) => Promise<AbookAggregateData>
}

export interface AbookHandle {
	readonly id: Id

	exists: () => Promise<boolean>
	read: () => Promise<Abook | null>
	mustRead: () => Promise<Abook>

	write: (options: AbookWriteHeaderOptions) => Promise<void>

	createEntry: (data: AbookEntryData) => Promise<AbookEntryHandle>
	listEntries: () => Promise<AbookEntryHandle[]>

	delete: () => Promise<void>

	computeAggregate: () => Promise<void>
}
