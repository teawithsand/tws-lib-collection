import { MintayCardState } from "../../cardState"
import { MintayCardQueue } from "../../queue"
import { StoredMintayCardState } from "./schema"
import { StoredMintayCardQueueV1 } from "./schemaV1"

export class MintayCardStateSerializer {
	private constructor() {}

	private static readonly toStoredQueue = (
		queue: MintayCardQueue,
	): StoredMintayCardQueueV1 => {
		switch (queue) {
			case MintayCardQueue.NEW:
				return StoredMintayCardQueueV1.NEW
			case MintayCardQueue.LEARNING:
				return StoredMintayCardQueueV1.LEARNING
			case MintayCardQueue.LEARNED:
				return StoredMintayCardQueueV1.LEARNED
			case MintayCardQueue.RELEARNING:
				return StoredMintayCardQueueV1.RELEARNING
		}
		const _exhaustiveCheck: never = queue
		return _exhaustiveCheck
	}

	private static readonly fromStoredQueue = (
		queue: StoredMintayCardQueueV1,
	): MintayCardQueue => {
		switch (queue) {
			case StoredMintayCardQueueV1.NEW:
				return MintayCardQueue.NEW
			case StoredMintayCardQueueV1.LEARNING:
				return MintayCardQueue.LEARNING
			case StoredMintayCardQueueV1.LEARNED:
				return MintayCardQueue.LEARNED
			case StoredMintayCardQueueV1.RELEARNING:
				return MintayCardQueue.RELEARNING
		}
		const _exhaustiveCheck: never = queue
		return _exhaustiveCheck
	}

	public static readonly serialize = (
		state: MintayCardState,
	): StoredMintayCardState => {
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
					state: MintayCardStateSerializer.toStoredQueue(
						state.fsrs.state,
					),
					lastReviewTimestamp: state.fsrs.lastReviewTimestamp,
				},
			},
		}
	}

	public static readonly deserialize = (
		stored: StoredMintayCardState,
	): MintayCardState => {
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
					state: MintayCardStateSerializer.fromStoredQueue(
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
