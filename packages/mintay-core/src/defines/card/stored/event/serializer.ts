import { SdelkaAnswer } from "../../answer"
import { SdelkaCardEvent, SdelkaCardEventType } from "../../sdelkaCardEvent"
import { StoredSdelkaCardEvent } from "./schema"
import { StoredSdelkaAnswerV1, StoredSdelkaCardEventTypeV1 } from "./schemaV1"

export class SdelkaCardEventSerializer {
	public static readonly toStoredAnswer = (
		answer: SdelkaAnswer,
	): StoredSdelkaAnswerV1 => {
		switch (answer) {
			case SdelkaAnswer.AGAIN:
				return StoredSdelkaAnswerV1.AGAIN
			case SdelkaAnswer.HARD:
				return StoredSdelkaAnswerV1.HARD
			case SdelkaAnswer.GOOD:
				return StoredSdelkaAnswerV1.GOOD
			case SdelkaAnswer.EASY:
				return StoredSdelkaAnswerV1.EASY
		}
		const _exhaustiveCheck: never = answer
		return _exhaustiveCheck
	}

	public static readonly fromStoredAnswer = (
		answer: StoredSdelkaAnswerV1,
	): SdelkaAnswer => {
		switch (answer) {
			case StoredSdelkaAnswerV1.AGAIN:
				return SdelkaAnswer.AGAIN
			case StoredSdelkaAnswerV1.HARD:
				return SdelkaAnswer.HARD
			case StoredSdelkaAnswerV1.GOOD:
				return SdelkaAnswer.GOOD
			case StoredSdelkaAnswerV1.EASY:
				return SdelkaAnswer.EASY
		}
		const _exhaustiveCheck: never = answer
		return _exhaustiveCheck
	}

	public static readonly serialize = (
		event: SdelkaCardEvent,
	): StoredSdelkaCardEvent => {
		switch (event.type) {
			case SdelkaCardEventType.ANSWER:
				return {
					version: 1,
					data: {
						type: StoredSdelkaCardEventTypeV1.ANSWER,
						answer: SdelkaCardEventSerializer.toStoredAnswer(
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
		storedEvent: StoredSdelkaCardEvent,
	): SdelkaCardEvent => {
		if (storedEvent.version === 1) {
			const data = storedEvent.data
			switch (data.type) {
				case StoredSdelkaCardEventTypeV1.ANSWER:
					return {
						type: SdelkaCardEventType.ANSWER,
						answer: SdelkaCardEventSerializer.fromStoredAnswer(
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
