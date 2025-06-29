export enum AbookWriteAggregateType {
	/**
	 * Recompute aggregate data as part of write operation.
	 */
	RECOMPUTE = "recompute",

	/**
	 * Do not touch aggregate data.
	 */
	LEAVE_UNMODIFIED = "leave-unmodified",

	/**
	 * Set aggregate data to the provided value.
	 */
	SET = "set",

	/**
	 * Clear aggregate data and do not recompute it.
	 */
	CLEAR = "clear",
}

export type AbookWriteAggregate<T> =
	| {
			type:
				| AbookWriteAggregateType.RECOMPUTE
				| AbookWriteAggregateType.CLEAR
				| AbookWriteAggregateType.LEAVE_UNMODIFIED
	  }
	| {
			type: AbookWriteAggregateType.SET
			data: T
	  }
