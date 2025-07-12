import {
	SerializerTester,
	TestData,
	VersionedTypeInfer,
} from "@teawithsand/reserd"
import { describe, test } from "vitest"
import { AbookAggregateData } from "../abookData"
import { AbookAggregateDataVersionedType } from "./abookAggregateDataStored"

describe("AbookAggregateData versioned serialization", () => {
	test("should serialize and deserialize correctly", () => {
		const testData: AbookAggregateData = {
			totalDurationMillis: 7320000, // 2 hours and 2 minutes
			totalEntries: 15,
		}

		const serializedExamples: VersionedTypeInfer<
			typeof AbookAggregateDataVersionedType
		>[] = [
			{
				version: 1 as const,
				data: {
					totalDurationMillis: 7320000,
					totalEntries: 15,
				},
			},
			{
				version: 1 as const,
				data: {
					totalDurationMillis: 0,
					totalEntries: 0,
				},
			},
			{
				version: 1 as const,
				data: {
					totalDurationMillis: 180000, // 3 minutes
					totalEntries: 1,
				},
			},
		]

		const testDataObj = TestData.createFromPairs([
			[serializedExamples[0], testData],
		])

		const tester = new SerializerTester({
			testData: testDataObj,
			serializer: AbookAggregateDataVersionedType.getUnknownSerializer(),
		})

		tester.runAllTests()
	})
})
