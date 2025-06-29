import { AbookAggregateData, AbookHeaderData } from "./abookData"

/**
 * Represents the header of an audiobook, containing metadata and aggregate data.
 */
export class AbookHeader {
	public readonly header: AbookHeaderData
	public readonly aggregate: AbookAggregateData

	/**
	 * Constructs an AbookHeader instance.
	 * @param param0 - Object containing header and aggregate data.
	 */
	public constructor({
		header,
		aggregate,
	}: {
		header: AbookHeaderData
		aggregate: AbookAggregateData
	}) {
		this.header = header
		this.aggregate = aggregate
	}
}
