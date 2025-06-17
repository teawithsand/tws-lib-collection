import { SerializerTester, TestData } from "@teawithsand/reserd"
import { describe, test } from "vitest"
import { MintayCollectionData } from "../../collectionData"
import { StoredMintayCollectionData } from "./schema"
import { storedMintayCollectionDataVersionedType } from "./serializer"

describe("storedMintayCollectionDataVersionedType", () => {
	test("should pass SerializerTester validation", () => {
		const testData: TestData<
			StoredMintayCollectionData,
			MintayCollectionData
		> = {
			storedExamples: [
				{
					version: 1,
					data: {
						globalId: "collection-123",
						content:
							"My First Collection\n\nA sample collection for testing",
						createdAtTimestamp: 1640995200000, // 2022-01-01T00:00:00.000Z
						lastUpdatedAtTimestamp: 1641081600000, // 2022-01-02T00:00:00.000Z
					},
				},
				{
					version: 1,
					data: {
						globalId: "",
						content: "",
						createdAtTimestamp: 0,
						lastUpdatedAtTimestamp: 0,
					},
				},
				{
					version: 1,
					data: {
						globalId: "special-chars-collection-!@#$%^&*()",
						content:
							"Collection with Unicode: 你好世界 🌍\n\nDescription with\nnewlines\tand\ttabs",
						createdAtTimestamp: Date.now(),
						lastUpdatedAtTimestamp: Date.now() + 1000,
					},
				},
			],
			ownedExamples: [
				{
					globalId: "owned-collection-456",
					content:
						"Owned Collection Example\n\nThis is an owned collection example",
					createdAtTimestamp: 1609459200000, // 2021-01-01T00:00:00.000Z
					lastUpdatedAtTimestamp: 1609545600000, // 2021-01-02T00:00:00.000Z
				},
				{
					globalId: "large-collection",
					content: "A".repeat(1000) + "\n\n" + "B".repeat(5000), // Large content
					createdAtTimestamp: Number.MAX_SAFE_INTEGER - 1000,
					lastUpdatedAtTimestamp: Number.MAX_SAFE_INTEGER,
				},
			],
			pairExamples: [
				[
					{
						version: 1,
						data: {
							globalId: "paired-collection-789",
							content:
								"Paired Collection\n\nCollection with matched stored/owned pair",
							createdAtTimestamp: 1577836800000, // 2020-01-01T00:00:00.000Z
							lastUpdatedAtTimestamp: 1577923200000, // 2020-01-02T00:00:00.000Z
						},
					},
					{
						globalId: "paired-collection-789",
						content:
							"Paired Collection\n\nCollection with matched stored/owned pair",
						createdAtTimestamp: 1577836800000,
						lastUpdatedAtTimestamp: 1577923200000,
					},
				],
				[
					{
						version: 1,
						data: {
							globalId: "minimal-pair",
							content: "Min\n\nX",
							createdAtTimestamp: 1,
							lastUpdatedAtTimestamp: 2,
						},
					},
					{
						globalId: "minimal-pair",
						content: "Min\n\nX",
						createdAtTimestamp: 1,
						lastUpdatedAtTimestamp: 2,
					},
				],
			],
		}

		// Get the serializer from the versioned type
		const serializer =
			storedMintayCollectionDataVersionedType.getSerializer()

		// Create and run the tester
		const tester = new SerializerTester({
			testData,
			serializer,
		})

		// This will throw if any test fails
		tester.runAllTests()
	})
})
