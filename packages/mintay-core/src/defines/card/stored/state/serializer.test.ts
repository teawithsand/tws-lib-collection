import { SerializerTester, TestData } from "@teawithsand/reserd"
import { describe, test } from "vitest"
import { MintayCardState } from "../../cardState"
import { MintayCardQueue } from "../../queue"
import { StoredMintayCardState } from "./schema"
import { StoredMintayCardQueueV1 } from "./schemaV1"
import { storedMintayCardStateVersionedType } from "./serializer"

describe("storedMintayCardStateVersionedType", () => {
	test("should pass SerializerTester validation", () => {
		const testData: TestData<StoredMintayCardState, MintayCardState> = {
			storedExamples: [
				{
					version: 1,
					data: {
						fsrs: {
							dueTimestamp: 1640995200000, // 2022-01-01T00:00:00.000Z
							stability: 1.0,
							difficulty: 5.0,
							elapsedDays: 0,
							scheduledDays: 1,
							reps: 0,
							lapses: 0,
							state: StoredMintayCardQueueV1.NEW,
							lastReviewTimestamp: null,
						},
					},
				},
				{
					version: 1,
					data: {
						fsrs: {
							dueTimestamp: 1641081600000, // 2022-01-02T00:00:00.000Z
							stability: 2.5,
							difficulty: 4.8,
							elapsedDays: 1,
							scheduledDays: 3,
							reps: 1,
							lapses: 0,
							state: StoredMintayCardQueueV1.LEARNING,
							lastReviewTimestamp: 1640995200000,
						},
					},
				},
				{
					version: 1,
					data: {
						fsrs: {
							dueTimestamp: 1641168000000, // 2022-01-03T00:00:00.000Z
							stability: 10.0,
							difficulty: 3.2,
							elapsedDays: 7,
							scheduledDays: 14,
							reps: 5,
							lapses: 1,
							state: StoredMintayCardQueueV1.LEARNED,
							lastReviewTimestamp: 1641081600000,
						},
					},
				},
				{
					version: 1,
					data: {
						fsrs: {
							dueTimestamp: 0,
							stability: 0.1,
							difficulty: 8.5,
							elapsedDays: 2,
							scheduledDays: 1,
							reps: 10,
							lapses: 5,
							state: StoredMintayCardQueueV1.RELEARNING,
							lastReviewTimestamp: 1640908800000,
						},
					},
				},
			],
			ownedExamples: [
				{
					fsrs: {
						dueTimestamp: 1609459200000, // 2021-01-01T00:00:00.000Z
						stability: 1.5,
						difficulty: 6.0,
						elapsedDays: 0,
						scheduledDays: 2,
						reps: 1,
						lapses: 0,
						state: MintayCardQueue.NEW,
						lastReviewTimestamp: null,
					},
				},
				{
					fsrs: {
						dueTimestamp: Number.MAX_SAFE_INTEGER,
						stability: 999.9,
						difficulty: 1.0,
						elapsedDays: 365,
						scheduledDays: 730,
						reps: 100,
						lapses: 2,
						state: MintayCardQueue.LEARNED,
						lastReviewTimestamp: 1640995200000,
					},
				},
				{
					fsrs: {
						dueTimestamp: 1577836800000, // 2020-01-01T00:00:00.000Z
						stability: 0.5,
						difficulty: 9.9,
						elapsedDays: 1,
						scheduledDays: 1,
						reps: 2,
						lapses: 1,
						state: MintayCardQueue.RELEARNING,
						lastReviewTimestamp: 1577750400000,
					},
				},
			],
			pairExamples: [
				[
					{
						version: 1,
						data: {
							fsrs: {
								dueTimestamp: 1577836800000, // 2020-01-01T00:00:00.000Z
								stability: 5.0,
								difficulty: 5.0,
								elapsedDays: 3,
								scheduledDays: 7,
								reps: 3,
								lapses: 0,
								state: StoredMintayCardQueueV1.LEARNING,
								lastReviewTimestamp: 1577750400000,
							},
						},
					},
					{
						fsrs: {
							dueTimestamp: 1577836800000,
							stability: 5.0,
							difficulty: 5.0,
							elapsedDays: 3,
							scheduledDays: 7,
							reps: 3,
							lapses: 0,
							state: MintayCardQueue.LEARNING,
							lastReviewTimestamp: 1577750400000,
						},
					},
				],
				[
					{
						version: 1,
						data: {
							fsrs: {
								dueTimestamp: 1,
								stability: 0.1,
								difficulty: 10.0,
								elapsedDays: 0,
								scheduledDays: 1,
								reps: 0,
								lapses: 0,
								state: StoredMintayCardQueueV1.NEW,
								lastReviewTimestamp: null,
							},
						},
					},
					{
						fsrs: {
							dueTimestamp: 1,
							stability: 0.1,
							difficulty: 10.0,
							elapsedDays: 0,
							scheduledDays: 1,
							reps: 0,
							lapses: 0,
							state: MintayCardQueue.NEW,
							lastReviewTimestamp: null,
						},
					},
				],
			],
		}

		// Get the serializer from the versioned type
		const serializer = storedMintayCardStateVersionedType.getSerializer()

		// Create and run the tester
		const tester = new SerializerTester({
			testData,
			serializer,
		})

		// This will throw if any test fails
		tester.runAllTests()
	})
})
