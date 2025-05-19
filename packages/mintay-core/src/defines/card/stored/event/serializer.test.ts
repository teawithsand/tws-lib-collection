import { describe, expect, test } from "vitest"
import { SdelkaAnswer } from "../../answer"
import { SdelkaCardEventType } from "../../sdelkaCardEvent"
import { StoredSdelkaCardEvent } from "./schema"
import { StoredSdelkaAnswerV1, StoredSdelkaCardEventTypeV1 } from "./schemaV1"
import { SdelkaCardEventSerializer } from "./serializer"

describe("SdelkaCardEventSerializer", () => {
	const timestamp = 1234567890

	const answersToTest = [
		SdelkaAnswer.AGAIN,
		SdelkaAnswer.HARD,
		SdelkaAnswer.GOOD,
		SdelkaAnswer.EASY,
	]

	const eventTypesToTest = [
		SdelkaCardEventType.ANSWER,
		// Add other event types here if they exist
	]

	eventTypesToTest.forEach((eventType) => {
		answersToTest.forEach((answer) => {
			test(`serialize and deserialize with eventType ${eventType} and answer ${answer}`, () => {
				const event = {
					type: eventType,
					answer: answer,
					timestamp,
				}
				const serialized = SdelkaCardEventSerializer.serialize(event)
				expect(serialized.data.type).toBe(
					StoredSdelkaCardEventTypeV1.ANSWER,
				)
				expect(serialized.data.answer).toBe(answer)
				const deserialized =
					SdelkaCardEventSerializer.deserialize(serialized)
				expect(deserialized.type).toBe(eventType)
				expect(deserialized.answer).toBe(answer)
				expect(deserialized.timestamp).toBe(timestamp)
				expect(deserialized).toEqual(event)
			})
		})
	})

	describe("serialize", () => {
		test("should serialize ANSWER event correctly", () => {
			const event = {
				type: SdelkaCardEventType.ANSWER,
				answer: SdelkaAnswer.GOOD,
				timestamp,
			}
			const stored = SdelkaCardEventSerializer.serialize(event)
			expect(stored.version).toBe(1)
			expect(stored.data.type).toBe(StoredSdelkaCardEventTypeV1.ANSWER)
			expect(stored.data.answer).toBe(StoredSdelkaAnswerV1.GOOD)
			expect(stored.data.timestamp).toBe(timestamp)
		})

		test("serialize and then deserialize should not change the event", () => {
			const event = {
				type: SdelkaCardEventType.ANSWER,
				answer: SdelkaAnswer.GOOD,
				timestamp,
			}
			const stored = SdelkaCardEventSerializer.serialize(event)
			const deserialized = SdelkaCardEventSerializer.deserialize(stored)
			expect(deserialized).toEqual(event)
		})

		test("serialize snapshot", () => {
			const event = {
				type: SdelkaCardEventType.ANSWER,
				answer: SdelkaAnswer.GOOD,
				timestamp,
			}
			const stored = SdelkaCardEventSerializer.serialize(event)
			expect(stored).toMatchSnapshot()
		})
	})

	describe("deserialize", () => {
		test("should deserialize ANSWER event correctly", () => {
			const storedEvent: StoredSdelkaCardEvent = {
				version: 1,
				data: {
					type: StoredSdelkaCardEventTypeV1.ANSWER,
					answer: StoredSdelkaAnswerV1.GOOD,
					timestamp,
				},
			}
			const event = SdelkaCardEventSerializer.deserialize(storedEvent)
			expect(event.type).toBe(SdelkaCardEventType.ANSWER)
			expect(event.answer).toBe(SdelkaAnswer.GOOD)
			expect(event.timestamp).toBe(timestamp)
		})

		test("deserialize and then serialize should not change the stored event", () => {
			const storedEvent: StoredSdelkaCardEvent = {
				version: 1,
				data: {
					type: StoredSdelkaCardEventTypeV1.ANSWER,
					answer: StoredSdelkaAnswerV1.GOOD,
					timestamp,
				},
			}
			const event = SdelkaCardEventSerializer.deserialize(storedEvent)
			const reStored = SdelkaCardEventSerializer.serialize(event)
			expect(reStored).toEqual(storedEvent)
		})

		test("deserialize snapshot", () => {
			const storedEvent: StoredSdelkaCardEvent = {
				version: 1,
				data: {
					type: StoredSdelkaCardEventTypeV1.ANSWER,
					answer: StoredSdelkaAnswerV1.GOOD,
					timestamp,
				},
			}
			const event = SdelkaCardEventSerializer.deserialize(storedEvent)
			expect(event).toMatchSnapshot()
		})
	})
})
