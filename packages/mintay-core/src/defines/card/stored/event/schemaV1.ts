import { z } from "zod"

export enum StoredMintayCardEventTypeV1 {
	ANSWER = 0,
}

export enum StoredMintayAnswerV1 {
	AGAIN = 1,
	HARD = 2,
	GOOD = 3,
	EASY = 4,
}

export const StoredMintayCardEventV1Schema = z.object({
	type: z.nativeEnum(StoredMintayCardEventTypeV1),
	answer: z.nativeEnum(StoredMintayAnswerV1),
	timestamp: z.number(),
})

export type StoredMintayCardEventV1 = z.infer<
	typeof StoredMintayCardEventV1Schema
>
