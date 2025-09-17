import { Timestamp } from "@teawithsand/lngext"
import { SerializerTester, TestData } from "@teawithsand/reserd"
import { describe, test } from "vitest"
import { AbookEntry } from "../entry"
import { AbookEntryDisposition } from "../entryData"
import { AbookEntrySourceType } from "../entrySource"
import { AbookEntryVersionedType } from "./abookEntryStored"

describe("AbookEntryVersionedType", () => {
	test("serialization and deserialization", () => {
		const testData = new AbookEntry({
			data: {
				createdAt: Timestamp.fromNumber(1641024000000),
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

		const serializedExample = {
			version: 1 as const,
			data: {
				data: {
					version: 1 as const,
					data: {
						createdAt: 1641024000000,
						disposition: "playable-audio",
						ordinalNumber: 1,
						source: {
							type: "upload",
							uploadedAt: 1641024000000,
							uploadFileName: "test-audio.mp3",
							uploadFileMime: "audio/mpeg",
						},
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
		}

		const testDataObj = TestData.createFromPairs([
			[serializedExample, testData],
		])

		const tester = new SerializerTester({
			testData: testDataObj,
			serializer: AbookEntryVersionedType.getUnknownSerializer(),
		})

		tester.runAllTests()
	})
})
