import { Timestamp } from "@teawithsand/lngext"
import {
	SerializerTester,
	TestData,
	VersionedTypeInfer,
} from "@teawithsand/reserd"
import { describe, test } from "vitest"
import type { AbookHeaderData } from "../abookData"
import { AbookHeaderDataVersionedType } from "./abookHeaderDataStored"

describe("AbookHeaderDataVersionedType", () => {
	test("serialization and deserialization", () => {
		// Test case 1: Basic case with all fields
		const testData1: AbookHeaderData = {
			createdAt: Timestamp.fromNumber(1672531200000), // 2023-01-01
			metadata: {
				title: "Sample Audiobook",
				description: "A sample audiobook for testing",
				privateUserNote: "My personal note",
			},
			position: {
				entryId: "entry123",
				entryOffsetMillis: 5000,
				globalOffsetMillis: 12000,
			},
		}

		const serializedData1: VersionedTypeInfer<
			typeof AbookHeaderDataVersionedType
		> = {
			version: 1 as const,
			data: {
				createdAt: 1672531200000,
				metadata: {
					title: "Sample Audiobook",
					description: "A sample audiobook for testing",
					privateUserNote: "My personal note",
				},
				position: {
					entryId: "entry123",
					entryOffsetMillis: 5000,
					globalOffsetMillis: 12000,
				},
			},
		}

		// Test case 2: Numeric entryId
		const testData2: AbookHeaderData = {
			createdAt: Timestamp.fromNumber(1672617600000), // 2023-01-02
			metadata: {
				title: "Another Book",
				description: "Another test book",
				privateUserNote: "Another note",
			},
			position: {
				entryId: 456,
				entryOffsetMillis: 10000,
				globalOffsetMillis: 25000,
			},
		}

		const serializedData2 = {
			version: 1 as const,
			data: {
				createdAt: 1672617600000,
				metadata: {
					title: "Another Book",
					description: "Another test book",
					privateUserNote: "Another note",
				},
				position: {
					entryId: 456,
					entryOffsetMillis: 10000,
					globalOffsetMillis: 25000,
				},
			},
		}

		// Test case 3: Null position
		const testData3: AbookHeaderData = {
			createdAt: Timestamp.fromNumber(1672704000000), // 2023-01-03
			metadata: {
				title: "Book Without Position",
				description: "Book that hasn't been played yet",
				privateUserNote: "",
			},
			position: null,
		}

		const serializedData3 = {
			version: 1 as const,
			data: {
				createdAt: 1672704000000,
				metadata: {
					title: "Book Without Position",
					description: "Book that hasn't been played yet",
					privateUserNote: "",
				},
				position: null,
			},
		}

		// Define test pairs for exact serialization/deserialization verification
		const testDataObj = TestData.createFromPairs([
			[serializedData1, testData1],
			[serializedData2, testData2],
			[serializedData3, testData3],
		])

		const tester = new SerializerTester({
			testData: testDataObj,
			serializer: AbookHeaderDataVersionedType.getUnknownSerializer(),
		})

		tester.runAllTests()
	})
})
