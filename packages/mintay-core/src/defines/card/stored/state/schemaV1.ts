import { z } from "zod"

export enum StoredMintayCardQueueV1 {
	NEW = 0,
	LEARNING = 1,
	LEARNED = 2,
	RELEARNING = 3,
}

const StoredMintayCardStateFSRSSchema = z.object({
	dueTimestamp: z.number(),
	stability: z.number(),
	difficulty: z.number(),
	elapsedDays: z.number(),
	scheduledDays: z.number(),
	reps: z.number(),
	lapses: z.number(),
	state: z.nativeEnum(StoredMintayCardQueueV1),
	lastReviewTimestamp: z.number().nullable(),
})

export const StoredMintayCardStateV1Schema = z.object({
	fsrs: StoredMintayCardStateFSRSSchema,
})
export type StoredMintayCardStateV1 = z.infer<
	typeof StoredMintayCardStateV1Schema
>
