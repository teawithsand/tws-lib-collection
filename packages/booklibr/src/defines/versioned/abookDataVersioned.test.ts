import { Timestamp } from "@teawithsand/lngext"
import {
	SerializerTester,
	TestData,
	VersionedTypeInfer,
} from "@teawithsand/reserd"
import { describe, test } from "vitest"
import { AbookData } from "../abook"
import {
	AbookEntry,
	AbookEntryDisposition,
	AbookEntrySourceType,
} from "../abookEntry"
import { BlobMetadataResultType } from "../metadata/metadata"
import { AbookDataVersionedType } from "./abookDataVersioned"

describe("AbookDataVersionedType", () => {
	const createTestData = (): TestData<
		VersionedTypeInfer<typeof AbookDataVersionedType>,
		AbookData
	> => {
		const testPairs: Array<
			[VersionedTypeInfer<typeof AbookDataVersionedType>, AbookData]
		> = [
			// Empty audiobook
			[
				{
					version: 1,
					data: {
						header: {
							createdAt: 1640995200000,
							metadata: {
								title: "Empty Audiobook",
								description: "An audiobook with no entries",
								privateUserNote: "Test book",
							},
							position: null,
						},
						entries: [],
					},
				},
				{
					header: {
						createdAt: Timestamp.fromNumber(1640995200000),
						metadata: {
							title: "Empty Audiobook",
							description: "An audiobook with no entries",
							privateUserNote: "Test book",
						},
						position: null,
					},
					entries: new Map(),
				},
			],
			// Single entry audiobook
			[
				{
					version: 1,
					data: {
						header: {
							createdAt: 1641081600000,
							metadata: {
								title: "Simple Audiobook",
								description: "A single chapter audiobook",
								privateUserNote: "My favorite book",
							},
							position: {
								entryId: "entry1",
								entryOffsetMillis: 15000,
								globalOffsetMillis: 15000,
							},
						},
						entries: [
							{
								id: "entry1",
								entry: {
									data: {
										createdAt: 1641081600000,
										disposition: 0,
										source: {
											type: 0,
											uploadedAt: 1641081600000,
											uploadFileName: "chapter1.mp3",
											uploadFileMime: "audio/mpeg",
										},
									},
									aggregate: {
										metadata: {
											extractTimestamp: 1641081600000,
											extractSource: {
												type: 0,
											},
											metadata: {
												image: {
													type: 0,
													error: "No image",
												},
												audio: {
													type: 1,
													metadata: {
														duration: 1800000,
													},
												},
											},
										},
										blobSize: 15728640,
									},
								},
							},
						],
					},
				},
				{
					header: {
						createdAt: Timestamp.fromNumber(1641081600000),
						metadata: {
							title: "Simple Audiobook",
							description: "A single chapter audiobook",
							privateUserNote: "My favorite book",
						},
						position: {
							entryId: "entry1",
							entryOffsetMillis: 15000,
							globalOffsetMillis: 15000,
						},
					},
					entries: new Map([
						[
							"entry1",
							new AbookEntry({
								data: {
									createdAt:
										Timestamp.fromNumber(1641081600000),
									disposition:
										AbookEntryDisposition.PLAYABLE_AUDIO,
									source: {
										type: AbookEntrySourceType.UPLOAD,
										uploadedAt: 1641081600000,
										uploadFileName: "chapter1.mp3",
										uploadFileMime: "audio/mpeg",
									},
								},
								aggregate: {
									metadata: {
										extractTimestamp:
											Timestamp.fromNumber(1641081600000),
										extractSource: {
											type: AbookEntrySourceType.UPLOAD,
										},
										metadata: {
											image: {
												type: BlobMetadataResultType.ERROR,
												error: "No image",
											},
											audio: {
												type: BlobMetadataResultType.SUCCESS,
												metadata: {
													duration: 1800000,
												},
											},
										},
									},
									blobSize: 15728640,
								},
							}),
						],
					]),
				},
			],
			// Multi-entry audiobook with cover
			[
				{
					version: 1,
					data: {
						header: {
							createdAt: 1641168000000,
							metadata: {
								title: "Complex Audiobook",
								description:
									"A multi-chapter audiobook with cover image",
								privateUserNote:
									"Great story with excellent narration",
							},
							position: {
								entryId: "chapter2",
								entryOffsetMillis: 45000,
								globalOffsetMillis: 1845000,
							},
						},
						entries: [
							{
								id: "cover",
								entry: {
									data: {
										createdAt: 1641168000000,
										disposition: 1,
										source: {
											type: 1,
											url: "https://example.com/book-cover.jpg",
										},
									},
									aggregate: {
										metadata: {
											extractTimestamp: 1641168000000,
											extractSource: {
												type: 1,
												url: "https://example.com/book-cover.jpg",
											},
											metadata: {
												image: {
													type: 1,
													metadata: {
														width: 1400,
														height: 2100,
													},
												},
												audio: {
													type: 0,
													error: "Not an audio file",
												},
											},
										},
										blobSize: 204800,
									},
								},
							},
							{
								id: "chapter1",
								entry: {
									data: {
										createdAt: 1641168000000,
										disposition: 0,
										source: {
											type: 0,
											uploadedAt: 1641168000000,
											uploadFileName: "ch1.mp3",
											uploadFileMime: "audio/mpeg",
										},
									},
									aggregate: {
										metadata: {
											extractTimestamp: 1641168000000,
											extractSource: {
												type: 0,
											},
											metadata: {
												image: {
													type: 0,
													error: "No embedded image",
												},
												audio: {
													type: 1,
													metadata: {
														duration: 1800000,
													},
												},
											},
										},
										blobSize: 25165824,
									},
								},
							},
							{
								id: "chapter2",
								entry: {
									data: {
										createdAt: 1641168000000,
										disposition: 0,
										source: {
											type: 0,
											uploadedAt: 1641168000000,
											uploadFileName: "ch2.mp3",
											uploadFileMime: "audio/mpeg",
										},
									},
									aggregate: {
										metadata: null,
										blobSize: null,
									},
								},
							},
						],
					},
				},
				{
					header: {
						createdAt: Timestamp.fromNumber(1641168000000),
						metadata: {
							title: "Complex Audiobook",
							description:
								"A multi-chapter audiobook with cover image",
							privateUserNote:
								"Great story with excellent narration",
						},
						position: {
							entryId: "chapter2",
							entryOffsetMillis: 45000,
							globalOffsetMillis: 1845000,
						},
					},
					entries: new Map([
						[
							"cover",
							new AbookEntry({
								data: {
									createdAt:
										Timestamp.fromNumber(1641168000000),
									disposition:
										AbookEntryDisposition.COVER_IMAGE,
									source: {
										type: AbookEntrySourceType.URL,
										url: "https://example.com/book-cover.jpg",
									},
								},
								aggregate: {
									metadata: {
										extractTimestamp:
											Timestamp.fromNumber(1641168000000),
										extractSource: {
											type: AbookEntrySourceType.URL,
											url: "https://example.com/book-cover.jpg",
										},
										metadata: {
											image: {
												type: BlobMetadataResultType.SUCCESS,
												metadata: {
													width: 1400,
													height: 2100,
												},
											},
											audio: {
												type: BlobMetadataResultType.ERROR,
												error: "Not an audio file",
											},
										},
									},
									blobSize: 204800,
								},
							}),
						],
						[
							"chapter1",
							new AbookEntry({
								data: {
									createdAt:
										Timestamp.fromNumber(1641168000000),
									disposition:
										AbookEntryDisposition.PLAYABLE_AUDIO,
									source: {
										type: AbookEntrySourceType.UPLOAD,
										uploadedAt: 1641168000000,
										uploadFileName: "ch1.mp3",
										uploadFileMime: "audio/mpeg",
									},
								},
								aggregate: {
									metadata: {
										extractTimestamp:
											Timestamp.fromNumber(1641168000000),
										extractSource: {
											type: AbookEntrySourceType.UPLOAD,
										},
										metadata: {
											image: {
												type: BlobMetadataResultType.ERROR,
												error: "No embedded image",
											},
											audio: {
												type: BlobMetadataResultType.SUCCESS,
												metadata: {
													duration: 1800000,
												},
											},
										},
									},
									blobSize: 25165824,
								},
							}),
						],
						[
							"chapter2",
							new AbookEntry({
								data: {
									createdAt:
										Timestamp.fromNumber(1641168000000),
									disposition:
										AbookEntryDisposition.PLAYABLE_AUDIO,
									source: {
										type: AbookEntrySourceType.UPLOAD,
										uploadedAt: 1641168000000,
										uploadFileName: "ch2.mp3",
										uploadFileMime: "audio/mpeg",
									},
								},
								aggregate: {
									metadata: null,
									blobSize: null,
								},
							}),
						],
					]),
				},
			],
			// Audiobook with no position
			[
				{
					version: 1,
					data: {
						header: {
							createdAt: 1641254400000,
							metadata: {
								title: "Unstarted Book",
								description:
									"A book that hasn't been started yet",
								privateUserNote: "",
							},
							position: null,
						},
						entries: [
							{
								id: "intro",
								entry: {
									data: {
										createdAt: 1641254400000,
										disposition: 0,
										source: {
											type: 1,
											url: "https://example.com/intro.mp3",
										},
									},
									aggregate: {
										metadata: {
											extractTimestamp: 1641254400000,
											extractSource: {
												type: 1,
												url: "https://example.com/intro.mp3",
											},
											metadata: {
												image: {
													type: 0,
													error: "No image available",
												},
												audio: {
													type: 1,
													metadata: {
														duration: 300000,
													},
												},
											},
										},
										blobSize: 4194304,
									},
								},
							},
						],
					},
				},
				{
					header: {
						createdAt: Timestamp.fromNumber(1641254400000),
						metadata: {
							title: "Unstarted Book",
							description: "A book that hasn't been started yet",
							privateUserNote: "",
						},
						position: null,
					},
					entries: new Map([
						[
							"intro",
							new AbookEntry({
								data: {
									createdAt:
										Timestamp.fromNumber(1641254400000),
									disposition:
										AbookEntryDisposition.PLAYABLE_AUDIO,
									source: {
										type: AbookEntrySourceType.URL,
										url: "https://example.com/intro.mp3",
									},
								},
								aggregate: {
									metadata: {
										extractTimestamp:
											Timestamp.fromNumber(1641254400000),
										extractSource: {
											type: AbookEntrySourceType.URL,
											url: "https://example.com/intro.mp3",
										},
										metadata: {
											image: {
												type: BlobMetadataResultType.ERROR,
												error: "No image available",
											},
											audio: {
												type: BlobMetadataResultType.SUCCESS,
												metadata: {
													duration: 300000,
												},
											},
										},
									},
									blobSize: 4194304,
								},
							}),
						],
					]),
				},
			],
		]

		return TestData.createFromPairs(testPairs)
	}

	test("should handle serialization and deserialization correctly", () => {
		const testData = createTestData()
		const tester = new SerializerTester({
			testData,
			serializer: AbookDataVersionedType,
		})

		tester.runAllTests()
	})
})
