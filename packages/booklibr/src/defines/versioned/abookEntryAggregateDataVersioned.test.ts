import { Timestamp } from "@teawithsand/lngext"
import {
	SerializerTester,
	TestData,
	VersionedTypeInfer,
} from "@teawithsand/reserd"
import { describe, test } from "vitest"
import { AbookEntryAggregateData, AbookEntrySourceType } from "../abookEntry"
import { BlobMetadataResultType } from "../metadata/metadata"
import { AbookEntryAggregateDataVersionedType } from "./abookEntryAggregateDataVersioned"

describe("AbookEntryAggregateDataVersionedType", () => {
	const createTestData = (): TestData<
		VersionedTypeInfer<typeof AbookEntryAggregateDataVersionedType>,
		AbookEntryAggregateData
	> => {
		const testPairs: Array<
			[
				VersionedTypeInfer<typeof AbookEntryAggregateDataVersionedType>,
				AbookEntryAggregateData,
			]
		> = [
			// Example with metadata
			[
				{
					version: 1,
					data: {
						metadata: {
							extractTimestamp: 1640995200000,
							extractSource: {
								type: 0,
							},
							metadata: {
								image: {
									type: 1,
									metadata: {
										width: 1920,
										height: 1080,
									},
								},
								audio: {
									type: 1,
									metadata: {
										duration: 120000,
									},
								},
							},
						},
						blobSize: 1024000,
					},
				},
				{
					metadata: {
						extractTimestamp: Timestamp.fromNumber(1640995200000),
						extractSource: {
							type: AbookEntrySourceType.UPLOAD,
						},
						metadata: {
							image: {
								type: BlobMetadataResultType.SUCCESS,
								metadata: {
									width: 1920,
									height: 1080,
								},
							},
							audio: {
								type: BlobMetadataResultType.SUCCESS,
								metadata: {
									duration: 120000,
								},
							},
						},
					},
					blobSize: 1024000,
				},
			],
			// Example with URL source
			[
				{
					version: 1,
					data: {
						metadata: {
							extractTimestamp: 1641081600000,
							extractSource: {
								type: 1,
								url: "https://example.com/audio.mp3",
							},
							metadata: {
								image: {
									type: 0,
									error: "No image found",
								},
								audio: {
									type: 1,
									metadata: {
										duration: 300000,
									},
								},
							},
						},
						blobSize: 2048000,
					},
				},
				{
					metadata: {
						extractTimestamp: Timestamp.fromNumber(1641081600000),
						extractSource: {
							type: AbookEntrySourceType.URL,
							url: "https://example.com/audio.mp3",
						},
						metadata: {
							image: {
								type: BlobMetadataResultType.ERROR,
								error: "No image found",
							},
							audio: {
								type: BlobMetadataResultType.SUCCESS,
								metadata: {
									duration: 300000,
								},
							},
						},
					},
					blobSize: 2048000,
				},
			],
			// Example with null metadata
			[
				{
					version: 1,
					data: {
						metadata: null,
						blobSize: null,
					},
				},
				{
					metadata: null,
					blobSize: null,
				},
			],
			// Example with error metadata
			[
				{
					version: 1,
					data: {
						metadata: {
							extractTimestamp: 1641168000000,
							extractSource: {
								type: 1,
								url: "https://example.com/image.jpg",
							},
							metadata: {
								image: {
									type: 0,
									error: "Failed to extract image metadata",
								},
								audio: {
									type: 0,
									error: "Failed to extract audio metadata",
								},
							},
						},
						blobSize: 512000,
					},
				},
				{
					metadata: {
						extractTimestamp: Timestamp.fromNumber(1641168000000),
						extractSource: {
							type: AbookEntrySourceType.URL,
							url: "https://example.com/image.jpg",
						},
						metadata: {
							image: {
								type: BlobMetadataResultType.ERROR,
								error: "Failed to extract image metadata",
							},
							audio: {
								type: BlobMetadataResultType.ERROR,
								error: "Failed to extract audio metadata",
							},
						},
					},
					blobSize: 512000,
				},
			],
		]

		return TestData.createFromPairs(testPairs)
	}

	test("should handle serialization and deserialization correctly", () => {
		const testData = createTestData()
		const tester = new SerializerTester({
			testData,
			serializer: AbookEntryAggregateDataVersionedType,
		})

		tester.runAllTests()
	})
})
