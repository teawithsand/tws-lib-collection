import { Clock, Timestamp } from "@teawithsand/lngext"
import { SimpleSerializedError } from "@teawithsand/reserd"
import { describe, expect, test, vi } from "vitest"
import {
	AbookEntryData,
	AbookEntryDisposition,
	AbookEntrySourceType,
	BlobMetadata,
	BlobMetadataExtractor,
	BlobMetadataResultType,
} from "../../defines"
import { AbookEntrySourceUtil } from "../../defines/abookEntry/entrySource"
import { AbookEntryAggregatorImpl } from "./abookEntryAggregator"

describe("AbookEntryAggregatorImpl", () => {
	const createMockClock = (timestamp: number = Date.now()): Clock => {
		return {
			getNow: vi.fn().mockReturnValue(Timestamp.fromNumber(timestamp)),
		}
	}

	const createMockExtractor = (
		returnValue: BlobMetadata,
	): BlobMetadataExtractor => {
		return {
			extractFromUrl: vi.fn().mockResolvedValue(returnValue),
			extractFromBlob: vi.fn().mockResolvedValue(returnValue),
		}
	}

	const createMockAbookEntryData = (
		disposition: AbookEntryDisposition = AbookEntryDisposition.PLAYABLE_AUDIO,
		sourceType: AbookEntrySourceType = AbookEntrySourceType.UPLOAD,
	): AbookEntryData => {
		const baseData = {
			createdAt: Timestamp.fromNumber(Date.now()),
			disposition,
			ordinalNumber: 1,
		}

		if (sourceType === AbookEntrySourceType.UPLOAD) {
			return {
				...baseData,
				source: {
					type: AbookEntrySourceType.UPLOAD,
					uploadedAt: Date.now(),
					uploadFileName: "test-file.mp3",
					uploadFileMime: "audio/mpeg",
				},
			}
		} else {
			return {
				...baseData,
				source: {
					type: AbookEntrySourceType.URL,
					url: "https://example.com/audio.mp3",
				},
			}
		}
	}

	const createMockBlob = (size: number = 1024): Blob => {
		const data = new Uint8Array(size)
		return new Blob([data], { type: "audio/mpeg" })
	}

	const createSuccessfulBlobMetadata = (): BlobMetadata => {
		return {
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
					duration: 180.5,
				},
			},
		}
	}

	const createErrorBlobMetadata = (): BlobMetadata => {
		return {
			image: {
				type: BlobMetadataResultType.ERROR,
				error: SimpleSerializedError.fromAny(
					new Error("Failed to load image"),
				),
			},
			audio: {
				type: BlobMetadataResultType.ERROR,
				error: SimpleSerializedError.fromAny(
					new Error("Failed to extract audio duration"),
				),
			},
		}
	}

	describe("constructor", () => {
		test("should create instance with provided extractor", () => {
			const mockExtractor = createMockExtractor(
				createSuccessfulBlobMetadata(),
			)
			const mockClock = createMockClock()
			const aggregator = new AbookEntryAggregatorImpl({
				metadataExtractor: mockExtractor,
				clock: mockClock,
			})

			expect(aggregator).toBeInstanceOf(AbookEntryAggregatorImpl)
		})

		test("should create instance with default clock when not provided", () => {
			const mockExtractor = createMockExtractor(
				createSuccessfulBlobMetadata(),
			)
			const aggregator = new AbookEntryAggregatorImpl({
				metadataExtractor: mockExtractor,
			})

			expect(aggregator).toBeInstanceOf(AbookEntryAggregatorImpl)
		})
	})

	describe("create", () => {
		test("should create instance with default BlobMetadataExtractorImpl", () => {
			const aggregator = AbookEntryAggregatorImpl.create()

			expect(aggregator).toBeInstanceOf(AbookEntryAggregatorImpl)
		})
	})

	describe("aggregate", () => {
		test("should aggregate entry data with successful metadata extraction", async () => {
			// Arrange
			const mockBlobMetadata = createSuccessfulBlobMetadata()
			const mockExtractor = createMockExtractor(mockBlobMetadata)
			const aggregator = new AbookEntryAggregatorImpl({
				metadataExtractor: mockExtractor,
			})
			const entryData = createMockAbookEntryData()
			const blob = createMockBlob(2048)

			// Act
			const result = await aggregator.aggregate(entryData, blob)

			// Assert
			expect(mockExtractor.extractFromBlob).toHaveBeenCalledWith(blob)
			expect(result).toEqual({
				metadata: {
					extractTimestamp: expect.any(Timestamp),
					extractSource: AbookEntrySourceUtil.toLite(
						entryData.source,
					),
					metadata: mockBlobMetadata,
				},
				blobSize: 2048,
			})
		})

		test("should handle different entry dispositions", async () => {
			// Arrange
			const mockBlobMetadata = createSuccessfulBlobMetadata()
			const mockExtractor = createMockExtractor(mockBlobMetadata)
			const aggregator = new AbookEntryAggregatorImpl({
				metadataExtractor: mockExtractor,
			})
			const entryData = createMockAbookEntryData(
				AbookEntryDisposition.COVER_IMAGE,
			)
			const blob = createMockBlob()

			// Act
			const result = await aggregator.aggregate(entryData, blob)

			// Assert
			expect(result.metadata?.extractSource).toEqual(
				AbookEntrySourceUtil.toLite(entryData.source),
			)
			expect(result.metadata?.metadata).toEqual(mockBlobMetadata)
		})

		test("should handle upload source type correctly", async () => {
			// Arrange
			const mockBlobMetadata = createSuccessfulBlobMetadata()
			const mockExtractor = createMockExtractor(mockBlobMetadata)
			const aggregator = new AbookEntryAggregatorImpl({
				metadataExtractor: mockExtractor,
			})
			const entryData = createMockAbookEntryData(
				AbookEntryDisposition.PLAYABLE_AUDIO,
				AbookEntrySourceType.UPLOAD,
			)
			const blob = createMockBlob()

			// Act
			const result = await aggregator.aggregate(entryData, blob)

			// Assert
			expect(result.metadata?.extractSource).toEqual({
				type: AbookEntrySourceType.UPLOAD,
			})
		})

		test("should handle URL source type correctly", async () => {
			// Arrange
			const mockBlobMetadata = createSuccessfulBlobMetadata()
			const mockExtractor = createMockExtractor(mockBlobMetadata)
			const aggregator = new AbookEntryAggregatorImpl({
				metadataExtractor: mockExtractor,
			})
			const entryData = createMockAbookEntryData(
				AbookEntryDisposition.PLAYABLE_AUDIO,
				AbookEntrySourceType.URL,
			)
			const blob = createMockBlob()

			// Act
			const result = await aggregator.aggregate(entryData, blob)

			// Assert
			expect(result.metadata?.extractSource).toEqual({
				type: AbookEntrySourceType.URL,
				url: "https://example.com/audio.mp3",
			})
		})

		test("should preserve blob size in result", async () => {
			// Arrange
			const mockBlobMetadata = createSuccessfulBlobMetadata()
			const mockExtractor = createMockExtractor(mockBlobMetadata)
			const aggregator = new AbookEntryAggregatorImpl({
				metadataExtractor: mockExtractor,
			})
			const entryData = createMockAbookEntryData()
			const blob = createMockBlob(4096)

			// Act
			const result = await aggregator.aggregate(entryData, blob)

			// Assert
			expect(result.blobSize).toBe(4096)
		})

		test("should handle metadata extraction with errors", async () => {
			// Arrange
			const mockBlobMetadata = createErrorBlobMetadata()
			const mockExtractor = createMockExtractor(mockBlobMetadata)
			const aggregator = new AbookEntryAggregatorImpl({
				metadataExtractor: mockExtractor,
			})
			const entryData = createMockAbookEntryData()
			const blob = createMockBlob()

			// Act
			const result = await aggregator.aggregate(entryData, blob)

			// Assert
			expect(result.metadata?.metadata).toEqual(mockBlobMetadata)
			expect(result.blobSize).toBe(1024)
		})

		test("should handle empty blob", async () => {
			// Arrange
			const mockBlobMetadata = createSuccessfulBlobMetadata()
			const mockExtractor = createMockExtractor(mockBlobMetadata)
			const aggregator = new AbookEntryAggregatorImpl({
				metadataExtractor: mockExtractor,
			})
			const entryData = createMockAbookEntryData()
			const blob = createMockBlob(0)

			// Act
			const result = await aggregator.aggregate(entryData, blob)

			// Assert
			expect(result.blobSize).toBe(0)
			expect(result.metadata?.metadata).toEqual(mockBlobMetadata)
		})

		test("should call extractor with correct blob", async () => {
			// Arrange
			const mockBlobMetadata = createSuccessfulBlobMetadata()
			const mockExtractor = createMockExtractor(mockBlobMetadata)
			const aggregator = new AbookEntryAggregatorImpl({
				metadataExtractor: mockExtractor,
			})
			const entryData = createMockAbookEntryData()
			const blob = createMockBlob()

			// Act
			await aggregator.aggregate(entryData, blob)

			// Assert
			expect(mockExtractor.extractFromBlob).toHaveBeenCalledTimes(1)
			expect(mockExtractor.extractFromBlob).toHaveBeenCalledWith(blob)
		})

		test("should create timestamp correctly", async () => {
			// Arrange
			const mockBlobMetadata = createSuccessfulBlobMetadata()
			const mockExtractor = createMockExtractor(mockBlobMetadata)
			const aggregator = new AbookEntryAggregatorImpl({
				metadataExtractor: mockExtractor,
			})
			const entryData = createMockAbookEntryData()
			const blob = createMockBlob()
			const beforeTime = Date.now()

			// Act
			const result = await aggregator.aggregate(entryData, blob)
			const afterTime = Date.now()

			// Assert
			expect(result.metadata?.extractTimestamp).toBeInstanceOf(Timestamp)
			const timestampValue =
				result.metadata!.extractTimestamp.toNumberMillis()
			expect(timestampValue).toBeGreaterThanOrEqual(beforeTime)
			expect(timestampValue).toBeLessThanOrEqual(afterTime)
		})

		test("should use provided clock for timestamp creation", async () => {
			// Arrange
			const mockBlobMetadata = createSuccessfulBlobMetadata()
			const mockExtractor = createMockExtractor(mockBlobMetadata)
			const fixedTimestamp = 1234567890000
			const mockClock = createMockClock(fixedTimestamp)
			const aggregator = new AbookEntryAggregatorImpl({
				metadataExtractor: mockExtractor,
				clock: mockClock,
			})
			const entryData = createMockAbookEntryData()
			const blob = createMockBlob()

			// Act
			const result = await aggregator.aggregate(entryData, blob)

			// Assert
			expect(mockClock.getNow).toHaveBeenCalledTimes(1)
			expect(result.metadata?.extractTimestamp.toNumberMillis()).toBe(
				fixedTimestamp,
			)
		})

		test("should handle mixed metadata results", async () => {
			// Arrange
			const mockBlobMetadata: BlobMetadata = {
				image: {
					type: BlobMetadataResultType.SUCCESS,
					metadata: {
						width: 800,
						height: 600,
					},
				},
				audio: {
					type: BlobMetadataResultType.ERROR,
					error: SimpleSerializedError.fromAny(
						new Error("No audio track found"),
					),
				},
			}
			const mockExtractor = createMockExtractor(mockBlobMetadata)
			const aggregator = new AbookEntryAggregatorImpl({
				metadataExtractor: mockExtractor,
			})
			const entryData = createMockAbookEntryData()
			const blob = createMockBlob()

			// Act
			const result = await aggregator.aggregate(entryData, blob)

			// Assert
			expect(result.metadata?.metadata.image.type).toBe(
				BlobMetadataResultType.SUCCESS,
			)
			expect(result.metadata?.metadata.audio.type).toBe(
				BlobMetadataResultType.ERROR,
			)
		})

		test("should work with large blobs", async () => {
			// Arrange
			const mockBlobMetadata = createSuccessfulBlobMetadata()
			const mockExtractor = createMockExtractor(mockBlobMetadata)
			const aggregator = new AbookEntryAggregatorImpl({
				metadataExtractor: mockExtractor,
			})
			const entryData = createMockAbookEntryData()
			const largeBlobSize = 50 * 1024 * 1024 // 50MB
			const blob = createMockBlob(largeBlobSize)

			// Act
			const result = await aggregator.aggregate(entryData, blob)

			// Assert
			expect(result.blobSize).toBe(largeBlobSize)
			expect(result.metadata?.metadata).toEqual(mockBlobMetadata)
		})

		test("should handle concurrent aggregation calls", async () => {
			// Arrange
			const mockBlobMetadata = createSuccessfulBlobMetadata()
			const mockExtractor = createMockExtractor(mockBlobMetadata)
			const aggregator = new AbookEntryAggregatorImpl({
				metadataExtractor: mockExtractor,
			})
			const entryData1 = createMockAbookEntryData()
			const entryData2 = createMockAbookEntryData()
			const blob1 = createMockBlob(1024)
			const blob2 = createMockBlob(2048)

			// Act
			const [result1, result2] = await Promise.all([
				aggregator.aggregate(entryData1, blob1),
				aggregator.aggregate(entryData2, blob2),
			])

			// Assert
			expect(result1.blobSize).toBe(1024)
			expect(result2.blobSize).toBe(2048)
			expect(mockExtractor.extractFromBlob).toHaveBeenCalledTimes(2)
		})
	})
})
