import { beforeEach, describe, expect, test } from "vitest"
import { RAW_10S_AUDIO, RAW_1S_AUDIO } from "../audio.test"
import { BlobMetadataResultType } from "../defines"
import { BlobMetadataExtractorImpl } from "./extractorImpl"

const AUDIO_BAD_URL = `data:audio/webm;base64,Z2FyYmFnZQo=`
const AUDIO_10S_URL = `data:audio/webm;base64,${RAW_10S_AUDIO}`
const AUDIO_1S_URL = `data:audio/webm;base64,${RAW_1S_AUDIO}`

describe("BlobMetadataExtractorImpl", () => {
	let extractor: BlobMetadataExtractorImpl

	beforeEach(() => {
		extractor = new BlobMetadataExtractorImpl()
	})

	describe("extractFromUrl", () => {
		test("should extract metadata from a valid image URL", async () => {
			// Create a simple 1x1 pixel PNG data URL
			const imageDataUrl =
				"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

			const metadata = await extractor.extractFromUrl(imageDataUrl)

			expect(metadata.image.type).toBe(BlobMetadataResultType.SUCCESS)
			if (metadata.image.type === BlobMetadataResultType.SUCCESS) {
				const imageMetadata = metadata.image.metadata
				expect(imageMetadata.width).toBe(1)
				expect(imageMetadata.height).toBe(1)
			}

			// Audio should fail for image URL
			expect(metadata.audio.type).toBe(BlobMetadataResultType.ERROR)
		})

		test("should handle invalid image URL gracefully", async () => {
			const invalidUrl = "data:text/plain;base64,aGVsbG8="

			const metadata = await extractor.extractFromUrl(invalidUrl)

			expect(metadata.image.type).toBe(BlobMetadataResultType.ERROR)
			if (metadata.image.type === BlobMetadataResultType.ERROR) {
				expect(metadata.image.error.message).toContain(
					"Failed to load image",
				)
				expect(metadata.image.error.name).toBe("ImageLoadError")
			}

			expect(metadata.audio.type).toBe(BlobMetadataResultType.ERROR)
		})

		test("should extract metadata from a valid audio URL", async () => {
			const metadata = await extractor.extractFromUrl(AUDIO_1S_URL)

			expect(metadata.image.type).toBe(BlobMetadataResultType.ERROR)

			expect(metadata.audio.type).toBe(BlobMetadataResultType.SUCCESS)
			if (metadata.audio.type === BlobMetadataResultType.SUCCESS) {
				const audioMetadata = metadata.audio.metadata
				expect(typeof audioMetadata.duration).toBe("number")
				expect(audioMetadata.duration).toBeGreaterThan(0)
				expect(audioMetadata.duration).toBeLessThan(2000)
				expect(isFinite(audioMetadata.duration)).toBe(true)
			}
		})

		test("should extract metadata from a longer audio file", async () => {
			const metadata = await extractor.extractFromUrl(AUDIO_10S_URL)

			expect(metadata.image.type).toBe(BlobMetadataResultType.ERROR)

			expect(metadata.audio.type).toBe(BlobMetadataResultType.SUCCESS)
			if (metadata.audio.type === BlobMetadataResultType.SUCCESS) {
				const audioMetadata = metadata.audio.metadata
				expect(typeof audioMetadata.duration).toBe("number")
				expect(audioMetadata.duration).toBeGreaterThan(8000)
				expect(audioMetadata.duration).toBeLessThan(12000)
				expect(isFinite(audioMetadata.duration)).toBe(true)
			}
		})

		test("should handle invalid audio URL gracefully", async () => {
			const metadata = await extractor.extractFromUrl(AUDIO_BAD_URL)

			expect(metadata.image.type).toBe(BlobMetadataResultType.ERROR)
			expect(metadata.audio.type).toBe(BlobMetadataResultType.ERROR)
			if (metadata.audio.type === BlobMetadataResultType.ERROR) {
				expect(metadata.audio.error.name).toBe(
					"AudioDurationExtractionError",
				)
			}
		})

		test("should handle completely invalid URL gracefully", async () => {
			const invalidUrl = "not-a-valid-url"

			const metadata = await extractor.extractFromUrl(invalidUrl)

			expect(metadata.image.type).toBe(BlobMetadataResultType.ERROR)
			if (metadata.image.type === BlobMetadataResultType.ERROR) {
				expect(metadata.image.error.name).toBe("ImageLoadError")
			}

			expect(metadata.audio.type).toBe(BlobMetadataResultType.ERROR)
			if (metadata.audio.type === BlobMetadataResultType.ERROR) {
				expect(metadata.audio.error.name).toBe(
					"AudioDurationExtractionError",
				)
			}
		})

		test("should handle empty URL gracefully", async () => {
			const emptyUrl = ""

			const metadata = await extractor.extractFromUrl(emptyUrl)

			expect(metadata.image.type).toBe(BlobMetadataResultType.ERROR)
			if (metadata.image.type === BlobMetadataResultType.ERROR) {
				expect(metadata.image.error.name).toBe("ImageLoadError")
			}

			expect(metadata.audio.type).toBe(BlobMetadataResultType.ERROR)
			if (metadata.audio.type === BlobMetadataResultType.ERROR) {
				expect(metadata.audio.error.name).toBe(
					"AudioDurationExtractionError",
				)
			}
		})
	})

	describe("extractFromBlob", () => {
		test("should extract metadata from image blob", async () => {
			// Create a simple PNG blob
			const canvas = document.createElement("canvas")
			canvas.width = 100
			canvas.height = 200
			const ctx = canvas.getContext("2d")!
			ctx.fillStyle = "red"
			ctx.fillRect(0, 0, 100, 200)

			const blob = await new Promise<Blob>((resolve) => {
				canvas.toBlob((blob) => {
					resolve(blob!)
				}, "image/png")
			})

			const metadata = await extractor.extractFromBlob(blob)

			expect(metadata.image.type).toBe(BlobMetadataResultType.SUCCESS)
			if (metadata.image.type === BlobMetadataResultType.SUCCESS) {
				const imageMetadata = metadata.image.metadata
				expect(imageMetadata.width).toBe(100)
				expect(imageMetadata.height).toBe(200)
			}

			// Audio should fail for image blob
			expect(metadata.audio.type).toBe(BlobMetadataResultType.ERROR)
		})

		test("should extract metadata from audio blob", async () => {
			// Convert the base64 audio data to a blob
			const binaryString = atob(RAW_1S_AUDIO)
			const bytes = new Uint8Array(binaryString.length)
			for (let i = 0; i < binaryString.length; i++) {
				bytes[i] = binaryString.charCodeAt(i)
			}
			const audioBlob = new Blob([bytes], { type: "audio/webm" })

			const metadata = await extractor.extractFromBlob(audioBlob)

			expect(metadata.image.type).toBe(BlobMetadataResultType.ERROR)

			expect(metadata.audio.type).toBe(BlobMetadataResultType.SUCCESS)
			if (metadata.audio.type === BlobMetadataResultType.SUCCESS) {
				const audioMetadata = metadata.audio.metadata
				expect(typeof audioMetadata.duration).toBe("number")
				expect(audioMetadata.duration).toBeGreaterThan(750)
				expect(audioMetadata.duration).toBeLessThan(1250)
				expect(isFinite(audioMetadata.duration)).toBe(true)
			}
		})

		test("should handle invalid blob gracefully", async () => {
			const textBlob = new Blob(["hello world"], { type: "text/plain" })

			const metadata = await extractor.extractFromBlob(textBlob)

			expect(metadata.image.type).toBe(BlobMetadataResultType.ERROR)
			if (metadata.image.type === BlobMetadataResultType.ERROR) {
				expect(metadata.image.error.name).toBe("ImageLoadError")
			}

			expect(metadata.audio.type).toBe(BlobMetadataResultType.ERROR)
			if (metadata.audio.type === BlobMetadataResultType.ERROR) {
				expect(metadata.audio.error.name).toBe(
					"AudioDurationExtractionError",
				)
			}
		})

		test("should handle empty blob gracefully", async () => {
			const emptyBlob = new Blob([])

			const metadata = await extractor.extractFromBlob(emptyBlob)

			expect(metadata.image.type).toBe(BlobMetadataResultType.ERROR)
			if (metadata.image.type === BlobMetadataResultType.ERROR) {
				expect(metadata.image.error.name).toBe("ImageLoadError")
			}

			expect(metadata.audio.type).toBe(BlobMetadataResultType.ERROR)
			if (metadata.audio.type === BlobMetadataResultType.ERROR) {
				expect(metadata.audio.error.name).toBe(
					"AudioDurationExtractionError",
				)
			}
		})
	})

	describe("edge cases and error handling", () => {
		test("should handle large image dimensions", async () => {
			const canvas = document.createElement("canvas")
			canvas.width = 5000
			canvas.height = 3000

			const blob = await new Promise<Blob>((resolve) => {
				canvas.toBlob((blob) => {
					resolve(blob!)
				}, "image/png")
			})

			const metadata = await extractor.extractFromBlob(blob)

			expect(metadata.image.type).toBe(BlobMetadataResultType.SUCCESS)
			if (metadata.image.type === BlobMetadataResultType.SUCCESS) {
				const imageMetadata = metadata.image.metadata
				expect(imageMetadata.width).toBe(5000)
				expect(imageMetadata.height).toBe(3000)
			}
		})

		test("should handle zero-sized image", async () => {
			const canvas = document.createElement("canvas")
			canvas.width = 0
			canvas.height = 0

			const blob = await new Promise<Blob>((resolve) => {
				canvas.toBlob((blob) => {
					// Canvas.toBlob might return null for zero-sized canvas
					if (blob) {
						resolve(blob)
					} else {
						// Create a minimal valid blob if canvas.toBlob returns null
						resolve(new Blob([], { type: "image/png" }))
					}
				}, "image/png")
			})

			const metadata = await extractor.extractFromBlob(blob)

			// Zero-sized images should result in error or success with 0 dimensions
			if (metadata.image.type === BlobMetadataResultType.SUCCESS) {
				const imageMetadata = metadata.image.metadata
				expect(imageMetadata.width).toBe(0)
				expect(imageMetadata.height).toBe(0)
			} else {
				// It's also acceptable for zero-sized images to fail
				expect(metadata.image.type).toBe(BlobMetadataResultType.ERROR)
			}
		})

		test("should handle concurrent extraction requests", async () => {
			const imageDataUrl =
				"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

			const promises = [
				extractor.extractFromUrl(imageDataUrl),
				extractor.extractFromUrl(AUDIO_1S_URL),
				extractor.extractFromUrl(imageDataUrl),
				extractor.extractFromUrl(AUDIO_10S_URL),
				extractor.extractFromUrl(imageDataUrl),
			]

			const results = await Promise.all(promises)

			// Check image results (indices 0, 2, 4)
			;[0, 2, 4].forEach((index) => {
				const metadata = results[index]!
				expect(metadata.image.type).toBe(BlobMetadataResultType.SUCCESS)
				if (metadata.image.type === BlobMetadataResultType.SUCCESS) {
					expect(metadata.image.metadata.width).toBe(1)
					expect(metadata.image.metadata.height).toBe(1)
				}
				expect(metadata.audio.type).toBe(BlobMetadataResultType.ERROR)
			})

			// Check audio results (indices 1, 3)
			;[1, 3].forEach((index) => {
				const metadata = results[index]!
				expect(metadata.image.type).toBe(BlobMetadataResultType.ERROR)
				expect(metadata.audio.type).toBe(BlobMetadataResultType.SUCCESS)
				if (metadata.audio.type === BlobMetadataResultType.SUCCESS) {
					expect(metadata.audio.metadata.duration).toBeGreaterThan(0)
				}
			})
		})
	})
})
