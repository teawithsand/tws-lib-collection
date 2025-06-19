import { SerializerTester, TestData } from "@teawithsand/reserd"
import { describe, test } from "vitest"
import { MintayCardState } from "./cardState"
import { MintayCardStateVersionedType } from "./cardStateVersioned"
import { MintayCardQueue } from "./queue"

describe("MintayCardStateVersionedType", () => {
	const createTestData = (): TestData<any, MintayCardState> => {
		const ownedExamples: MintayCardState[] = [
			{
				fsrs: {
					dueTimestamp: 1640995200000,
					stability: 2.5,
					difficulty: 3.0,
					elapsedDays: 1,
					scheduledDays: 2,
					reps: 3,
					lapses: 0,
					state: MintayCardQueue.NEW,
					lastReviewTimestamp: null,
				},
			},
			{
				fsrs: {
					dueTimestamp: 1641081600000,
					stability: 5.2,
					difficulty: 2.8,
					elapsedDays: 2,
					scheduledDays: 4,
					reps: 5,
					lapses: 1,
					state: MintayCardQueue.LEARNING,
					lastReviewTimestamp: 1640995200000,
				},
			},
			{
				fsrs: {
					dueTimestamp: 1641168000000,
					stability: 10.0,
					difficulty: 2.5,
					elapsedDays: 7,
					scheduledDays: 14,
					reps: 10,
					lapses: 2,
					state: MintayCardQueue.LEARNED,
					lastReviewTimestamp: 1641081600000,
				},
			},
			{
				fsrs: {
					dueTimestamp: 1641254400000,
					stability: 1.8,
					difficulty: 4.2,
					elapsedDays: 3,
					scheduledDays: 1,
					reps: 8,
					lapses: 3,
					state: MintayCardQueue.RELEARNING,
					lastReviewTimestamp: 1641168000000,
				},
			},
		]

		const storedExamples = [
			{
				version: 1 as const,
				data: {
					fsrs: {
						dueTimestamp: 1640995200000,
						stability: 2.5,
						difficulty: 3.0,
						elapsedDays: 1,
						scheduledDays: 2,
						reps: 3,
						lapses: 0,
						state: 0,
						lastReviewTimestamp: null,
					},
				},
			},
			{
				version: 1 as const,
				data: {
					fsrs: {
						dueTimestamp: 1641081600000,
						stability: 5.2,
						difficulty: 2.8,
						elapsedDays: 2,
						scheduledDays: 4,
						reps: 5,
						lapses: 1,
						state: 1,
						lastReviewTimestamp: 1640995200000,
					},
				},
			},
			{
				version: 1 as const,
				data: {
					fsrs: {
						dueTimestamp: 1641168000000,
						stability: 10.0,
						difficulty: 2.5,
						elapsedDays: 7,
						scheduledDays: 14,
						reps: 10,
						lapses: 2,
						state: 2,
						lastReviewTimestamp: 1641081600000,
					},
				},
			},
			{
				version: 1 as const,
				data: {
					fsrs: {
						dueTimestamp: 1641254400000,
						stability: 1.8,
						difficulty: 4.2,
						elapsedDays: 3,
						scheduledDays: 1,
						reps: 8,
						lapses: 3,
						state: 3,
						lastReviewTimestamp: 1641168000000,
					},
				},
			},
		]

		const pairExamples: [any, MintayCardState][] = [
			[
				{
					version: 1 as const,
					data: {
						fsrs: {
							dueTimestamp: 1640995200000,
							stability: 2.5,
							difficulty: 3.0,
							elapsedDays: 1,
							scheduledDays: 2,
							reps: 3,
							lapses: 0,
							state: 0,
							lastReviewTimestamp: null,
						},
					},
				},
				{
					fsrs: {
						dueTimestamp: 1640995200000,
						stability: 2.5,
						difficulty: 3.0,
						elapsedDays: 1,
						scheduledDays: 2,
						reps: 3,
						lapses: 0,
						state: MintayCardQueue.NEW,
						lastReviewTimestamp: null,
					},
				},
			],
			[
				{
					version: 1 as const,
					data: {
						fsrs: {
							dueTimestamp: 1641081600000,
							stability: 5.2,
							difficulty: 2.8,
							elapsedDays: 2,
							scheduledDays: 4,
							reps: 5,
							lapses: 1,
							state: 1,
							lastReviewTimestamp: 1640995200000,
						},
					},
				},
				{
					fsrs: {
						dueTimestamp: 1641081600000,
						stability: 5.2,
						difficulty: 2.8,
						elapsedDays: 2,
						scheduledDays: 4,
						reps: 5,
						lapses: 1,
						state: MintayCardQueue.LEARNING,
						lastReviewTimestamp: 1640995200000,
					},
				},
			],
			[
				{
					version: 1 as const,
					data: {
						fsrs: {
							dueTimestamp: 1641168000000,
							stability: 10.0,
							difficulty: 2.5,
							elapsedDays: 7,
							scheduledDays: 14,
							reps: 10,
							lapses: 2,
							state: 2,
							lastReviewTimestamp: 1641081600000,
						},
					},
				},
				{
					fsrs: {
						dueTimestamp: 1641168000000,
						stability: 10.0,
						difficulty: 2.5,
						elapsedDays: 7,
						scheduledDays: 14,
						reps: 10,
						lapses: 2,
						state: MintayCardQueue.LEARNED,
						lastReviewTimestamp: 1641081600000,
					},
				},
			],
			[
				{
					version: 1 as const,
					data: {
						fsrs: {
							dueTimestamp: 1641254400000,
							stability: 1.8,
							difficulty: 4.2,
							elapsedDays: 3,
							scheduledDays: 1,
							reps: 8,
							lapses: 3,
							state: 3,
							lastReviewTimestamp: 1641168000000,
						},
					},
				},
				{
					fsrs: {
						dueTimestamp: 1641254400000,
						stability: 1.8,
						difficulty: 4.2,
						elapsedDays: 3,
						scheduledDays: 1,
						reps: 8,
						lapses: 3,
						state: MintayCardQueue.RELEARNING,
						lastReviewTimestamp: 1641168000000,
					},
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
			serializer: MintayCardStateVersionedType,
		})
		tester.runAllTests()
	})
})
