import {
	SerializerTester,
	SimpleSerializedError,
	TestData,
} from "@teawithsand/reserd"
import { describe, expect, test } from "vitest"
import { BlobMetadata, BlobMetadataResultType } from "../metadata"
import {
	AbookEntryBlobTypeStoredV1,
	BlobMetadataResultTypeStoredV1,
	blobMetadataVersioned,
} from "./blobMetadataStored"

describe("BlobMetadata versioned serialization", () => {
	test("should serialize and deserialize correctly", () => {
		const testData: BlobMetadata = {
			image: {
				type: BlobMetadataResultType.SUCCESS,
				metadata: {
					width: 1920,
					height: 1080,
				},
			},
			audio: {
				type: BlobMetadataResultType.ERROR,
				error: SimpleSerializedError.fromAny(
					new Error("Audio processing failed"),
				),
			},
		}

		const serializedExamples = [
			{
				version: 1 as const,
				data: {
					image: {
						type: BlobMetadataResultTypeStoredV1.SUCCESS,
						metadata: {
							width: 1920,
							height: 1080,
						},
					},
					audio: {
						type: BlobMetadataResultTypeStoredV1.ERROR,
						error: {
							type: "object",
							name: "Error",
							message: "Audio processing failed",
							causeChain: [],
						},
					},
				},
			},
			{
				version: 1 as const,
				data: {
					image: {
						type: BlobMetadataResultTypeStoredV1.ERROR,
						error: {
							type: "object",
							name: "Error",
							message: "Image processing failed",
							causeChain: [],
						},
					},
					audio: {
						type: BlobMetadataResultTypeStoredV1.SUCCESS,
						metadata: {
							duration: 120.5,
						},
					},
				},
			},
		]

		const testDataObj = TestData.createFromPairs([
			[serializedExamples[0], testData],
		])

		const tester = new SerializerTester({
			testData: testDataObj,
			serializer: blobMetadataVersioned.getUnknownSerializer(),
		})

		tester.runAllTests()
	})
})

describe("BlobMetadata stored enum value stability", () => {
	test("AbookEntryBlobTypeStoredV1 values should remain stable", () => {
		// These values are used in serialized data and must never change
		expect(AbookEntryBlobTypeStoredV1.IMAGE).toBe("image")
		expect(AbookEntryBlobTypeStoredV1.AUDIO).toBe("audio")
		expect(AbookEntryBlobTypeStoredV1.UNKNOWN).toBe("unknown")
	})

	test("BlobMetadataResultTypeStoredV1 values should remain stable", () => {
		// These values are used in serialized data and must never change
		expect(BlobMetadataResultTypeStoredV1.ERROR).toBe("error")
		expect(BlobMetadataResultTypeStoredV1.SUCCESS).toBe("success")
	})

	test("AbookEntryBlobTypeStoredV1 enum should have exactly the expected members", () => {
		const enumValues = Object.values(AbookEntryBlobTypeStoredV1)
		expect(enumValues).toHaveLength(3)
		expect(enumValues).toContain("image")
		expect(enumValues).toContain("audio")
		expect(enumValues).toContain("unknown")
	})

	test("BlobMetadataResultTypeStoredV1 enum should have exactly the expected members", () => {
		const enumValues = Object.values(BlobMetadataResultTypeStoredV1)
		expect(enumValues).toHaveLength(2)
		expect(enumValues).toContain("error")
		expect(enumValues).toContain("success")
	})
})
