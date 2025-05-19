import { z } from "zod"

export enum StoredSdelkaCardQueueV1 {
	NEW = 0,
	LEARNING = 1,
	LEARNED = 2,
	RELEARNING = 3,
}

const StoredSdelkaCardStateFSRSSchema = z.object({
	dueTimestamp: z.number(),
	stability: z.number(),
	difficulty: z.number(),
	elapsedDays: z.number(),
	scheduledDays: z.number(),
	reps: z.number(),
	lapses: z.number(),
	state: z.nativeEnum(StoredSdelkaCardQueueV1),
	lastReviewTimestamp: z.number().nullable(),
})

export const StoredSdelkaCardStateV1Schema = z.object({
	fsrs: StoredSdelkaCardStateFSRSSchema,
})
export type StoredSdelkaCardStateV1 = z.infer<
	typeof StoredSdelkaCardStateV1Schema
>
