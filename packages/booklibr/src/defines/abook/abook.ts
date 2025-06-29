import { AbookAggregateData, AbookData } from "./abookData"

/**
 * Represents an audiobook with data and aggregate information.
 */
export class Abook {
	public readonly data: AbookData
	public readonly aggregate: AbookAggregateData

	/**
	 * Creates a new Abook instance.
	 * @param header - The audiobook's data.
	 * @param aggregate - The audiobook's aggregate data.
	 */
	public constructor({
		data,
		aggregate,
	}: {
		data: AbookData
		aggregate: AbookAggregateData
	}) {
		this.data = data
		this.aggregate = aggregate
	}
}
