import { describe, expect, test } from "vitest"
import { MintayAnswer } from "../../answer"
import { MintayCardEventType } from "../../sdelkaCardEvent"
import { StoredMintayCardEvent } from "./schema"
import { StoredMintayAnswerV1, StoredMintayCardEventTypeV1 } from "./schemaV1"
import { MintayCardEventSerializer } from "./serializer"

describe("MintayCardEventSerializer", () => {
	const timestamp = 1234567890

	const answersToTest = [
		MintayAnswer.AGAIN,
		MintayAnswer.HARD,
		MintayAnswer.GOOD,
		MintayAnswer.EASY,
	]

	const eventTypesToTest = [
		MintayCardEventType.ANSWER,
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
				const serialized = MintayCardEventSerializer.serialize(event)
				expect(serialized.data.type).toBe(
					StoredMintayCardEventTypeV1.ANSWER,
				)
				expect(serialized.data.answer).toBe(answer)
				const deserialized =
					MintayCardEventSerializer.deserialize(serialized)
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
				type: MintayCardEventType.ANSWER,
				answer: MintayAnswer.GOOD,
				timestamp,
			}
			const stored = MintayCardEventSerializer.serialize(event)
			expect(stored.version).toBe(1)
			expect(stored.data.type).toBe(StoredMintayCardEventTypeV1.ANSWER)
			expect(stored.data.answer).toBe(StoredMintayAnswerV1.GOOD)
			expect(stored.data.timestamp).toBe(timestamp)
		})

		test("serialize and then deserialize should not change the event", () => {
			const event = {
				type: MintayCardEventType.ANSWER,
				answer: MintayAnswer.GOOD,
				timestamp,
			}
			const stored = MintayCardEventSerializer.serialize(event)
			const deserialized = MintayCardEventSerializer.deserialize(stored)
			expect(deserialized).toEqual(event)
		})

		test("serialize snapshot", () => {
			const event = {
				type: MintayCardEventType.ANSWER,
				answer: MintayAnswer.GOOD,
				timestamp,
			}
			const stored = MintayCardEventSerializer.serialize(event)
			expect(stored).toMatchSnapshot()
		})
	})

	describe("deserialize", () => {
		test("should deserialize ANSWER event correctly", () => {
			const storedEvent: StoredMintayCardEvent = {
				version: 1,
				data: {
					type: StoredMintayCardEventTypeV1.ANSWER,
					answer: StoredMintayAnswerV1.GOOD,
					timestamp,
				},
			}
			const event = MintayCardEventSerializer.deserialize(storedEvent)
			expect(event.type).toBe(MintayCardEventType.ANSWER)
			expect(event.answer).toBe(MintayAnswer.GOOD)
			expect(event.timestamp).toBe(timestamp)
		})

		test("deserialize and then serialize should not change the stored event", () => {
			const storedEvent: StoredMintayCardEvent = {
				version: 1,
				data: {
					type: StoredMintayCardEventTypeV1.ANSWER,
					answer: StoredMintayAnswerV1.GOOD,
					timestamp,
				},
			}
			const event = MintayCardEventSerializer.deserialize(storedEvent)
			const reStored = MintayCardEventSerializer.serialize(event)
			expect(reStored).toEqual(storedEvent)
		})

		test("deserialize snapshot", () => {
			const storedEvent: StoredMintayCardEvent = {
				version: 1,
				data: {
					type: StoredMintayCardEventTypeV1.ANSWER,
					answer: StoredMintayAnswerV1.GOOD,
					timestamp,
				},
			}
			const event = MintayCardEventSerializer.deserialize(storedEvent)
			expect(event).toMatchSnapshot()
		})
	})
})
