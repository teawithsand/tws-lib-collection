import {
	AbookAggregateData,
	AbookEntryAggregateData,
	AbookEntryData,
	AbookHeaderData,
} from "../../defines"

export type InternalAbookEntry = {
	data: AbookEntryData
	blob: Blob | null
	aggregate: AbookEntryAggregateData | null
}

export type InternalAbook = {
	headerData: AbookHeaderData
	entries: Map<string, InternalAbookEntry>
	aggregate: AbookAggregateData | null
}
