import {
	SerializerTester,
	TestData,
	VersionedTypeInfer,
} from "@teawithsand/reserd"
import { describe, test } from "vitest"
import { AbookAggregateData } from "../abook"
import { AbookAggregateDataVersionedType } from "./abookAggregateDataVersioned"

describe("AbookAggregateDataVersionedType", () => {
	const createTestData = (): TestData<
		VersionedTypeInfer<typeof AbookAggregateDataVersionedType>,
		AbookAggregateData
	> => {
		const testPairs: Array<
			[
				VersionedTypeInfer<typeof AbookAggregateDataVersionedType>,
				AbookAggregateData,
			]
		> = [
			// Empty audiobook
			[
				{
					version: 1,
					data: {
						totalDurationMillis: 0,
						totalEntries: 0,
					},
				},
				{
					totalDurationMillis: 0,
					totalEntries: 0,
				},
			],
			// Single chapter audiobook
			[
				{
					version: 1,
					data: {
						totalDurationMillis: 1800000, // 30 minutes
						totalEntries: 1,
					},
				},
				{
					totalDurationMillis: 1800000, // 30 minutes
					totalEntries: 1,
				},
			],
			// Multi-chapter audiobook
			[
				{
					version: 1,
					data: {
						totalDurationMillis: 14400000, // 4 hours
						totalEntries: 12,
					},
				},
				{
					totalDurationMillis: 14400000, // 4 hours
					totalEntries: 12,
				},
			],
			// Large audiobook
			[
				{
					version: 1,
					data: {
						totalDurationMillis: 86400000, // 24 hours
						totalEntries: 50,
					},
				},
				{
					totalDurationMillis: 86400000, // 24 hours
					totalEntries: 50,
				},
			],
			// Very large numbers
			[
				{
					version: 1,
					data: {
						totalDurationMillis: Number.MAX_SAFE_INTEGER,
						totalEntries: Number.MAX_SAFE_INTEGER,
					},
				},
				{
					totalDurationMillis: Number.MAX_SAFE_INTEGER,
					totalEntries: Number.MAX_SAFE_INTEGER,
				},
			],
		]

		return TestData.createFromPairs(testPairs)
	}

	test("should handle serialization and deserialization correctly", () => {
		const testData = createTestData()
		const tester = new SerializerTester({
			testData,
			serializer: AbookAggregateDataVersionedType,
		})

		tester.runAllTests()
	})
})
