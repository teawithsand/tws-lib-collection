import { beforeEach, describe, expect, test } from "vitest"
import { FsWriteMode } from "../../defines/writer"
import { OpfsFs } from "../opfsFs"

describe("OpfsFs - File Writing", () => {
	let rootDirectoryHandle: FileSystemDirectoryHandle
	let fs: OpfsFs

	beforeEach(async () => {
		// Get a fresh OPFS directory handle for each test
		rootDirectoryHandle = await navigator.storage.getDirectory()

		// Create a test-specific subdirectory
		const testDirName = `test-${Date.now()}-${Math.random().toString(36).substring(2)}`
		const testDir = await rootDirectoryHandle.getDirectoryHandle(
			testDirName,
			{ create: true },
		)

		fs = new OpfsFs(testDir)
	})

	describe("basic writing operations", () => {
		test("should write text data to file", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			const fileHandle = await rootDir.openFile("test.txt", {
				create: true,
			})
			const testText = "Hello, OPFS World!"

			// Act
			const writer = await fileHandle.write()
			await writer.write(new TextEncoder().encode(testText))
			await writer.close()

			// Assert
			const content = await fileHandle.read()
			const readText = new TextDecoder().decode(content)
			expect(readText).toBe(testText)
		})

		test("should write binary data to file", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			const fileHandle = await rootDir.openFile("binary.dat", {
				create: true,
			})
			const binaryData = new Uint8Array([
				0x01, 0x02, 0x03, 0xff, 0xfe, 0xfd,
			])

			// Act
			const writer = await fileHandle.write()
			await writer.write(binaryData.buffer)
			await writer.close()

			// Assert
			const content = await fileHandle.read()
			expect(Array.from(content)).toEqual(Array.from(binaryData))
		})

		test("should write Blob data to file", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			const fileHandle = await rootDir.openFile("blob.txt", {
				create: true,
			})
			const blob = new Blob(["Hello ", "from ", "Blob!"], {
				type: "text/plain",
			})

			// Act
			const writer = await fileHandle.write()
			await writer.write(blob)
			await writer.close()

			// Assert
			const content = await fileHandle.read()
			const readText = new TextDecoder().decode(content)
			expect(readText).toBe("Hello from Blob!")
		})

		test("should handle empty writes", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			const fileHandle = await rootDir.openFile("empty.txt", {
				create: true,
			})

			// Act
			const writer = await fileHandle.write()
			await writer.close()

			// Assert
			const content = await fileHandle.read()
			expect(content.length).toBe(0)

			const stat = await fileHandle.stat()
			expect(stat.size).toBe(0)
		})
	})

	describe("multiple write operations", () => {
		test("should handle multiple writes in single session", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			const fileHandle = await rootDir.openFile("multi.txt", {
				create: true,
			})

			// Act
			const writer = await fileHandle.write()
			await writer.write(new TextEncoder().encode("Part 1 "))
			await writer.write(new TextEncoder().encode("Part 2 "))
			await writer.write(new TextEncoder().encode("Part 3"))
			await writer.close()

			// Assert
			const content = await fileHandle.read()
			const readText = new TextDecoder().decode(content)
			expect(readText).toBe("Part 1 Part 2 Part 3")
		})

		test("should handle mixed data types in single session", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			const fileHandle = await rootDir.openFile("mixed.dat", {
				create: true,
			})

			// Act
			const writer = await fileHandle.write()
			await writer.write(new TextEncoder().encode("Text"))
			await writer.write(new Uint8Array([0x20, 0x21, 0x22]).buffer)
			await writer.write(new Blob([" More text"]))
			await writer.close()

			// Assert
			const content = await fileHandle.read()
			const readText = new TextDecoder().decode(content)
			expect(readText).toBe('Text !" More text')
		})

		test("should handle large number of small writes", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			const fileHandle = await rootDir.openFile("many.txt", {
				create: true,
			})
			const chunks = Array.from({ length: 100 }, (_, i) => `chunk${i} `)

			// Act
			const writer = await fileHandle.write()
			for (const chunk of chunks) {
				await writer.write(new TextEncoder().encode(chunk))
			}
			await writer.close()

			// Assert
			const content = await fileHandle.read()
			const readText = new TextDecoder().decode(content)
			expect(readText).toBe(chunks.join(""))
		})
	})

	describe("write modes", () => {
		test("should overwrite existing content by default", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			const fileHandle = await rootDir.openFile("overwrite.txt", {
				create: true,
			})

			// Write initial content
			let writer = await fileHandle.write()
			await writer.write(new TextEncoder().encode("Initial content"))
			await writer.close()

			// Act - overwrite
			writer = await fileHandle.write()
			await writer.write(new TextEncoder().encode("New content"))
			await writer.close()

			// Assert
			const content = await fileHandle.read()
			const readText = new TextDecoder().decode(content)
			expect(readText).toBe("New content")
		})

		test("should overwrite with explicit OVERWRITE mode", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			const fileHandle = await rootDir.openFile("explicit.txt", {
				create: true,
			})

			// Write initial content
			let writer = await fileHandle.write()
			await writer.write(new TextEncoder().encode("Initial content"))
			await writer.close()

			// Act - explicit overwrite
			writer = await fileHandle.write({ mode: FsWriteMode.OVERWRITE })
			await writer.write(new TextEncoder().encode("Overwritten"))
			await writer.close()

			// Assert
			const content = await fileHandle.read()
			const readText = new TextDecoder().decode(content)
			expect(readText).toBe("Overwritten")
		})

		test("should append to existing content", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			const fileHandle = await rootDir.openFile("append.txt", {
				create: true,
			})

			// Write initial content
			let writer = await fileHandle.write()
			await writer.write(new TextEncoder().encode("Initial "))
			await writer.close()

			// Act - append
			writer = await fileHandle.write({ mode: FsWriteMode.APPEND })
			await writer.write(new TextEncoder().encode("appended"))
			await writer.close()

			// Assert
			const content = await fileHandle.read()
			const readText = new TextDecoder().decode(content)
			expect(readText).toBe("Initial appended")
		})

		test("should handle multiple append operations", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			const fileHandle = await rootDir.openFile("multiappend.txt", {
				create: true,
			})

			// Initial content
			let writer = await fileHandle.write()
			await writer.write(new TextEncoder().encode("Start"))
			await writer.close()

			// Act - multiple appends
			for (let i = 1; i <= 3; i++) {
				writer = await fileHandle.write({ mode: FsWriteMode.APPEND })
				await writer.write(new TextEncoder().encode(` Part${i}`))
				await writer.close()
			}

			// Assert
			const content = await fileHandle.read()
			const readText = new TextDecoder().decode(content)
			expect(readText).toBe("Start Part1 Part2 Part3")
		})

		test("should append to empty file", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			const fileHandle = await rootDir.openFile("appendempty.txt", {
				create: true,
			})

			// Act - append to empty file
			const writer = await fileHandle.write({ mode: FsWriteMode.APPEND })
			await writer.write(new TextEncoder().encode("First content"))
			await writer.close()

			// Assert
			const content = await fileHandle.read()
			const readText = new TextDecoder().decode(content)
			expect(readText).toBe("First content")
		})
	})

	describe("writer lifecycle", () => {
		test("should throw when writing to closed writer", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			const fileHandle = await rootDir.openFile("closed.txt", {
				create: true,
			})
			const writer = await fileHandle.write()
			await writer.close()

			// Act & Assert
			await expect(
				writer.write(new TextEncoder().encode("test")),
			).rejects.toThrow("Cannot write to a closed writer")
		})

		test("should allow multiple close calls", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			const fileHandle = await rootDir.openFile("multiclose.txt", {
				create: true,
			})
			const writer = await fileHandle.write()

			// Act - multiple closes should not throw
			await writer.close()
			await writer.close()
			await writer.close()

			// Assert - file should still be readable
			const content = await fileHandle.read()
			expect(content.length).toBe(0)
		})

		test("should handle concurrent writers on same file", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			const fileHandle = await rootDir.openFile("concurrent.txt", {
				create: true,
			})

			// Act - create two writers (note: this might lead to race conditions in real OPFS)
			const writer1 = await fileHandle.write()
			const writer2 = await fileHandle.write()

			await writer1.write(new TextEncoder().encode("Writer 1"))
			await writer2.write(new TextEncoder().encode("Writer 2"))

			await writer1.close()
			await writer2.close()

			// Assert - last writer wins
			const content = await fileHandle.read()
			const readText = new TextDecoder().decode(content)
			expect(readText).toBe("Writer 2")
		})
	})

	describe("large data handling", () => {
		test("should handle large single write", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			const fileHandle = await rootDir.openFile("large.txt", {
				create: true,
			})
			const largeText = "x".repeat(100000) // 100KB

			// Act
			const writer = await fileHandle.write()
			await writer.write(new TextEncoder().encode(largeText))
			await writer.close()

			// Assert
			const content = await fileHandle.read()
			const readText = new TextDecoder().decode(content)
			expect(readText.length).toBe(100000)
			expect(readText).toBe(largeText)
		})

		test("should handle many large writes", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			const fileHandle = await rootDir.openFile("manylarge.txt", {
				create: true,
			})
			const chunkSize = 10000
			const numChunks = 10

			// Act
			const writer = await fileHandle.write()
			for (let i = 0; i < numChunks; i++) {
				const chunk = `${i}`.repeat(chunkSize)
				await writer.write(new TextEncoder().encode(chunk))
			}
			await writer.close()

			// Assert
			const content = await fileHandle.read()
			expect(content.length).toBe(chunkSize * numChunks)

			const stat = await fileHandle.stat()
			expect(stat.size).toBe(chunkSize * numChunks)
		})
	})

	describe("edge cases", () => {
		test("should handle zero-length ArrayBuffer", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			const fileHandle = await rootDir.openFile("zerolength.dat", {
				create: true,
			})

			// Act
			const writer = await fileHandle.write()
			await writer.write(new ArrayBuffer(0))
			await writer.close()

			// Assert
			const content = await fileHandle.read()
			expect(content.length).toBe(0)
		})

		test("should handle empty Blob", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			const fileHandle = await rootDir.openFile("emptyblob.txt", {
				create: true,
			})

			// Act
			const writer = await fileHandle.write()
			await writer.write(new Blob([]))
			await writer.close()

			// Assert
			const content = await fileHandle.read()
			expect(content.length).toBe(0)
		})

		test("should handle Unicode content", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			const fileHandle = await rootDir.openFile("unicode.txt", {
				create: true,
			})
			const unicodeText = "Hello 世界 🌍 Здравствуй мир! مرحبا بالعالم"

			// Act
			const writer = await fileHandle.write()
			await writer.write(new TextEncoder().encode(unicodeText))
			await writer.close()

			// Assert
			const content = await fileHandle.read()
			const readText = new TextDecoder().decode(content)
			expect(readText).toBe(unicodeText)
		})
	})
})
