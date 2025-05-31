import { SerializerTester, TestData } from "@teawithsand/reserd"
import { describe, test } from "vitest"
import { MintayCardData } from "../../cardData"
import { StoredMintayCardData } from "./schema"
import { storedMintayCardDataVersionedType } from "./serializer"

describe("storedMintayCardDataVersionedType", () => {
	test("should pass SerializerTester validation", () => {
		const testData: TestData<StoredMintayCardData, MintayCardData> = {
			storedExamples: [
				{
					version: 1,
					data: {
						globalId: "card-123",
						content: "Sample card content with various characters",
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
						globalId: "special-chars-card-!@#$%^&*()",
						content:
							"Card with Unicode: 你好世界 🌍\nand\nnewlines\tand\ttabs",
						createdAtTimestamp: Date.now(),
						lastUpdatedAtTimestamp: Date.now() + 1000,
					},
				},
			],
			ownedExamples: [
				{
					globalId: "owned-card-456",
					content: "Owned card example content",
					createdAtTimestamp: 1609459200000, // 2021-01-01T00:00:00.000Z
					lastUpdatedAtTimestamp: 1609545600000, // 2021-01-02T00:00:00.000Z
				},
				{
					globalId: "large-card",
					content: "C".repeat(10000), // Large content
					createdAtTimestamp: Number.MAX_SAFE_INTEGER - 1000,
					lastUpdatedAtTimestamp: Number.MAX_SAFE_INTEGER,
				},
			],
			pairExamples: [
				[
					{
						version: 1,
						data: {
							globalId: "paired-card-789",
							content: "Paired card content",
							createdAtTimestamp: 1577836800000, // 2020-01-01T00:00:00.000Z
							lastUpdatedAtTimestamp: 1577923200000, // 2020-01-02T00:00:00.000Z
						},
					},
					{
						globalId: "paired-card-789",
						content: "Paired card content",
						createdAtTimestamp: 1577836800000,
						lastUpdatedAtTimestamp: 1577923200000,
					},
				],
				[
					{
						version: 1,
						data: {
							globalId: "minimal-pair",
							content: "X",
							createdAtTimestamp: 1,
							lastUpdatedAtTimestamp: 2,
						},
					},
					{
						globalId: "minimal-pair",
						content: "X",
						createdAtTimestamp: 1,
						lastUpdatedAtTimestamp: 2,
					},
				],
			],
		}

		// Get the serializer from the versioned type
		const serializer = storedMintayCardDataVersionedType.getSerializer()

		// Create and run the tester
		const tester = new SerializerTester({
			testData,
			serializer,
		})

		// This will throw if any test fails
		tester.runAllTests()
	})
})
