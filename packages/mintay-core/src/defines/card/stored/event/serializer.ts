import { TypeAssert } from "@teawithsand/lngext"
import { VersionedStoredType, createVersionedSchema } from "@teawithsand/reserd"
import { z } from "zod"
import { MintayAnswer } from "../../answer"
import { MintayCardEvent, MintayCardEventType } from "../../cardEvent"
import { StoredMintayCardEvent } from "./schema"
import { StoredMintayAnswerV1, StoredMintayCardEventTypeV1 } from "./schemaV1"

const toStoredAnswer = (answer: MintayAnswer): StoredMintayAnswerV1 => {
	switch (answer) {
		case MintayAnswer.AGAIN:
			return StoredMintayAnswerV1.AGAIN
		case MintayAnswer.HARD:
			return StoredMintayAnswerV1.HARD
		case MintayAnswer.GOOD:
			return StoredMintayAnswerV1.GOOD
		case MintayAnswer.EASY:
			return StoredMintayAnswerV1.EASY
	}
	TypeAssert.assertNever(answer)
}

const fromStoredAnswer = (answer: StoredMintayAnswerV1): MintayAnswer => {
	switch (answer) {
		case StoredMintayAnswerV1.AGAIN:
			return MintayAnswer.AGAIN
		case StoredMintayAnswerV1.HARD:
			return MintayAnswer.HARD
		case StoredMintayAnswerV1.GOOD:
			return MintayAnswer.GOOD
		case StoredMintayAnswerV1.EASY:
			return MintayAnswer.EASY
	}
	TypeAssert.assertNever(answer)
}

const mintayCardEventV1Schema = z.object({
	type: z.nativeEnum(StoredMintayCardEventTypeV1),
	answer: z.nativeEnum(StoredMintayAnswerV1),
	timestamp: z.number(),
})

export const storedMintayCardEventVersionedType = VersionedStoredType.create<
	StoredMintayCardEvent,
	MintayCardEvent
>({
	config: {
		versions: {
			1: {
				schema: createVersionedSchema(1, mintayCardEventV1Schema),
				deserializer: (stored) => {
					const data = stored.data
					switch (data.type) {
						case StoredMintayCardEventTypeV1.ANSWER:
							return {
								type: MintayCardEventType.ANSWER,
								answer: fromStoredAnswer(data.answer),
								timestamp: data.timestamp,
							}
					}
					TypeAssert.assertNever(data.type)
				},
			},
		},
		currentSerializer: (event: MintayCardEvent) => {
			switch (event.type) {
				case MintayCardEventType.ANSWER:
					return {
						version: 1 as const,
						data: {
							type: StoredMintayCardEventTypeV1.ANSWER,
							answer: toStoredAnswer(event.answer),
							timestamp: event.timestamp,
						},
					}
			}
			TypeAssert.assertNever(event.type)
		},
	},
})
