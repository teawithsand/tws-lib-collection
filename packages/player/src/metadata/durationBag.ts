export enum MetadataLoadingResultType {
	OK = 1,
	ERROR = 2,
}

export type MetadataLoadingResult =
	| {
			type: MetadataLoadingResultType.OK
			duration: number
	  }
	| {
			type: MetadataLoadingResultType.ERROR
			error: any
	  }

/**
 * A container for multiple durations wrapped in MetadataLoadingResult,
 * which provides convenient methods for querying cumulative durations
 * and indexing based on time position.
 *
 * This class accepts an array of MetadataLoadingResult or null and precomputes
 * prefix sums to enable efficient queries.
 */
export class MetadataBag {
	private sumDurationToIndex: number[] = []
	private readonly innerDurations: (number | null)[]
	private readonly innerIsDone: boolean

	/**
	 * Creates a new MetadataBag from an array of MetadataLoadingResult or null.
	 * Precomputes prefix sums for efficient queries.
	 *
	 * @param results Array of MetadataLoadingResult or null.
	 */
	constructor(results: (MetadataLoadingResult | null)[]) {
		this.innerDurations = results.map((result) => {
			if (
				result &&
				result.type === MetadataLoadingResultType.OK &&
				typeof result.duration === "number" &&
				isFinite(result.duration) &&
				result.duration >= 0 &&
				!Number.isNaN(result.duration)
			) {
				return result.duration
			}
			return null
		})

		this.innerIsDone = this.innerDurations.every(
			(d) => d !== null && typeof d === "number",
		)

		this.sumDurationToIndex = []
		let sum: number | null = 0
		for (const duration of this.innerDurations) {
			this.sumDurationToIndex.push(sum ?? -1)

			if (typeof sum === "number") {
				if (
					typeof duration === "number" &&
					isFinite(duration) &&
					duration >= 0 &&
					!Number.isNaN(duration)
				) {
					sum += duration
				} else {
					sum = null
				}
			}
		}
	}

	get length() {
		return this.innerDurations.length
	}

	getDuration = (i: number): number | null => {
		return this.innerDurations[i] ?? null
	}

	getDurationToIndex = (i: number, inclusive = false): number | null => {
		if (this.sumDurationToIndex.length === 0) {
			return 0
		}

		let duration = this.sumDurationToIndex[i]

		if (duration === undefined) {
			if (i < 0) {
				return 0
			} else if (i >= this.sumDurationToIndex.length) {
				if (!inclusive) {
					return this.getDurationToIndex(
						this.innerDurations.length - 1,
						true,
					)
				} else {
					return null
				}
			} else {
				throw new Error(`Unreachable`)
			}
		}

		if (duration < 0) return null
		if (!inclusive) return duration

		const d = this.innerDurations[i]
		if (
			typeof d === "number" &&
			d >= 0 &&
			!Number.isNaN(d) &&
			isFinite(d)
		) {
			duration += d
		} else {
			return null
		}

		return duration
	}

	getIndexFromPosition = (position: number): number | null => {
		for (let i = 0; i < this.innerDurations.length; i++) {
			const res = this.getDurationToIndex(i, true)
			if (res === null) return null

			if (position <= res) return i
		}

		return this.length
	}

	get isDone() {
		return this.innerIsDone
	}

	get duration(): number | null {
		if (this.length === 0) return 0
		return this.getDurationToIndex(this.length - 1, true)
	}
}
