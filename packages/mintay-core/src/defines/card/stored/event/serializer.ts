import { MintayAnswer } from "../../answer"
import { MintayCardEvent, MintayCardEventType } from "../../cardEvent"
import { StoredMintayCardEvent } from "./schema"
import { StoredMintayAnswerV1, StoredMintayCardEventTypeV1 } from "./schemaV1"

export class MintayCardEventSerializer {
	public static readonly toStoredAnswer = (
		answer: MintayAnswer,
	): StoredMintayAnswerV1 => {
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
		const _exhaustiveCheck: never = answer
		return _exhaustiveCheck
	}

	public static readonly fromStoredAnswer = (
		answer: StoredMintayAnswerV1,
	): MintayAnswer => {
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
		const _exhaustiveCheck: never = answer
		return _exhaustiveCheck
	}

	public static readonly serialize = (
		event: MintayCardEvent,
	): StoredMintayCardEvent => {
		switch (event.type) {
			case MintayCardEventType.ANSWER:
				return {
					version: 1,
					data: {
						type: StoredMintayCardEventTypeV1.ANSWER,
						answer: MintayCardEventSerializer.toStoredAnswer(
							event.answer,
						),
						timestamp: event.timestamp,
					},
				}
		}
		const _exhaustiveCheck: never = event.type
		return _exhaustiveCheck
	}

	public static readonly deserialize = (
		storedEvent: StoredMintayCardEvent,
	): MintayCardEvent => {
		if (storedEvent.version === 1) {
			const data = storedEvent.data
			switch (data.type) {
				case StoredMintayCardEventTypeV1.ANSWER:
					return {
						type: MintayCardEventType.ANSWER,
						answer: MintayCardEventSerializer.fromStoredAnswer(
							data.answer,
						),
						timestamp: data.timestamp,
					}
			}
			const _exhaustiveCheck: never = data.type
			return _exhaustiveCheck
		}
		const _exhaustiveCheckVersion: never = storedEvent.version
		return _exhaustiveCheckVersion
	}
}
