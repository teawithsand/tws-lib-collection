import { Timestamp } from "@teawithsand/lngext"
import { SimpleSerializedError } from "@teawithsand/reserd"
import { describe, expect, test } from "vitest"
import {
	AbookAggregateData,
	AbookData,
	AbookEntryDisposition,
	AbookEntrySourceType,
	BlobMetadataResultType,
} from "../../defines"
import { AbookEntry } from "../../defines/abookEntry/entry"
import { AbookAggregatorImpl } from "./abookAggregator"

describe("AbookAggregatorImpl", () => {
	const createMockAbookData = (entries: AbookEntry[]): AbookData => {
		const entriesMap = new Map<string, AbookEntry>()
		entries.forEach((entry, index) => {
			entriesMap.set(`entry_${index}`, entry)
		})

		return {
			header: {
				createdAt: Timestamp.fromNumber(Date.now()),
				metadata: {
					title: "Test Audiobook",
					description: "Test Description",
					privateUserNote: "Test Note",
				},
				position: null,
			},
			entries: entriesMap,
		}
	}

	const createMockEntry = (
		disposition: AbookEntryDisposition,
		audioDuration?: number,
		hasMetadata = true,
		metadataType: BlobMetadataResultType = BlobMetadataResultType.SUCCESS,
	): AbookEntry => {
		return new AbookEntry({
			data: {
				createdAt: Timestamp.fromNumber(Date.now()),
				name: "test-file.mp3",
				disposition,
				ordinalNumber: 1,
				source: {
					type: AbookEntrySourceType.UPLOAD,
					uploadedAt: Date.now(),
					uploadFileName: "test-file.mp3",
					uploadFileMime: "audio/mpeg",
				},
			},
			aggregate: {
				metadata: hasMetadata
					? {
							extractTimestamp: Timestamp.fromNumber(Date.now()),
							extractSource: {
								type: AbookEntrySourceType.UPLOAD,
							},
							metadata: {
								audio:
									metadataType ===
									BlobMetadataResultType.SUCCESS
										? {
												type: BlobMetadataResultType.SUCCESS,
												metadata: {
													duration:
														audioDuration ?? 1000,
												},
											}
										: {
												type: BlobMetadataResultType.ERROR,
												error: SimpleSerializedError.fromAny(
													"Metadata extraction failed",
												),
											},
								image: {
									type: BlobMetadataResultType.ERROR,
									error: SimpleSerializedError.fromAny(
										"Not an image",
									),
								},
							},
						}
					: null,
				blobSize: 1024,
			},
		})
	}

	test("create - creates a new instance", () => {
		// Arrange & Act
		const aggregator = AbookAggregatorImpl.create()

		// Assert
		expect(aggregator).toBeInstanceOf(AbookAggregatorImpl)
	})

	test("aggregate - returns correct data for empty abook", async () => {
		// Arrange
		const aggregator = AbookAggregatorImpl.create()
		const data = createMockAbookData([])

		// Act
		const result = await aggregator.aggregate(data)

		// Assert
		expect(result).toEqual<AbookAggregateData>({
			totalEntries: 0,
			totalDurationMillis: 0,
		})
	})

	test("aggregate - counts all entries regardless of disposition", async () => {
		// Arrange
		const aggregator = AbookAggregatorImpl.create()
		const entries = [
			createMockEntry(AbookEntryDisposition.PLAYABLE_AUDIO),
			createMockEntry(AbookEntryDisposition.COVER_IMAGE),
			createMockEntry(AbookEntryDisposition.PLAYABLE_AUDIO),
		]
		const data = createMockAbookData(entries)

		// Act
		const result = await aggregator.aggregate(data)

		// Assert
		expect(result.totalEntries).toBe(3)
	})

	test("aggregate - sums duration only for playable audio entries", async () => {
		// Arrange
		const aggregator = AbookAggregatorImpl.create()
		const entries = [
			createMockEntry(AbookEntryDisposition.PLAYABLE_AUDIO, 1000),
			createMockEntry(AbookEntryDisposition.COVER_IMAGE, 2000), // Should be ignored
			createMockEntry(AbookEntryDisposition.PLAYABLE_AUDIO, 3000),
		]
		const data = createMockAbookData(entries)

		// Act
		const result = await aggregator.aggregate(data)

		// Assert
		expect(result).toEqual<AbookAggregateData>({
			totalEntries: 3,
			totalDurationMillis: 4000, // 1000 + 3000
		})
	})

	test("aggregate - handles entries without metadata", async () => {
		// Arrange
		const aggregator = AbookAggregatorImpl.create()
		const entries = [
			createMockEntry(AbookEntryDisposition.PLAYABLE_AUDIO, 1000),
			createMockEntry(AbookEntryDisposition.PLAYABLE_AUDIO, 0, false), // No metadata
			createMockEntry(AbookEntryDisposition.PLAYABLE_AUDIO, 2000),
		]
		const data = createMockAbookData(entries)

		// Act
		const result = await aggregator.aggregate(data)

		// Assert
		expect(result).toEqual<AbookAggregateData>({
			totalEntries: 3,
			totalDurationMillis: 3000, // 1000 + 0 + 2000 (entry without metadata is skipped)
		})
	})

	test("aggregate - handles entries with metadata extraction errors", async () => {
		// Arrange
		const aggregator = AbookAggregatorImpl.create()
		const entries = [
			createMockEntry(AbookEntryDisposition.PLAYABLE_AUDIO, 1000),
			createMockEntry(
				AbookEntryDisposition.PLAYABLE_AUDIO,
				0,
				true,
				BlobMetadataResultType.ERROR,
			),
			createMockEntry(AbookEntryDisposition.PLAYABLE_AUDIO, 2000),
		]
		const data = createMockAbookData(entries)

		// Act
		const result = await aggregator.aggregate(data)

		// Assert
		expect(result).toEqual<AbookAggregateData>({
			totalEntries: 3,
			totalDurationMillis: 3000, // 1000 + 0 + 2000 (error entry is skipped)
		})
	})

	test("aggregate - returns -1 for invalid duration (NaN)", async () => {
		// Arrange
		const aggregator = AbookAggregatorImpl.create()
		const entries = [
			createMockEntry(AbookEntryDisposition.PLAYABLE_AUDIO, 1000),
			createMockEntry(AbookEntryDisposition.PLAYABLE_AUDIO, NaN),
		]
		const data = createMockAbookData(entries)

		// Act
		const result = await aggregator.aggregate(data)

		// Assert
		expect(result).toEqual<AbookAggregateData>({
			totalEntries: 2,
			totalDurationMillis: -1,
		})
	})

	test("aggregate - returns -1 for invalid duration (negative)", async () => {
		// Arrange
		const aggregator = AbookAggregatorImpl.create()
		const entries = [
			createMockEntry(AbookEntryDisposition.PLAYABLE_AUDIO, 1000),
			createMockEntry(AbookEntryDisposition.PLAYABLE_AUDIO, -500),
		]
		const data = createMockAbookData(entries)

		// Act
		const result = await aggregator.aggregate(data)

		// Assert
		expect(result).toEqual<AbookAggregateData>({
			totalEntries: 2,
			totalDurationMillis: -1,
		})
	})

	test("aggregate - returns -1 for invalid duration (Infinity)", async () => {
		// Arrange
		const aggregator = AbookAggregatorImpl.create()
		const entries = [
			createMockEntry(AbookEntryDisposition.PLAYABLE_AUDIO, 1000),
			createMockEntry(AbookEntryDisposition.PLAYABLE_AUDIO, Infinity),
		]
		const data = createMockAbookData(entries)

		// Act
		const result = await aggregator.aggregate(data)

		// Assert
		expect(result).toEqual<AbookAggregateData>({
			totalEntries: 2,
			totalDurationMillis: -1,
		})
	})

	test("aggregate - handles zero duration correctly", async () => {
		// Arrange
		const aggregator = AbookAggregatorImpl.create()
		const entries = [
			createMockEntry(AbookEntryDisposition.PLAYABLE_AUDIO, 1000),
			createMockEntry(AbookEntryDisposition.PLAYABLE_AUDIO, 0),
			createMockEntry(AbookEntryDisposition.PLAYABLE_AUDIO, 2000),
		]
		const data = createMockAbookData(entries)

		// Act
		const result = await aggregator.aggregate(data)

		// Assert
		expect(result).toEqual<AbookAggregateData>({
			totalEntries: 3,
			totalDurationMillis: 3000, // 1000 + 0 + 2000
		})
	})

	test("aggregate - handles undefined duration by using default 0", async () => {
		// Arrange
		const aggregator = AbookAggregatorImpl.create()
		const entry = new AbookEntry({
			data: {
				createdAt: Timestamp.fromNumber(Date.now()),
				name: "test-file.mp3",
				disposition: AbookEntryDisposition.PLAYABLE_AUDIO,
				ordinalNumber: 1,
				source: {
					type: AbookEntrySourceType.UPLOAD,
					uploadedAt: Date.now(),
					uploadFileName: "test-file.mp3",
					uploadFileMime: "audio/mpeg",
				},
			},
			aggregate: {
				metadata: {
					extractTimestamp: Timestamp.fromNumber(Date.now()),
					extractSource: {
						type: AbookEntrySourceType.UPLOAD,
					},
					metadata: {
						audio: {
							type: BlobMetadataResultType.SUCCESS,
							metadata: {
								duration: undefined as any, // Simulating undefined duration
							},
						},
						image: {
							type: BlobMetadataResultType.ERROR,
							error: SimpleSerializedError.fromAny(
								"Not an image",
							),
						},
					},
				},
				blobSize: 1024,
			},
		})
		const data = createMockAbookData([entry])

		// Act
		const result = await aggregator.aggregate(data)

		// Assert
		expect(result).toEqual<AbookAggregateData>({
			totalEntries: 1,
			totalDurationMillis: 0, // undefined becomes 0
		})
	})

	test("aggregate - stops aggregation at first invalid duration", async () => {
		// Arrange
		const aggregator = AbookAggregatorImpl.create()
		const entries = [
			createMockEntry(AbookEntryDisposition.PLAYABLE_AUDIO, 1000),
			createMockEntry(AbookEntryDisposition.PLAYABLE_AUDIO, -500), // Invalid
			createMockEntry(AbookEntryDisposition.PLAYABLE_AUDIO, 2000), // This should not be processed
		]
		const data = createMockAbookData(entries)

		// Act
		const result = await aggregator.aggregate(data)

		// Assert
		expect(result).toEqual<AbookAggregateData>({
			totalEntries: 3,
			totalDurationMillis: -1,
		})
	})

	test("aggregate - handles large audiobook with many entries", async () => {
		// Arrange
		const aggregator = AbookAggregatorImpl.create()
		const entries: AbookEntry[] = []
		const entriesCount = 100
		const durationPerEntry = 60000 // 1 minute per entry

		for (let i = 0; i < entriesCount; i++) {
			entries.push(
				createMockEntry(
					AbookEntryDisposition.PLAYABLE_AUDIO,
					durationPerEntry,
				),
			)
		}

		// Add some cover images that should not affect duration
		entries.push(createMockEntry(AbookEntryDisposition.COVER_IMAGE, 1000))
		entries.push(createMockEntry(AbookEntryDisposition.COVER_IMAGE, 2000))

		const data = createMockAbookData(entries)

		// Act
		const result = await aggregator.aggregate(data)

		// Assert
		expect(result).toEqual<AbookAggregateData>({
			totalEntries: 102, // 100 audio + 2 images
			totalDurationMillis: entriesCount * durationPerEntry, // 6,000,000ms = 100 minutes
		})
	})

	test("aggregate - handles mixed valid and invalid entries correctly", async () => {
		// Arrange
		const aggregator = AbookAggregatorImpl.create()
		const entries = [
			createMockEntry(AbookEntryDisposition.PLAYABLE_AUDIO, 1000),
			createMockEntry(AbookEntryDisposition.COVER_IMAGE, 500), // Ignored
			createMockEntry(AbookEntryDisposition.PLAYABLE_AUDIO, 2000),
			createMockEntry(AbookEntryDisposition.PLAYABLE_AUDIO, 0, false), // No metadata, ignored
			createMockEntry(
				AbookEntryDisposition.PLAYABLE_AUDIO,
				0,
				true,
				BlobMetadataResultType.ERROR,
			), // Error metadata, ignored
			createMockEntry(AbookEntryDisposition.PLAYABLE_AUDIO, 3000),
		]
		const data = createMockAbookData(entries)

		// Act
		const result = await aggregator.aggregate(data)

		// Assert
		expect(result).toEqual<AbookAggregateData>({
			totalEntries: 6,
			totalDurationMillis: 6000, // 1000 + 2000 + 3000
		})
	})
})
