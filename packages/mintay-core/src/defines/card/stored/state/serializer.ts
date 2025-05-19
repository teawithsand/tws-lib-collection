import { SdelkaCardState } from "../../sdelkaCardState"
import { SdelkaCardQueue } from "../../sdelkaQueue"
import { StoredSdelkaCardState } from "./schema"
import { StoredSdelkaCardQueueV1 } from "./schemaV1"

export class SdelkaCardStateSerializer {
	private constructor() {}

	private static readonly toStoredQueue = (
		queue: SdelkaCardQueue,
	): StoredSdelkaCardQueueV1 => {
		switch (queue) {
			case SdelkaCardQueue.NEW:
				return StoredSdelkaCardQueueV1.NEW
			case SdelkaCardQueue.LEARNING:
				return StoredSdelkaCardQueueV1.LEARNING
			case SdelkaCardQueue.LEARNED:
				return StoredSdelkaCardQueueV1.LEARNED
			case SdelkaCardQueue.RELEARNING:
				return StoredSdelkaCardQueueV1.RELEARNING
		}
		const _exhaustiveCheck: never = queue
		return _exhaustiveCheck
	}

	private static readonly fromStoredQueue = (
		queue: StoredSdelkaCardQueueV1,
	): SdelkaCardQueue => {
		switch (queue) {
			case StoredSdelkaCardQueueV1.NEW:
				return SdelkaCardQueue.NEW
			case StoredSdelkaCardQueueV1.LEARNING:
				return SdelkaCardQueue.LEARNING
			case StoredSdelkaCardQueueV1.LEARNED:
				return SdelkaCardQueue.LEARNED
			case StoredSdelkaCardQueueV1.RELEARNING:
				return SdelkaCardQueue.RELEARNING
		}
		const _exhaustiveCheck: never = queue
		return _exhaustiveCheck
	}

	public static readonly serialize = (
		state: SdelkaCardState,
	): StoredSdelkaCardState => {
		return {
			version: 1,
			data: {
				fsrs: {
					dueTimestamp: state.fsrs.dueTimestamp,
					stability: state.fsrs.stability,
					difficulty: state.fsrs.difficulty,
					elapsedDays: state.fsrs.elapsedDays,
					scheduledDays: state.fsrs.scheduledDays,
					reps: state.fsrs.reps,
					lapses: state.fsrs.lapses,
					state: SdelkaCardStateSerializer.toStoredQueue(
						state.fsrs.state,
					),
					lastReviewTimestamp: state.fsrs.lastReviewTimestamp,
				},
			},
		}
	}

	public static readonly deserialize = (
		stored: StoredSdelkaCardState,
	): SdelkaCardState => {
		if (stored.version === 1) {
			const data = stored.data
			return {
				fsrs: {
					dueTimestamp: data.fsrs.dueTimestamp,
					stability: data.fsrs.stability,
					difficulty: data.fsrs.difficulty,
					elapsedDays: data.fsrs.elapsedDays,
					scheduledDays: data.fsrs.scheduledDays,
					reps: data.fsrs.reps,
					lapses: data.fsrs.lapses,
					state: SdelkaCardStateSerializer.fromStoredQueue(
						data.fsrs.state,
					),
					lastReviewTimestamp: data.fsrs.lastReviewTimestamp,
				},
			}
		}
		const _exhaustiveCheck: never = stored.version
		return _exhaustiveCheck
	}
}
