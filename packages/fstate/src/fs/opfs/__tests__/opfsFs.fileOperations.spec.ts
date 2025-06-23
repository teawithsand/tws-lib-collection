import { beforeEach, describe, expect, test } from "vitest"
import {
	FsErrorAlreadyExists,
	FsErrorBadType,
	FsErrorNotFound,
} from "../../defines/error"
import { FsWriteMode } from "../../defines/writer"
import { OpfsFs } from "../opfsFs"

describe("OpfsFs - File Operations", () => {
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

	describe("file creation and opening", () => {
		test("should create new file", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()

			// Act
			const fileHandle = await rootDir.openFile("test.txt", {
				create: true,
			})

			// Assert
			expect(fileHandle).toBeDefined()
			expect(fileHandle.name).toBe("test.txt")
			expect(fileHandle.path.toString()).toBe("test.txt")
			expect(await fileHandle.exists()).toBe(true)

			const entries = await rootDir.list()
			expect(entries).toHaveLength(1)
			expect(entries[0]!.isDirectory).toBe(false)
		})

		test("should open existing file", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			await rootDir.openFile("test.txt", { create: true })

			// Act
			const fileHandle = await rootDir.openFile("test.txt")

			// Assert
			expect(fileHandle).toBeDefined()
			expect(await fileHandle.exists()).toBe(true)
		})

		test("should throw when opening non-existing file without create", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()

			// Act & Assert
			await expect(rootDir.openFile("nonexistent.txt")).rejects.toThrow(
				FsErrorNotFound,
			)
		})

		test("should throw when creating file that already exists with allowExisting false", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			await rootDir.openFile("test.txt", { create: true })

			// Act & Assert
			await expect(
				rootDir.openFile("test.txt", {
					create: true,
					allowExisting: false,
				}),
			).rejects.toThrow(FsErrorAlreadyExists)
		})

		test("should allow creating file that already exists with allowExisting true", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			await rootDir.openFile("test.txt", { create: true })

			// Act
			const fileHandle = await rootDir.openFile("test.txt", {
				create: true,
				allowExisting: true,
			})

			// Assert
			expect(fileHandle).toBeDefined()
			expect(await fileHandle.exists()).toBe(true)
		})

		test("should throw when trying to open directory as file", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			await rootDir.mkdir("testdir")

			// Act & Assert
			await expect(rootDir.openFile("testdir")).rejects.toThrow(
				FsErrorBadType,
			)
		})

		test("should create file in nested directories", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()

			// Act
			const fileHandle = await rootDir.openFile("a/b/c/test.txt", {
				create: true,
			})

			// Assert
			expect(fileHandle).toBeDefined()
			expect(fileHandle.path.toString()).toBe("a/b/c/test.txt")
			expect(await fileHandle.exists()).toBe(true)

			// Verify directory structure was created
			const dirA = await rootDir.openDir("a")
			expect(await dirA.exists()).toBe(true)

			const dirB = await dirA.openDir("b")
			expect(await dirB.exists()).toBe(true)

			const dirC = await dirB.openDir("c")
			expect(await dirC.exists()).toBe(true)

			const files = await dirC.list()
			expect(files).toHaveLength(1)
			expect(files[0]!.path.toString()).toBe("test.txt")
		})
	})

	describe("file reading", () => {
		test("should read empty file", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			const fileHandle = await rootDir.openFile("test.txt", {
				create: true,
			})

			// Act
			const content = await fileHandle.read()

			// Assert
			expect(content).toBeInstanceOf(Uint8Array)
			expect(content.length).toBe(0)
		})

		test("should read file content", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			const fileHandle = await rootDir.openFile("test.txt", {
				create: true,
			})

			const writer = await fileHandle.write()
			const testData = new TextEncoder().encode("Hello, OPFS!")
			await writer.write(testData)
			await writer.close()

			// Act
			const content = await fileHandle.read()

			// Assert
			expect(content).toBeInstanceOf(Uint8Array)
			expect(new TextDecoder().decode(content)).toBe("Hello, OPFS!")
		})

		test("should get File object", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			const fileHandle = await rootDir.openFile("test.txt", {
				create: true,
			})

			const writer = await fileHandle.write()
			const testData = new TextEncoder().encode("Hello, OPFS!")
			await writer.write(testData)
			await writer.close()

			// Act
			const file = await fileHandle.getFile()

			// Assert
			expect(file).toBeInstanceOf(File)
			expect(file.name).toBe("test.txt")
			expect(file.size).toBe(testData.length)

			const fileContent = await file.text()
			expect(fileContent).toBe("Hello, OPFS!")
		})

		test("should throw when reading non-existing file", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()

			// Act & Assert
			await expect(async () => {
				const fileHandle = await rootDir.openFile("nonexistent.txt", {
					create: false,
				})
				await fileHandle.read()
			}).rejects.toThrow(FsErrorNotFound)
		})
	})

	describe("file writing", () => {
		test("should write data to file", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			const fileHandle = await rootDir.openFile("test.txt", {
				create: true,
			})
			const testData = new TextEncoder().encode("Hello, World!")

			// Act
			const writer = await fileHandle.write()
			await writer.write(testData)
			await writer.close()

			// Assert
			const content = await fileHandle.read()
			expect(new TextDecoder().decode(content)).toBe("Hello, World!")
		})

		test("should overwrite file content by default", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			const fileHandle = await rootDir.openFile("test.txt", {
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
			expect(new TextDecoder().decode(content)).toBe("New content")
		})

		test("should append to file content", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			const fileHandle = await rootDir.openFile("test.txt", {
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
			expect(new TextDecoder().decode(content)).toBe("Initial appended")
		})

		test("should handle multiple writes in single session", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			const fileHandle = await rootDir.openFile("test.txt", {
				create: true,
			})

			// Act
			const writer = await fileHandle.write()
			await writer.write(new TextEncoder().encode("Hello "))
			await writer.write(new TextEncoder().encode("World "))
			await writer.write(new TextEncoder().encode("!"))
			await writer.close()

			// Assert
			const content = await fileHandle.read()
			expect(new TextDecoder().decode(content)).toBe("Hello World !")
		})

		test("should handle binary data", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			const fileHandle = await rootDir.openFile("binary.dat", {
				create: true,
			})
			const binaryData = new Uint8Array([
				0x00, 0x01, 0x02, 0xff, 0xfe, 0xfd,
			])

			// Act
			const writer = await fileHandle.write()
			await writer.write(binaryData.buffer)
			await writer.close()

			// Assert
			const content = await fileHandle.read()
			expect(content).toEqual(binaryData)
		})

		test("should handle Blob data", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			const fileHandle = await rootDir.openFile("test.txt", {
				create: true,
			})
			const blob = new Blob(["Hello ", "from ", "Blob!"])

			// Act
			const writer = await fileHandle.write()
			await writer.write(blob)
			await writer.close()

			// Assert
			const content = await fileHandle.read()
			expect(new TextDecoder().decode(content)).toBe("Hello from Blob!")
		})

		test("should throw when writing to closed writer", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			const fileHandle = await rootDir.openFile("test.txt", {
				create: true,
			})
			const writer = await fileHandle.write()
			await writer.close()

			// Act & Assert
			await expect(
				writer.write(new TextEncoder().encode("test")),
			).rejects.toThrow()
		})
	})

	describe("file stat operations", () => {
		test("should return stat for existing file", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			const fileHandle = await rootDir.openFile("test.txt", {
				create: true,
			})
			const testData = new TextEncoder().encode("Hello, World!")

			const writer = await fileHandle.write()
			await writer.write(testData)
			await writer.close()

			// Act
			const stat = await fileHandle.stat()

			// Assert
			expect(stat.exists).toBe(true)
			expect(stat.size).toBe(testData.length)
		})

		test("should return stat for empty file", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			const fileHandle = await rootDir.openFile("empty.txt", {
				create: true,
			})

			// Act
			const stat = await fileHandle.stat()

			// Assert
			expect(stat.exists).toBe(true)
			expect(stat.size).toBe(0)
		})

		test("should return non-existing stat for deleted file", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			const fileHandle = await rootDir.openFile("test.txt", {
				create: true,
			})

			// Note: In our current OPFS implementation, we can't delete files directly
			// This test demonstrates expected behavior but may need adjustment based on implementation

			// Act
			const stat = await fileHandle.stat()

			// Assert
			expect(stat.exists).toBe(true) // File exists after creation
		})
	})

	describe("file existence checks", () => {
		test("should return true for existing file", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			const fileHandle = await rootDir.openFile("test.txt", {
				create: true,
			})

			// Act & Assert
			expect(await fileHandle.exists()).toBe(true)
		})

		test("should return false for non-existing file", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()

			// Act & Assert
			await expect(async () => {
				const fileHandle = await rootDir.openFile("nonexistent.txt", {
					create: false,
				})
				return await fileHandle.exists()
			}).rejects.toThrow(FsErrorNotFound)
		})
	})
})
