import { Timestamp } from "@teawithsand/lngext"
import { SerializerTester, TestData } from "@teawithsand/reserd"
import { describe, test } from "vitest"
import {
	AbookEntryDisposition,
	AbookEntrySourceType,
	BlobMetadataResultType,
} from "../../defines"
import {
	FsAbookStoreAbookDataSerializer,
	FsAbookStoreAbookDataStored,
	FsAbookStoreAbookEntryDataSerializer,
	FsAbookStoreAbookEntryDataStored,
} from "./serializer"
import { FsAbookStoreAbookData, FsAbookStoreAbookEntryData } from "./store"

describe("FsAbookStore Serializers", () => {
	describe("FsAbookStoreAbookDataSerializer", () => {
		const createTestData = (): TestData<
			FsAbookStoreAbookDataStored,
			FsAbookStoreAbookData
		> => {
			const testPairs: Array<
				[FsAbookStoreAbookDataStored, FsAbookStoreAbookData]
			> = [
				// Basic audiobook with position
				[
					{
						aggregate: {
							version: 1,
							data: {
								totalDurationMillis: 120000,
								totalEntries: 5,
							},
						},
						header: {
							version: 1,
							data: {
								createdAt: 1640995200000,
								metadata: {
									title: "Test Audiobook",
									description: "A test audiobook",
									privateUserNote: "My notes",
								},
								position: {
									entryId: "entry-123",
									entryOffsetMillis: 30000,
									globalOffsetMillis: 45000,
								},
							},
						},
					},
					{
						aggregate: {
							totalDurationMillis: 120000,
							totalEntries: 5,
						},
						header: {
							createdAt: Timestamp.fromNumber(1640995200000),
							metadata: {
								title: "Test Audiobook",
								description: "A test audiobook",
								privateUserNote: "My notes",
							},
							position: {
								entryId: "entry-123",
								entryOffsetMillis: 30000,
								globalOffsetMillis: 45000,
							},
						},
					},
				],
				// Audiobook without position
				[
					{
						aggregate: {
							version: 1,
							data: {
								totalDurationMillis: 0,
								totalEntries: 0,
							},
						},
						header: {
							version: 1,
							data: {
								createdAt: 1640995200000,
								metadata: {
									title: "Empty Audiobook",
									description: "",
									privateUserNote: "",
								},
								position: null,
							},
						},
					},
					{
						aggregate: {
							totalDurationMillis: 0,
							totalEntries: 0,
						},
						header: {
							createdAt: Timestamp.fromNumber(1640995200000),
							metadata: {
								title: "Empty Audiobook",
								description: "",
								privateUserNote: "",
							},
							position: null,
						},
					},
				],
				// Complex audiobook with special characters
				[
					{
						aggregate: {
							version: 1,
							data: {
								totalDurationMillis: 14400000,
								totalEntries: 25,
							},
						},
						header: {
							version: 1,
							data: {
								createdAt: 1577836800000,
								metadata: {
									title: "Special Characters: éñ中文🎵",
									description:
										"Description with\nnewlines\tand\ttabs",
									privateUserNote: "Unicode: ♪♫♬♩",
								},
								position: {
									entryId: "entry-with-special-chars-éñ中文",
									entryOffsetMillis: 0,
									globalOffsetMillis: 1000000,
								},
							},
						},
					},
					{
						aggregate: {
							totalDurationMillis: 14400000,
							totalEntries: 25,
						},
						header: {
							createdAt: Timestamp.fromNumber(1577836800000),
							metadata: {
								title: "Special Characters: éñ中文🎵",
								description:
									"Description with\nnewlines\tand\ttabs",
								privateUserNote: "Unicode: ♪♫♬♩",
							},
							position: {
								entryId: "entry-with-special-chars-éñ中文",
								entryOffsetMillis: 0,
								globalOffsetMillis: 1000000,
							},
						},
					},
				],
			]

			return TestData.createFromPairs(testPairs)
		}

		test("should handle serialization and deserialization correctly", () => {
			const testData = createTestData()
			const tester = new SerializerTester({
				testData,
				serializer: FsAbookStoreAbookDataSerializer,
			})

			tester.runAllTests()
		})
	})

	describe("FsAbookStoreAbookEntryDataSerializer", () => {
		const createTestData = (): TestData<
			FsAbookStoreAbookEntryDataStored,
			FsAbookStoreAbookEntryData
		> => {
			const testPairs: Array<
				[FsAbookStoreAbookEntryDataStored, FsAbookStoreAbookEntryData]
			> = [
				// Audio entry with URL source and full metadata
				[
					{
						aggregate: {
							version: 1,
							data: {
								metadata: {
									extractTimestamp: 1640995200000,
									extractSource: {
										type: 1,
										url: "https://example.com/audio.mp3",
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
								blobSize: 5242880,
							},
						},
						data: {
							version: 1,
							data: {
								createdAt: 1640995200000,
								disposition: 0,
								source: {
									type: 1,
									url: "https://example.com/audio.mp3",
								},
							},
						},
					},
					{
						aggregate: {
							metadata: {
								extractTimestamp:
									Timestamp.fromNumber(1640995200000),
								extractSource: {
									type: AbookEntrySourceType.URL,
									url: "https://example.com/audio.mp3",
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
							blobSize: 5242880,
						},
						data: {
							createdAt: Timestamp.fromNumber(1640995200000),
							disposition: AbookEntryDisposition.PLAYABLE_AUDIO,
							source: {
								type: AbookEntrySourceType.URL,
								url: "https://example.com/audio.mp3",
							},
						},
					},
				],
				// Cover image entry with upload source and no metadata
				[
					{
						aggregate: {
							version: 1,
							data: {
								metadata: null,
								blobSize: null,
							},
						},
						data: {
							version: 1,
							data: {
								createdAt: 1640995200000,
								disposition: 1,
								source: {
									type: 0,
									uploadedAt: 1640995200000,
									uploadFileName: "cover.jpg",
									uploadFileMime: "image/jpeg",
								},
							},
						},
					},
					{
						aggregate: {
							metadata: null,
							blobSize: null,
						},
						data: {
							createdAt: Timestamp.fromNumber(1640995200000),
							disposition: AbookEntryDisposition.COVER_IMAGE,
							source: {
								type: AbookEntrySourceType.UPLOAD,
								uploadedAt: 1640995200000,
								uploadFileName: "cover.jpg",
								uploadFileMime: "image/jpeg",
							},
						},
					},
				],
				// Entry with error metadata
				[
					{
						aggregate: {
							version: 1,
							data: {
								metadata: {
									extractTimestamp: 1577836800000,
									extractSource: {
										type: 0,
									},
									metadata: {
										image: {
											type: 0,
											error: "No image in audio file",
										},
										audio: {
											type: 0,
											error: "Failed to extract audio metadata",
										},
									},
								},
								blobSize: 1024000,
							},
						},
						data: {
							version: 1,
							data: {
								createdAt: 1577836800000,
								disposition: 0,
								source: {
									type: 0,
									uploadedAt: 1577836800000,
									uploadFileName: "chapter01.mp3",
									uploadFileMime: "audio/mpeg",
								},
							},
						},
					},
					{
						aggregate: {
							metadata: {
								extractTimestamp:
									Timestamp.fromNumber(1577836800000),
								extractSource: {
									type: AbookEntrySourceType.UPLOAD,
								},
								metadata: {
									image: {
										type: BlobMetadataResultType.ERROR,
										error: "No image in audio file",
									},
									audio: {
										type: BlobMetadataResultType.ERROR,
										error: "Failed to extract audio metadata",
									},
								},
							},
							blobSize: 1024000,
						},
						data: {
							createdAt: Timestamp.fromNumber(1577836800000),
							disposition: AbookEntryDisposition.PLAYABLE_AUDIO,
							source: {
								type: AbookEntrySourceType.UPLOAD,
								uploadedAt: 1577836800000,
								uploadFileName: "chapter01.mp3",
								uploadFileMime: "audio/mpeg",
							},
						},
					},
				],
			]

			return TestData.createFromPairs(testPairs)
		}

		test("should handle serialization and deserialization correctly", () => {
			const testData = createTestData()
			const tester = new SerializerTester({
				testData,
				serializer: FsAbookStoreAbookEntryDataSerializer,
			})

			tester.runAllTests()
		})
	})
})
