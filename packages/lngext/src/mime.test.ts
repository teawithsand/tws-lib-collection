import { describe, expect, test } from "vitest"
import { Mime, MimeError } from "./mime"

/**
 * Unit tests for the Mime class.
 */
describe("Mime", () => {
	// --- fromString ---
	test("fromString returns correct Mime for valid input", () => {
		const mime = Mime.fromString("image/png")
		expect(mime.major).toBe("image")
		expect(mime.minor).toBe("png")
		// Should be equal to static PNG
		expect(mime.equals(Mime.PNG)).toBe(true)
	})

	test("fromString throws on invalid format (no slash)", () => {
		expect(() => Mime.fromString("imagepng")).toThrow(MimeError)
	})

	test("fromString throws on invalid major/minor", () => {
		expect(() => Mime.fromString("image/123")).toThrow(MimeError)
		expect(() => Mime.fromString("123/png")).toThrow(MimeError)
	})

	// --- fromExtension ---
	test("fromExtension returns correct Mime for known extension", () => {
		const mime = Mime.fromExtension("png")
		expect(mime).not.toBeNull()
		expect(mime?.major).toBe("image")
		expect(mime?.minor).toBe("png")
	})

	test("fromExtension returns null for unknown extension", () => {
		expect(Mime.fromExtension("unknownext")).toBeNull()
	})

	test("fromExtension handles dot prefix", () => {
		const mime = Mime.fromExtension(".jpg")
		expect(mime).not.toBeNull()
		expect(mime?.major).toBe("image")
		expect(mime?.minor).toBe("jpeg")
	})

	// --- fromFileName ---
	test("fromFileName returns correct Mime for file with extension", () => {
		const mime = Mime.fromFileName("file.png")
		expect(mime).not.toBeNull()
		expect(mime?.major).toBe("image")
		expect(mime?.minor).toBe("png")
	})

	test("fromFileName returns null for file with unknown extension", () => {
		expect(Mime.fromFileName("file.unknownext")).toBeNull()
	})

	test("fromFileName handles files with multiple dots", () => {
		const mime = Mime.fromFileName("archive.tar.gz")
		expect(mime).toBeNull() // "tar.gz" is not in the map
	})

	// --- equals ---
	test("equals returns true for identical Mime", () => {
		const a = Mime.fromString("image/png")
		const b = Mime.fromString("image/png")
		expect(a.equals(b)).toBe(true)
	})

	test("equals returns false for different Mime", () => {
		const a = Mime.fromString("image/png")
		const b = Mime.fromString("image/jpeg")
		expect(a.equals(b)).toBe(false)
	})

	// --- toString ---
	test("toString returns correct mime string", () => {
		const mime = Mime.fromString("image/png")
		expect(mime.toString()).toBe("image/png")
	})

	// --- static constants ---
	test("static constants are correct", () => {
		expect(Mime.PNG.toString()).toBe("image/png")
		expect(Mime.JPEG.toString()).toBe("image/jpeg")
		expect(Mime.GIF.toString()).toBe("image/gif")
		expect(Mime.WEBP.toString()).toBe("image/webp")
		expect(Mime.AVIF.toString()).toBe("image/avif")
		expect(Mime.MP3.toString()).toBe("audio/mpeg")
		expect(Mime.OGG.toString()).toBe("audio/ogg")
		expect(Mime.BINARY.toString()).toBe("application/binary")
		expect(Mime.TEXT.toString()).toBe("text/plain")
	})
})
