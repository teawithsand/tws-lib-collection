import { z } from "zod"

export enum StoredSdelkaCardEventTypeV1 {
	ANSWER = 0,
}

export enum StoredSdelkaAnswerV1 {
	AGAIN = 1,
	HARD = 2,
	GOOD = 3,
	EASY = 4,
}

export const StoredSdelkaCardEventV1Schema = z.object({
	type: z.nativeEnum(StoredSdelkaCardEventTypeV1),
	answer: z.nativeEnum(StoredSdelkaAnswerV1),
	timestamp: z.number(),
})

export type StoredSdelkaCardEventV1 = z.infer<
	typeof StoredSdelkaCardEventV1Schema
>
