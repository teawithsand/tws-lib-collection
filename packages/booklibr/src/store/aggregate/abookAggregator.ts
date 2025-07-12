import {
	AbookAggregateData,
	AbookData,
	AbookEntryDisposition,
	BlobMetadataResultType,
} from "../../defines"
import { AbookAggregator } from "../defines"

/**
 * Default implementation of AbookAggregator that computes aggregate data
 * based on the entries within the abook.
 */
export class AbookAggregatorImpl implements AbookAggregator {
	constructor() {}

	/**
	 * Creates a new instance of AbookAggregatorImpl.
	 */
	public static readonly create = (): AbookAggregatorImpl => {
		return new AbookAggregatorImpl()
	}

	/**
	 * Aggregates abook data by computing total entries and total duration.
	 * Returns -1 for totalDurationMillis if any entry has invalid duration (< 0 or NaN).
	 *
	 * @param data - The abook data containing entries to aggregate
	 * @returns Promise resolving to aggregate data with total entries and duration
	 */
	public readonly aggregate = async (
		data: AbookData,
	): Promise<AbookAggregateData> => {
		const totalEntries = data.entries.size

		let totalDurationMillis = 0
		let hasInvalidDuration = false

		for (const entry of data.entries.values()) {
			if (
				entry.data.disposition !== AbookEntryDisposition.PLAYABLE_AUDIO
			) {
				continue
			}

			const audioMetadata = entry.aggregate.metadata?.metadata.audio
			if (audioMetadata?.type === BlobMetadataResultType.SUCCESS) {
				const duration = audioMetadata.metadata.duration ?? 0

				if (isNaN(duration) || duration < 0 || !isFinite(duration)) {
					hasInvalidDuration = true
					break
				}

				totalDurationMillis += duration
			}
		}

		return {
			totalEntries,
			totalDurationMillis: hasInvalidDuration ? -1 : totalDurationMillis,
		}
	}
}
