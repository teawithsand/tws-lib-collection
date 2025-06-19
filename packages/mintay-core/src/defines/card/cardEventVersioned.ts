import { TypeAssert } from "@teawithsand/lngext"
import { VersionedType } from "@teawithsand/reserd"
import { z } from "zod"
import { MintayAnswer } from "./answer"
import { MintayCardEvent, MintayCardEventType } from "./cardEvent"

enum MintayAnswerStored {
	AGAIN = 1,
	HARD = 2,
	GOOD = 3,
	EASY = 4,
}

enum MintayCardEventTypeStored {
	ANSWER = 0,
}

type MintayCardEventStoredV1 = {
	type: MintayCardEventTypeStored.ANSWER
	answer: MintayAnswerStored
	timestamp: number
}

type MintayCardEventVersionedData = {
	1: MintayCardEventStoredV1
}

const mintayCardEventStoredV1Schema = z.object({
	type: z.literal(MintayCardEventTypeStored.ANSWER),
	answer: z.nativeEnum(MintayAnswerStored),
	timestamp: z.number(),
})

const translateAnswerToStored = (answer: MintayAnswer): MintayAnswerStored => {
	switch (answer) {
		case MintayAnswer.AGAIN:
			return MintayAnswerStored.AGAIN
		case MintayAnswer.HARD:
			return MintayAnswerStored.HARD
		case MintayAnswer.GOOD:
			return MintayAnswerStored.GOOD
		case MintayAnswer.EASY:
			return MintayAnswerStored.EASY
		default:
			TypeAssert.assertNever(answer)
			return TypeAssert.unreachable()
	}
}

const translateAnswerFromStored = (
	answer: MintayAnswerStored,
): MintayAnswer => {
	switch (answer) {
		case MintayAnswerStored.AGAIN:
			return MintayAnswer.AGAIN
		case MintayAnswerStored.HARD:
			return MintayAnswer.HARD
		case MintayAnswerStored.GOOD:
			return MintayAnswer.GOOD
		case MintayAnswerStored.EASY:
			return MintayAnswer.EASY
		default:
			TypeAssert.assertNever(answer)
			return TypeAssert.unreachable()
	}
}

/**
 * VersionedType for MintayCardEvent, supporting migration and serialization between versions.
 * Handles translation between owned and stored representations.
 */
export const MintayCardEventVersionedType = new VersionedType<
	MintayCardEventVersionedData,
	MintayCardEvent
>({
	serializer: (owned: MintayCardEvent) => ({
		version: 1 as const,
		data: {
			type: MintayCardEventTypeStored.ANSWER,
			answer: translateAnswerToStored(owned.answer),
			timestamp: owned.timestamp,
		},
	}),
	deserializer: {
		1: {
			schema: mintayCardEventStoredV1Schema,
			deserializer: (data: MintayCardEventStoredV1): MintayCardEvent => ({
				type: MintayCardEventType.ANSWER,
				answer: translateAnswerFromStored(data.answer),
				timestamp: data.timestamp,
			}),
		},
	},
})
