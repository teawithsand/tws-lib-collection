import { SerializerTester, TestData } from "@teawithsand/reserd"
import { describe, test } from "vitest"
import { MintayAnswer } from "../../answer"
import { MintayCardEvent, MintayCardEventType } from "./cardEvent"
import { MintayCardEventVersionedType } from "./cardEventVersioned"

describe("MintayCardEventVersionedType", () => {
	const createTestData = (): TestData<any, MintayCardEvent> => {
		const ownedExamples: MintayCardEvent[] = [
			{
				type: MintayCardEventType.ANSWER,
				answer: MintayAnswer.AGAIN,
				timestamp: 1640995200000,
			},
			{
				type: MintayCardEventType.ANSWER,
				answer: MintayAnswer.HARD,
				timestamp: 1641081600000,
			},
			{
				type: MintayCardEventType.ANSWER,
				answer: MintayAnswer.GOOD,
				timestamp: 1641168000000,
			},
			{
				type: MintayCardEventType.ANSWER,
				answer: MintayAnswer.EASY,
				timestamp: 1641254400000,
			},
		]

		const storedExamples = [
			{
				version: 1 as const,
				data: {
					type: 0,
					answer: 1,
					timestamp: 1640995200000,
				},
			},
			{
				version: 1 as const,
				data: {
					type: 0,
					answer: 2,
					timestamp: 1641081600000,
				},
			},
			{
				version: 1 as const,
				data: {
					type: 0,
					answer: 3,
					timestamp: 1641168000000,
				},
			},
			{
				version: 1 as const,
				data: {
					type: 0,
					answer: 4,
					timestamp: 1641254400000,
				},
			},
		]

		const pairExamples: [any, MintayCardEvent][] = [
			[
				{
					version: 1 as const,
					data: {
						type: 0,
						answer: 1,
						timestamp: 1640995200000,
					},
				},
				{
					type: MintayCardEventType.ANSWER,
					answer: MintayAnswer.AGAIN,
					timestamp: 1640995200000,
				},
			],
			[
				{
					version: 1 as const,
					data: {
						type: 0,
						answer: 2,
						timestamp: 1641081600000,
					},
				},
				{
					type: MintayCardEventType.ANSWER,
					answer: MintayAnswer.HARD,
					timestamp: 1641081600000,
				},
			],
			[
				{
					version: 1 as const,
					data: {
						type: 0,
						answer: 3,
						timestamp: 1641168000000,
					},
				},
				{
					type: MintayCardEventType.ANSWER,
					answer: MintayAnswer.GOOD,
					timestamp: 1641168000000,
				},
			],
			[
				{
					version: 1 as const,
					data: {
						type: 0,
						answer: 4,
						timestamp: 1641254400000,
					},
				},
				{
					type: MintayCardEventType.ANSWER,
					answer: MintayAnswer.EASY,
					timestamp: 1641254400000,
				},
			],
		]

		return new TestData({
			storedExamples,
			ownedExamples,
			pairExamples,
		})
	}

	test("runAllTests", () => {
		const testData = createTestData()
		const tester = new SerializerTester({
			testData,
			serializer: MintayCardEventVersionedType,
		})
		tester.runAllTests()
	})
})
