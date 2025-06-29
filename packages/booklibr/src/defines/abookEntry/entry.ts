import { AbookEntryAggregateData, AbookEntryData } from "./entryData"

/**
 * Represents an audiobook entry with data and aggregate information.
 */

export class AbookEntry {
	public readonly data: AbookEntryData
	public readonly aggregate: AbookEntryAggregateData

	/**
	 * Creates a new AbookEntry instance.
	 * @param data - The entry's data.
	 * @param aggregate - The entry's aggregate data.
	 */
	public constructor({
		data,
		aggregate,
	}: {
		data: AbookEntryData
		aggregate: AbookEntryAggregateData
	}) {
		this.data = data
		this.aggregate = aggregate
	}
}
