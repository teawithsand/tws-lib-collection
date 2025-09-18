import { Timestamp } from "@teawithsand/lngext"
import {
	SerializerTester,
	TestData,
	VersionedTypeInfer,
} from "@teawithsand/reserd"
import { describe, test } from "vitest"
import { AbookEntry } from "../../abookEntry"
import { AbookEntryDisposition } from "../../abookEntry/entryData"
import { AbookEntrySourceType } from "../../abookEntry/entrySource"
import { AbookEntryDispositionStoredV1 } from "../../abookEntry/stored/abookEntryDataStored"
import { AbookEntrySourceTypeStoredV1 } from "../../abookEntry/stored/common"
import type { AbookData } from "../abookData"
import { AbookDataVersionedType } from "./abookDataStored"

describe("AbookDataVersionedType", () => {
	test("serialization and deserialization", () => {
		const testEntry = new AbookEntry({
			data: {
				createdAt: Timestamp.fromNumber(1641024000000),
				name: "Test Entry",
				disposition: AbookEntryDisposition.PLAYABLE_AUDIO,
				ordinalNumber: 1,
				source: {
					type: AbookEntrySourceType.UPLOAD,
					uploadedAt: 1641024000000,
					uploadFileName: "test-audio.mp3",
					uploadFileMime: "audio/mpeg",
				},
			},
			aggregate: {
				metadata: null,
				blobSize: 1024000,
			},
		})

		const testEntry2 = new AbookEntry({
			data: {
				createdAt: Timestamp.fromNumber(1641024000000),
				name: "Test Entry 2",
				disposition: AbookEntryDisposition.PLAYABLE_AUDIO,
				ordinalNumber: 1,
				source: {
					type: AbookEntrySourceType.UPLOAD,
					uploadedAt: 1641024000000,
					uploadFileName: "test-audio.mp3",
					uploadFileMime: "audio/mpeg",
				},
			},
			aggregate: {
				metadata: null,
				blobSize: 1024000,
			},
		})

		const testData: AbookData = {
			header: {
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
			},
			entries: new Map([
				["entry1", testEntry],
				["entry2", testEntry2],
			]),
		}

		const serializedExample: VersionedTypeInfer<
			typeof AbookDataVersionedType
		> = {
			version: 1 as const,
			data: {
				header: {
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
				},
				entries: {
					entry1: {
						version: 1 as const,
						data: {
							data: {
								version: 1 as const,
								data: {
									createdAt: 1641024000000,
									name: "Test Entry",
									disposition:
										AbookEntryDispositionStoredV1.PLAYABLE_AUDIO,
									source: {
										type: AbookEntrySourceTypeStoredV1.UPLOAD,
										uploadedAt: 1641024000000,
										uploadFileName: "test-audio.mp3",
										uploadFileMime: "audio/mpeg",
									},
									ordinalNumber: 1,
								},
							},
							aggregate: {
								version: 1 as const,
								data: {
									metadata: null,
									blobSize: 1024000,
								},
							},
						},
					},
					entry2: {
						version: 1 as const,
						data: {
							data: {
								version: 1 as const,
								data: {
									createdAt: 1641024000000,
									name: "Test Entry 2",
									disposition:
										AbookEntryDispositionStoredV1.PLAYABLE_AUDIO,
									source: {
										type: AbookEntrySourceTypeStoredV1.UPLOAD,
										uploadedAt: 1641024000000,
										uploadFileName: "test-audio.mp3",
										uploadFileMime: "audio/mpeg",
									},
									ordinalNumber: 1,
								},
							},
							aggregate: {
								version: 1 as const,
								data: {
									metadata: null,
									blobSize: 1024000,
								},
							},
						},
					},
				},
			},
		}

		const testDataObj = TestData.createFromPairs([
			[serializedExample, testData],
		])

		const tester = new SerializerTester({
			testData: testDataObj,
			serializer: AbookDataVersionedType.getUnknownSerializer(),
		})

		tester.runAllTests()
	})
})
