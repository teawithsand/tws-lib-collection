import { TypeAssert } from "@teawithsand/lngext"
import { VersionedStoredType, createVersionedSchema } from "@teawithsand/reserd"
import { z } from "zod"
import { MintayCardState } from "../../cardState"
import { MintayCardQueue } from "../../queue"
import { StoredMintayCardState } from "./schema"
import { StoredMintayCardQueueV1 } from "./schemaV1"

const toStoredQueue = (queue: MintayCardQueue): StoredMintayCardQueueV1 => {
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
	TypeAssert.assertNever(queue)
}

const fromStoredQueue = (queue: StoredMintayCardQueueV1): MintayCardQueue => {
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
	TypeAssert.assertNever(queue)
}

const mintayCardStateV1Schema = z.object({
	fsrs: z.object({
		dueTimestamp: z.number(),
		stability: z.number(),
		difficulty: z.number(),
		elapsedDays: z.number(),
		scheduledDays: z.number(),
		reps: z.number(),
		lapses: z.number(),
		state: z.nativeEnum(StoredMintayCardQueueV1),
		lastReviewTimestamp: z.number().nullable(),
	}),
})

export const storedMintayCardStateVersionedType = VersionedStoredType.create<
	StoredMintayCardState,
	MintayCardState
>({
	config: {
		versions: {
			1: {
				schema: createVersionedSchema(1, mintayCardStateV1Schema),
				deserializer: (stored) => ({
					fsrs: {
						dueTimestamp: stored.data.fsrs.dueTimestamp,
						stability: stored.data.fsrs.stability,
						difficulty: stored.data.fsrs.difficulty,
						elapsedDays: stored.data.fsrs.elapsedDays,
						scheduledDays: stored.data.fsrs.scheduledDays,
						reps: stored.data.fsrs.reps,
						lapses: stored.data.fsrs.lapses,
						state: fromStoredQueue(stored.data.fsrs.state),
						lastReviewTimestamp:
							stored.data.fsrs.lastReviewTimestamp,
					},
				}),
			},
		},
		currentSerializer: (state: MintayCardState) => ({
			version: 1 as const,
			data: {
				fsrs: {
					dueTimestamp: state.fsrs.dueTimestamp,
					stability: state.fsrs.stability,
					difficulty: state.fsrs.difficulty,
					elapsedDays: state.fsrs.elapsedDays,
					scheduledDays: state.fsrs.scheduledDays,
					reps: state.fsrs.reps,
					lapses: state.fsrs.lapses,
					state: toStoredQueue(state.fsrs.state),
					lastReviewTimestamp: state.fsrs.lastReviewTimestamp,
				},
			},
		}),
	},
})
