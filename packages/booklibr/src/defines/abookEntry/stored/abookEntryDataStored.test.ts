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
			expect(AbookEntryDispositionStoredV1.DESCRIPTION).toBe(
				"description",
			)
			expect(AbookEntryDispositionStoredV1.UNKNOWN).toBe("unknown")
		})

		test("AbookEntryDispositionStoredV1 should have exactly the expected keys", () => {
			const keys = Object.keys(AbookEntryDispositionStoredV1).sort()
			expect(keys).toEqual([
				"COVER_IMAGE",
				"DESCRIPTION",
				"PLAYABLE_AUDIO",
				"UNKNOWN",
			])
		})
	})

	test("should serialize and deserialize correctly", () => {
		const testData: AbookEntryData = {
			createdAt: Timestamp.fromNumber(1641024000000), // 2022-01-01T12:00:00.000Z
			name: "Test Audio Entry",
			disposition: AbookEntryDisposition.PLAYABLE_AUDIO,
			source: {
				type: AbookEntrySourceType.UPLOAD,
				uploadedAt: 1641024000000,
				uploadFileName: "test-audio.mp3",
				uploadFileMime: "audio/mpeg",
			},
			ordinalNumber: 1,
		}

		const serializedExamples = [
			{
				version: 1 as const,
				data: {
					createdAt: 1641024000000,
					name: "Test Audio Entry",
					disposition: "playable-audio",
					source: {
						type: "upload",
						uploadedAt: 1641024000000,
						uploadFileName: "test-audio.mp3",
						uploadFileMime: "audio/mpeg",
					},
					ordinalNumber: 1,
				},
			},
			{
				version: 1 as const,
				data: {
					createdAt: 1609459200000, // 2021-01-01T00:00:00.000Z
					name: "Cover Image",
					disposition: "cover-image",
					source: {
						type: "url",
						url: "https://example.com/cover.jpg",
					},
					ordinalNumber: 2,
				},
			},
			{
				version: 1 as const,
				data: {
					createdAt: 1672531200000, // 2023-01-01T00:00:00.000Z
					name: "Chapter 1",
					disposition: "playable-audio",
					source: {
						type: "upload",
						uploadedAt: 1672531200000,
						uploadFileName: "book-chapter-1.m4a",
						uploadFileMime: "audio/mp4",
					},
					ordinalNumber: 3,
				},
			},
			{
				version: 1 as const,
				data: {
					createdAt: 1672531200000, // 2023-01-01T00:00:00.000Z
					name: "Book Description",
					disposition: "description",
					source: {
						type: "upload",
						uploadedAt: 1672531200000,
						uploadFileName: "book-description.txt",
						uploadFileMime: "text/plain",
					},
					ordinalNumber: 4,
				},
			},
			{
				version: 1 as const,
				data: {
					createdAt: 1672531200000, // 2023-01-01T00:00:00.000Z
					name: "Unknown File",
					disposition: "unknown",
					source: {
						type: "url",
						url: "https://example.com/unknown-file.dat",
					},
					ordinalNumber: 5,
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

	test("should serialize and deserialize DESCRIPTION disposition correctly", () => {
		const testData: AbookEntryData = {
			createdAt: Timestamp.fromNumber(1672531200000), // 2023-01-01T00:00:00.000Z
			name: "Book Description",
			disposition: AbookEntryDisposition.DESCRIPTION,
			source: {
				type: AbookEntrySourceType.UPLOAD,
				uploadedAt: 1672531200000,
				uploadFileName: "book-description.txt",
				uploadFileMime: "text/plain",
			},
			ordinalNumber: 4,
		}

		const serialized = AbookEntryDataVersionedType.serialize(testData)
		const deserialized =
			AbookEntryDataVersionedType.getUnknownSerializer().deserialize(
				serialized,
			)

		expect(serialized.data.disposition).toBe("description")
		expect(deserialized.disposition).toBe(AbookEntryDisposition.DESCRIPTION)
		expect(deserialized.createdAt.toNumberMillis()).toBe(
			testData.createdAt.toNumberMillis(),
		)
		expect(deserialized.source).toEqual(testData.source)
	})

	test("should serialize and deserialize UNKNOWN disposition correctly", () => {
		const testData: AbookEntryData = {
			createdAt: Timestamp.fromNumber(1672531200000), // 2023-01-01T00:00:00.000Z
			name: "Unknown File",
			disposition: AbookEntryDisposition.UNKNOWN,
			source: {
				type: AbookEntrySourceType.URL,
				url: "https://example.com/unknown-file.dat",
			},
			ordinalNumber: 5,
		}

		const serialized = AbookEntryDataVersionedType.serialize(testData)
		const deserialized =
			AbookEntryDataVersionedType.getUnknownSerializer().deserialize(
				serialized,
			)

		expect(serialized.data.disposition).toBe("unknown")
		expect(deserialized.disposition).toBe(AbookEntryDisposition.UNKNOWN)
		expect(deserialized.createdAt.toNumberMillis()).toBe(
			testData.createdAt.toNumberMillis(),
		)
		expect(deserialized.source).toEqual(testData.source)
	})
})
