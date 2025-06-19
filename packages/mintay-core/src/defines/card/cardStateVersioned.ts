import { TypeAssert } from "@teawithsand/lngext"
import { VersionedType } from "@teawithsand/reserd"
import { z } from "zod"
import { MintayCardState } from "./cardState"
import { MintayCardQueue } from "./queue"

enum MintayCardQueueStored {
	NEW = 0,
	LEARNING = 1,
	LEARNED = 2,
	RELEARNING = 3,
}

type MintayCardStateFSRSStoredV1 = {
	dueTimestamp: number
	stability: number
	difficulty: number
	elapsedDays: number
	scheduledDays: number
	reps: number
	lapses: number
	state: MintayCardQueueStored
	lastReviewTimestamp: number | null
}

type MintayCardStateStoredV1 = {
	fsrs: MintayCardStateFSRSStoredV1
}

type MintayCardStateVersionedData = {
	1: MintayCardStateStoredV1
}

const mintayCardStateFSRSStoredV1Schema = z.object({
	dueTimestamp: z.number(),
	stability: z.number(),
	difficulty: z.number(),
	elapsedDays: z.number(),
	scheduledDays: z.number(),
	reps: z.number(),
	lapses: z.number(),
	state: z.nativeEnum(MintayCardQueueStored),
	lastReviewTimestamp: z.number().nullable(),
})

const mintayCardStateStoredV1Schema = z.object({
	fsrs: mintayCardStateFSRSStoredV1Schema,
})

const translateQueueToStored = (
	queue: MintayCardQueue,
): MintayCardQueueStored => {
	switch (queue) {
		case MintayCardQueue.NEW:
			return MintayCardQueueStored.NEW
		case MintayCardQueue.LEARNING:
			return MintayCardQueueStored.LEARNING
		case MintayCardQueue.LEARNED:
			return MintayCardQueueStored.LEARNED
		case MintayCardQueue.RELEARNING:
			return MintayCardQueueStored.RELEARNING
		default:
			TypeAssert.assertNever(queue)
			return TypeAssert.unreachable()
	}
}

const translateQueueFromStored = (
	queue: MintayCardQueueStored,
): MintayCardQueue => {
	switch (queue) {
		case MintayCardQueueStored.NEW:
			return MintayCardQueue.NEW
		case MintayCardQueueStored.LEARNING:
			return MintayCardQueue.LEARNING
		case MintayCardQueueStored.LEARNED:
			return MintayCardQueue.LEARNED
		case MintayCardQueueStored.RELEARNING:
			return MintayCardQueue.RELEARNING
		default:
			TypeAssert.assertNever(queue)
			return TypeAssert.unreachable()
	}
}

/**
 * VersionedType for MintayCardState, supporting migration and serialization between versions.
 * Handles translation between owned and stored representations.
 */
export const MintayCardStateVersionedType = new VersionedType<
	MintayCardStateVersionedData,
	MintayCardState
>({
	serializer: (owned: MintayCardState) => ({
		version: 1 as const,
		data: {
			fsrs: {
				dueTimestamp: owned.fsrs.dueTimestamp,
				stability: owned.fsrs.stability,
				difficulty: owned.fsrs.difficulty,
				elapsedDays: owned.fsrs.elapsedDays,
				scheduledDays: owned.fsrs.scheduledDays,
				reps: owned.fsrs.reps,
				lapses: owned.fsrs.lapses,
				state: translateQueueToStored(owned.fsrs.state),
				lastReviewTimestamp: owned.fsrs.lastReviewTimestamp,
			},
		},
	}),
	deserializer: {
		1: {
			schema: mintayCardStateStoredV1Schema,
			deserializer: (data: MintayCardStateStoredV1): MintayCardState => ({
				fsrs: {
					dueTimestamp: data.fsrs.dueTimestamp,
					stability: data.fsrs.stability,
					difficulty: data.fsrs.difficulty,
					elapsedDays: data.fsrs.elapsedDays,
					scheduledDays: data.fsrs.scheduledDays,
					reps: data.fsrs.reps,
					lapses: data.fsrs.lapses,
					state: translateQueueFromStored(data.fsrs.state),
					lastReviewTimestamp: data.fsrs.lastReviewTimestamp,
				},
			}),
		},
	},
})
