import { describe, expect, test } from "vitest"
import { FsErrorNotFound } from "../../defines/error"
import { FsWriteMode } from "../../defines/writer"
import { InMemoryFs } from "../inMemoryFs"

describe("InMemoryFs - File Writing Operations", () => {
	test("should write and read file content using writer", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()
		const fileHandle = await rootDir.openFile("test.txt", { create: true })
		const testContent = "Hello, World!"
		const encoder = new TextEncoder()
		const decoder = new TextDecoder()

		// Act
		const writer = await fileHandle.write()
		await writer.write(encoder.encode(testContent))
		await writer.close()

		// Assert
		const readContent = await fileHandle.read()
		expect(decoder.decode(readContent)).toBe(testContent)
	})

	test("should buffer writes until close", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()
		const fileHandle = await rootDir.openFile("buffered.txt", {
			create: true,
		})
		const testContent = "Buffered content"
		const encoder = new TextEncoder()
		const decoder = new TextDecoder()

		// Act
		const writer = await fileHandle.write()
		await writer.write(encoder.encode(testContent))

		// Assert - Content should not be visible before close
		const contentBeforeClose = await fileHandle.read()
		expect(contentBeforeClose.length).toBe(0)

		// Act - Close writer
		await writer.close()

		// Assert - Content should be visible after close
		const contentAfterClose = await fileHandle.read()
		expect(decoder.decode(contentAfterClose)).toBe(testContent)
	})

	test("should handle multiple writes before close", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()
		const fileHandle = await rootDir.openFile("multi-write.txt", {
			create: true,
		})
		const encoder = new TextEncoder()
		const decoder = new TextDecoder()

		// Act
		const writer = await fileHandle.write()
		await writer.write(encoder.encode("Part 1 "))
		await writer.write(encoder.encode("Part 2 "))
		await writer.write(encoder.encode("Part 3"))
		await writer.close()

		// Assert
		const readContent = await fileHandle.read()
		expect(decoder.decode(readContent)).toBe("Part 1 Part 2 Part 3")
	})

	test("should overwrite existing content by default", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()
		const fileHandle = await rootDir.openFile("overwrite.txt", {
			create: true,
		})
		const encoder = new TextEncoder()
		const decoder = new TextDecoder()

		// Act - Write initial content
		const writer1 = await fileHandle.write()
		await writer1.write(encoder.encode("Initial content"))
		await writer1.close()

		// Act - Overwrite with new content
		const writer2 = await fileHandle.write()
		await writer2.write(encoder.encode("New content"))
		await writer2.close()

		// Assert
		const readContent = await fileHandle.read()
		expect(decoder.decode(readContent)).toBe("New content")
	})

	test("should append content when using append mode", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()
		const fileHandle = await rootDir.openFile("append.txt", {
			create: true,
		})
		const encoder = new TextEncoder()
		const decoder = new TextDecoder()

		// Act - Write initial content
		const writer1 = await fileHandle.write()
		await writer1.write(encoder.encode("Initial "))
		await writer1.close()

		// Act - Append content
		const writer2 = await fileHandle.write({ mode: FsWriteMode.APPEND })
		await writer2.write(encoder.encode("Appended"))
		await writer2.close()

		// Assert
		const readContent = await fileHandle.read()
		expect(decoder.decode(readContent)).toBe("Initial Appended")
	})

	test("should write binary data correctly", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()
		const fileHandle = await rootDir.openFile("binary.bin", {
			create: true,
		})
		const binaryData = new Uint8Array([0, 1, 2, 3, 255, 254, 253])

		// Act
		const writer = await fileHandle.write()
		await writer.write(binaryData.buffer)
		await writer.close()

		// Assert
		const readData = await fileHandle.read()
		expect(readData).toEqual(binaryData)
	})

	test("should write blob data correctly", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()
		const fileHandle = await rootDir.openFile("blob.txt", { create: true })
		const testContent = "Blob content test"
		const blob = new Blob([testContent], { type: "text/plain" })

		// Act
		const writer = await fileHandle.write()
		await writer.write(blob)
		await writer.close()

		// Assert
		const file = await fileHandle.getFile()
		const readContent = await file.text()
		expect(readContent).toBe(testContent)
	})

	test("should overwrite file content by default", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()
		const fileHandle = await rootDir.openFile("overwrite.txt", {
			create: true,
		})
		const encoder = new TextEncoder()
		const decoder = new TextDecoder()

		// Act - First write
		const writer1 = await fileHandle.write()
		await writer1.write(encoder.encode("Original content"))
		await writer1.close()

		// Act - Second write (should overwrite)
		const writer2 = await fileHandle.write()
		await writer2.write(encoder.encode("New content"))
		await writer2.close()

		// Assert
		const readContent = await fileHandle.read()
		expect(decoder.decode(readContent)).toBe("New content")
	})

	test("should overwrite file content when mode is explicitly set to overwrite", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()
		const fileHandle = await rootDir.openFile("overwrite-explicit.txt", {
			create: true,
		})
		const encoder = new TextEncoder()
		const decoder = new TextDecoder()

		// Act - First write
		const writer1 = await fileHandle.write({ mode: FsWriteMode.OVERWRITE })
		await writer1.write(encoder.encode("Original content"))
		await writer1.close()

		// Act - Second write with explicit overwrite
		const writer2 = await fileHandle.write({ mode: FsWriteMode.OVERWRITE })
		await writer2.write(encoder.encode("New content"))
		await writer2.close()

		// Assert
		const readContent = await fileHandle.read()
		expect(decoder.decode(readContent)).toBe("New content")
	})

	test("should append to file content when mode is append", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()
		const fileHandle = await rootDir.openFile("append.txt", {
			create: true,
		})
		const encoder = new TextEncoder()
		const decoder = new TextDecoder()

		// Act - First write
		const writer1 = await fileHandle.write()
		await writer1.write(encoder.encode("Hello "))
		await writer1.close()

		// Act - Append write
		const writer2 = await fileHandle.write({ mode: FsWriteMode.APPEND })
		await writer2.write(encoder.encode("World!"))
		await writer2.close()

		// Assert
		const readContent = await fileHandle.read()
		expect(decoder.decode(readContent)).toBe("Hello World!")
	})

	test("should handle multiple writes within single writer session", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()
		const fileHandle = await rootDir.openFile("multi-write.txt", {
			create: true,
		})
		const encoder = new TextEncoder()
		const decoder = new TextDecoder()

		// Act
		const writer = await fileHandle.write()
		await writer.write(encoder.encode("Part 1 "))
		await writer.write(encoder.encode("Part 2 "))
		await writer.write(encoder.encode("Part 3"))
		await writer.close()

		// Assert
		const readContent = await fileHandle.read()
		expect(decoder.decode(readContent)).toBe("Part 1 Part 2 Part 3")
	})

	test("should not expose writes until writer is closed", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()
		const fileHandle1 = await rootDir.openFile("concurrent.txt", {
			create: true,
		})
		const fileHandle2 = await rootDir.openFile("concurrent.txt")
		const encoder = new TextEncoder()
		const decoder = new TextDecoder()

		// Act - Start writing but don't close
		const writer = await fileHandle1.write()
		await writer.write(encoder.encode("Hidden content"))

		// Assert - Content should not be visible yet
		const stat1 = await fileHandle2.stat()
		expect(stat1.exists).toBe(true)
		expect(stat1.size).toBe(0) // Should still be empty

		const readContent1 = await fileHandle2.read()
		expect(readContent1.length).toBe(0) // Should be empty

		// Act - Close writer
		await writer.close()

		// Assert - Content should now be visible
		const readContent2 = await fileHandle2.read()
		expect(decoder.decode(readContent2)).toBe("Hidden content")

		const stat2 = await fileHandle2.stat()
		expect(stat2.size).toBeGreaterThan(0)
	})

	test("should fail to write to closed writer", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()
		const fileHandle = await rootDir.openFile("closed-writer.txt", {
			create: true,
		})
		const encoder = new TextEncoder()

		// Act
		const writer = await fileHandle.write()
		await writer.close()

		// Assert
		await expect(
			writer.write(encoder.encode("Should fail")),
		).rejects.toThrow("Cannot write to a closed writer")
	})

	test("should handle closing writer multiple times gracefully", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()
		const fileHandle = await rootDir.openFile("multi-close.txt", {
			create: true,
		})
		const encoder = new TextEncoder()

		// Act
		const writer = await fileHandle.write()
		await writer.write(encoder.encode("Test content"))
		await writer.close()

		// Assert - Multiple closes should not throw
		await expect(writer.close()).resolves.not.toThrow()
		await expect(writer.close()).resolves.not.toThrow()
	})

	test("should fail to write to non-existent file", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()

		// Act & Assert
		await expect(
			rootDir.openFile("non-existent.txt").then((h) => h.write()),
		).rejects.toThrow(FsErrorNotFound)
	})

	test("should fail to write to deleted file", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()
		const fileHandle = await rootDir.openFile("delete-before-write.txt", {
			create: true,
		})

		// Act
		await fileHandle.delete()

		// Assert
		await expect(fileHandle.write()).rejects.toThrow(FsErrorNotFound)
	})

	test("should update file stat after writing", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()
		const fileHandle = await rootDir.openFile("stat-update.txt", {
			create: true,
		})
		const testContent = "Content for stat test"
		const encoder = new TextEncoder()

		// Act - Check initial stat
		const initialStat = await fileHandle.stat()
		expect(initialStat.exists).toBe(true)
		expect(initialStat.size).toBe(0)

		// Act - Write content
		const writer = await fileHandle.write()
		await writer.write(encoder.encode(testContent))
		await writer.close()

		// Assert - Check updated stat
		const updatedStat = await fileHandle.stat()
		expect(updatedStat.exists).toBe(true)
		expect(updatedStat.size).toBe(encoder.encode(testContent).length)
	})

	test("should handle empty writes", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()
		const fileHandle = await rootDir.openFile("empty-write.txt", {
			create: true,
		})

		// Act
		const writer = await fileHandle.write()
		await writer.write(new ArrayBuffer(0))
		await writer.close()

		// Assert
		const readContent = await fileHandle.read()
		expect(readContent.length).toBe(0)

		const stat = await fileHandle.stat()
		expect(stat.size).toBe(0)
	})

	test("should handle complex append sequence", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()
		const fileHandle = await rootDir.openFile("complex-append.txt", {
			create: true,
		})
		const encoder = new TextEncoder()
		const decoder = new TextDecoder()

		// Act - Initial content
		const writer1 = await fileHandle.write()
		await writer1.write(encoder.encode("Line 1\n"))
		await writer1.close()

		// Act - Append more content
		const writer2 = await fileHandle.write({ mode: FsWriteMode.APPEND })
		await writer2.write(encoder.encode("Line 2\n"))
		await writer2.close()

		// Act - Append even more content
		const writer3 = await fileHandle.write({ mode: FsWriteMode.APPEND })
		await writer3.write(encoder.encode("Line 3"))
		await writer3.close()

		// Assert
		const readContent = await fileHandle.read()
		expect(decoder.decode(readContent)).toBe("Line 1\nLine 2\nLine 3")
	})
})
