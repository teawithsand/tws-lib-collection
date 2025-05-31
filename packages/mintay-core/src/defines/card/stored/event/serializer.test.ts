import { SerializerTester, TestData } from "@teawithsand/reserd"
import { describe, test } from "vitest"
import { MintayAnswer } from "../../answer"
import { MintayCardEvent, MintayCardEventType } from "../../cardEvent"
import { StoredMintayCardEvent } from "./schema"
import { StoredMintayAnswerV1, StoredMintayCardEventTypeV1 } from "./schemaV1"
import { storedMintayCardEventVersionedType } from "./serializer"

describe("storedMintayCardEventVersionedType", () => {
	test("should pass SerializerTester validation", () => {
		const testData: TestData<StoredMintayCardEvent, MintayCardEvent> = {
			storedExamples: [
				{
					version: 1,
					data: {
						type: StoredMintayCardEventTypeV1.ANSWER,
						answer: StoredMintayAnswerV1.AGAIN,
						timestamp: 1640995200000, // 2022-01-01T00:00:00.000Z
					},
				},
				{
					version: 1,
					data: {
						type: StoredMintayCardEventTypeV1.ANSWER,
						answer: StoredMintayAnswerV1.HARD,
						timestamp: 1641081600000, // 2022-01-02T00:00:00.000Z
					},
				},
				{
					version: 1,
					data: {
						type: StoredMintayCardEventTypeV1.ANSWER,
						answer: StoredMintayAnswerV1.GOOD,
						timestamp: 1641168000000, // 2022-01-03T00:00:00.000Z
					},
				},
				{
					version: 1,
					data: {
						type: StoredMintayCardEventTypeV1.ANSWER,
						answer: StoredMintayAnswerV1.EASY,
						timestamp: 0,
					},
				},
			],
			ownedExamples: [
				{
					type: MintayCardEventType.ANSWER,
					answer: MintayAnswer.AGAIN,
					timestamp: 1609459200000, // 2021-01-01T00:00:00.000Z
				},
				{
					type: MintayCardEventType.ANSWER,
					answer: MintayAnswer.HARD,
					timestamp: 1609545600000, // 2021-01-02T00:00:00.000Z
				},
				{
					type: MintayCardEventType.ANSWER,
					answer: MintayAnswer.GOOD,
					timestamp: Number.MAX_SAFE_INTEGER,
				},
				{
					type: MintayCardEventType.ANSWER,
					answer: MintayAnswer.EASY,
					timestamp: Number.MIN_SAFE_INTEGER,
				},
			],
			pairExamples: [
				[
					{
						version: 1,
						data: {
							type: StoredMintayCardEventTypeV1.ANSWER,
							answer: StoredMintayAnswerV1.AGAIN,
							timestamp: 1577836800000, // 2020-01-01T00:00:00.000Z
						},
					},
					{
						type: MintayCardEventType.ANSWER,
						answer: MintayAnswer.AGAIN,
						timestamp: 1577836800000,
					},
				],
				[
					{
						version: 1,
						data: {
							type: StoredMintayCardEventTypeV1.ANSWER,
							answer: StoredMintayAnswerV1.GOOD,
							timestamp: 1,
						},
					},
					{
						type: MintayCardEventType.ANSWER,
						answer: MintayAnswer.GOOD,
						timestamp: 1,
					},
				],
				[
					{
						version: 1,
						data: {
							type: StoredMintayCardEventTypeV1.ANSWER,
							answer: StoredMintayAnswerV1.EASY,
							timestamp: 1234567890,
						},
					},
					{
						type: MintayCardEventType.ANSWER,
						answer: MintayAnswer.EASY,
						timestamp: 1234567890,
					},
				],
			],
		}

		// Get the serializer from the versioned type
		const serializer = storedMintayCardEventVersionedType.getSerializer()

		// Create and run the tester
		const tester = new SerializerTester({
			testData,
			serializer,
		})

		// This will throw if any test fails
		tester.runAllTests()
	})
})
