import { Timestamp } from "@teawithsand/lngext"
import {
	SerializerTester,
	TestData,
	VersionedTypeInfer,
} from "@teawithsand/reserd"
import { describe, test } from "vitest"
import {
	AbookEntry,
	AbookEntryDisposition,
	AbookEntrySourceType,
} from "../abookEntry"
import { BlobMetadataResultType } from "../metadata/metadata"
import { AbookEntryVersionedType } from "./abookEntryVersioned"

describe("AbookEntryVersionedType", () => {
	const createTestData = (): TestData<any, AbookEntry> => {
		const testPairs: Array<
			[VersionedTypeInfer<typeof AbookEntryVersionedType>, AbookEntry]
		> = [
			// Audio entry with upload source
			[
				{
					version: 1,
					data: {
						data: {
							createdAt: 1640995200000,
							disposition: 0,
							source: {
								type: 0,
								uploadedAt: 1640995200000,
								uploadFileName: "audio.mp3",
								uploadFileMime: "audio/mpeg",
							},
						},
						aggregate: {
							metadata: {
								extractTimestamp: 1640995200000,
								extractSource: {
									type: 0,
								},
								metadata: {
									image: {
										type: 0,
										error: "No image in audio file",
									},
									audio: {
										type: 1,
										metadata: {
											duration: 180000,
										},
									},
								},
							},
							blobSize: 5242880,
						},
					},
				},
				new AbookEntry({
					data: {
						createdAt: Timestamp.fromNumber(1640995200000),
						disposition: AbookEntryDisposition.PLAYABLE_AUDIO,
						source: {
							type: AbookEntrySourceType.UPLOAD,
							uploadedAt: 1640995200000,
							uploadFileName: "audio.mp3",
							uploadFileMime: "audio/mpeg",
						},
					},
					aggregate: {
						metadata: {
							extractTimestamp:
								Timestamp.fromNumber(1640995200000),
							extractSource: {
								type: AbookEntrySourceType.UPLOAD,
							},
							metadata: {
								image: {
									type: BlobMetadataResultType.ERROR,
									error: "No image in audio file",
								},
								audio: {
									type: BlobMetadataResultType.SUCCESS,
									metadata: {
										duration: 180000,
									},
								},
							},
						},
						blobSize: 5242880,
					},
				}),
			],
			// Cover image entry with URL source
			[
				{
					version: 1,
					data: {
						data: {
							createdAt: 1641081600000,
							disposition: 1,
							source: {
								type: 1,
								url: "https://example.com/cover.jpg",
							},
						},
						aggregate: {
							metadata: {
								extractTimestamp: 1641081600000,
								extractSource: {
									type: 1,
									url: "https://example.com/cover.jpg",
								},
								metadata: {
									image: {
										type: 1,
										metadata: {
											width: 512,
											height: 512,
										},
									},
									audio: {
										type: 0,
										error: "Not an audio file",
									},
								},
							},
							blobSize: 102400,
						},
					},
				},
				new AbookEntry({
					data: {
						createdAt: Timestamp.fromNumber(1641081600000),
						disposition: AbookEntryDisposition.COVER_IMAGE,
						source: {
							type: AbookEntrySourceType.URL,
							url: "https://example.com/cover.jpg",
						},
					},
					aggregate: {
						metadata: {
							extractTimestamp:
								Timestamp.fromNumber(1641081600000),
							extractSource: {
								type: AbookEntrySourceType.URL,
								url: "https://example.com/cover.jpg",
							},
							metadata: {
								image: {
									type: BlobMetadataResultType.SUCCESS,
									metadata: {
										width: 512,
										height: 512,
									},
								},
								audio: {
									type: BlobMetadataResultType.ERROR,
									error: "Not an audio file",
								},
							},
						},
						blobSize: 102400,
					},
				}),
			],
			// Entry with no metadata
			[
				{
					version: 1,
					data: {
						data: {
							createdAt: 1641168000000,
							disposition: 0,
							source: {
								type: 0,
								uploadedAt: 1641168000000,
								uploadFileName: "chapter1.mp3",
								uploadFileMime: "audio/mpeg",
							},
						},
						aggregate: {
							metadata: null,
							blobSize: null,
						},
					},
				},
				new AbookEntry({
					data: {
						createdAt: Timestamp.fromNumber(1641168000000),
						disposition: AbookEntryDisposition.PLAYABLE_AUDIO,
						source: {
							type: AbookEntrySourceType.UPLOAD,
							uploadedAt: 1641168000000,
							uploadFileName: "chapter1.mp3",
							uploadFileMime: "audio/mpeg",
						},
					},
					aggregate: {
						metadata: null,
						blobSize: null,
					},
				}),
			],
			// Entry with all error metadata
			[
				{
					version: 1,
					data: {
						data: {
							createdAt: 1641254400000,
							disposition: 1,
							source: {
								type: 1,
								url: "https://example.com/broken-image.jpg",
							},
						},
						aggregate: {
							metadata: {
								extractTimestamp: 1641254400000,
								extractSource: {
									type: 1,
									url: "https://example.com/broken-image.jpg",
								},
								metadata: {
									image: {
										type: 0,
										error: "Failed to load image",
									},
									audio: {
										type: 0,
										error: "Not an audio file",
									},
								},
							},
							blobSize: 0,
						},
					},
				},
				new AbookEntry({
					data: {
						createdAt: Timestamp.fromNumber(1641254400000),
						disposition: AbookEntryDisposition.COVER_IMAGE,
						source: {
							type: AbookEntrySourceType.URL,
							url: "https://example.com/broken-image.jpg",
						},
					},
					aggregate: {
						metadata: {
							extractTimestamp:
								Timestamp.fromNumber(1641254400000),
							extractSource: {
								type: AbookEntrySourceType.URL,
								url: "https://example.com/broken-image.jpg",
							},
							metadata: {
								image: {
									type: BlobMetadataResultType.ERROR,
									error: "Failed to load image",
								},
								audio: {
									type: BlobMetadataResultType.ERROR,
									error: "Not an audio file",
								},
							},
						},
						blobSize: 0,
					},
				}),
			],
		]

		return TestData.createFromPairs(testPairs)
	}

	test("should handle serialization and deserialization correctly", () => {
		const testData = createTestData()
		const tester = new SerializerTester({
			testData,
			serializer: AbookEntryVersionedType,
		})

		tester.runAllTests()
	})
})
