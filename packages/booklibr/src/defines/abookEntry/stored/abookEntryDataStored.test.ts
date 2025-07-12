import { Timestamp } from "@teawithsand/lngext"
import { SerializerTester, TestData } from "@teawithsand/reserd"
import { describe, expect, test } from "vitest"
import { AbookEntryData, AbookEntryDisposition } from "../entryData"
import { AbookEntrySourceType } from "../entrySource"
import {
	AbookEntryDataVersionedType,
	AbookEntryDispositionStoredV1,
} from "./abookEntryDataStored"

describe("AbookEntryData versioned serialization", () => {
	describe("enum stability", () => {
		test("AbookEntryDispositionStoredV1 values should not change", () => {
			// These values are used in serialized data and must never change
			expect(AbookEntryDispositionStoredV1.PLAYABLE_AUDIO).toBe(
				"playable-audio",
			)
			expect(AbookEntryDispositionStoredV1.COVER_IMAGE).toBe(
				"cover-image",
			)
		})

		test("AbookEntryDispositionStoredV1 should have exactly the expected keys", () => {
			const keys = Object.keys(AbookEntryDispositionStoredV1).sort()
			expect(keys).toEqual(["COVER_IMAGE", "PLAYABLE_AUDIO"])
		})
	})

	test("should serialize and deserialize correctly", () => {
		const testData: AbookEntryData = {
			createdAt: Timestamp.fromNumber(1641024000000), // 2022-01-01T12:00:00.000Z
			disposition: AbookEntryDisposition.PLAYABLE_AUDIO,
			source: {
				type: AbookEntrySourceType.UPLOAD,
				uploadedAt: 1641024000000,
				uploadFileName: "test-audio.mp3",
				uploadFileMime: "audio/mpeg",
			},
		}

		const serializedExamples = [
			{
				version: 1 as const,
				data: {
					createdAt: 1641024000000,
					disposition: "playable-audio",
					source: {
						type: "upload",
						uploadedAt: 1641024000000,
						uploadFileName: "test-audio.mp3",
						uploadFileMime: "audio/mpeg",
					},
				},
			},
			{
				version: 1 as const,
				data: {
					createdAt: 1609459200000, // 2021-01-01T00:00:00.000Z
					disposition: "cover-image",
					source: {
						type: "url",
						url: "https://example.com/cover.jpg",
					},
				},
			},
			{
				version: 1 as const,
				data: {
					createdAt: 1672531200000, // 2023-01-01T00:00:00.000Z
					disposition: "playable-audio",
					source: {
						type: "upload",
						uploadedAt: 1672531200000,
						uploadFileName: "book-chapter-1.m4a",
						uploadFileMime: "audio/mp4",
					},
				},
			},
		]

		const testDataObj = TestData.createFromPairs([
			[serializedExamples[0], testData],
		])

		const tester = new SerializerTester({
			testData: testDataObj,
			serializer: AbookEntryDataVersionedType.getUnknownSerializer(),
		})

		tester.runAllTests()
	})
})
