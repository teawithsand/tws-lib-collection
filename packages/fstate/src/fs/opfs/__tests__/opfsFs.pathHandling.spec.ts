import { beforeEach, describe, expect, test } from "vitest"
import { FsErrorBadType, FsErrorNotFound } from "../../defines/error"
import { OpfsFs } from "../opfsFs"

describe("OpfsFs - Path Handling", () => {
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

	describe("relative path navigation", () => {
		test("should handle simple relative paths", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			await rootDir.mkdir("subdir")

			// Act
			const subDir = await rootDir.openDir("subdir")

			// Assert
			expect(subDir.name).toBe("subdir")
			expect(subDir.path.toString()).toBe("subdir")
		})

		test("should handle nested relative paths", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			await rootDir.mkdir("a/b/c")

			// Act
			const deepDir = await rootDir.openDir("a/b/c")

			// Assert
			expect(deepDir.name).toBe("c")
			expect(deepDir.path.toString()).toBe("a/b/c")
		})

		test("should handle paths with forward slashes", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()

			// Act
			const fileHandle = await rootDir.openFile("path/to/file.txt", {
				create: true,
			})

			// Assert
			expect(fileHandle.name).toBe("file.txt")
			expect(fileHandle.path.toString()).toBe("path/to/file.txt")

			// Verify directory structure
			const pathDir = await rootDir.openDir("path")
			const toDir = await pathDir.openDir("to")
			const files = await toDir.list()
			expect(files).toHaveLength(1)
			expect(files[0]!.path.toString()).toBe("file.txt")
		})

		test("should handle empty path segments", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()

			// Act
			const fileHandle = await rootDir.openFile("path//to///file.txt", {
				create: true,
			})

			// Assert
			expect(fileHandle.name).toBe("file.txt")
			expect(fileHandle.path.toString()).toBe("path/to/file.txt")
		})

		test("should handle single dot in path", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()

			// Act
			const fileHandle = await rootDir.openFile("./file.txt", {
				create: true,
			})

			// Assert
			expect(fileHandle.name).toBe("file.txt")
			expect(fileHandle.path.toString()).toBe("file.txt")
		})
	})

	describe("complex path scenarios", () => {
		test("should create deep directory structure", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()

			// Act
			await rootDir.mkdir("level1/level2/level3/level4/level5")

			// Assert
			const deepDir = await rootDir.openDir(
				"level1/level2/level3/level4/level5",
			)
			expect(await deepDir.exists()).toBe(true)
			expect(deepDir.path.toString()).toBe(
				"level1/level2/level3/level4/level5",
			)

			// Verify we can navigate back up
			const level4 = await rootDir.openDir("level1/level2/level3/level4")
			const level5Entries = await level4.list()
			expect(level5Entries).toHaveLength(1)
			expect(level5Entries[0]!.path.toString()).toBe("level5")
		})

		test("should handle mixed file and directory creation", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()

			// Act
			await rootDir.mkdir("docs")
			await rootDir.openFile("docs/readme.txt", { create: true })
			await rootDir.mkdir("docs/images")
			await rootDir.openFile("docs/images/logo.png", { create: true })

			// Assert
			const docsDir = await rootDir.openDir("docs")
			const docsEntries = await docsDir.list()
			expect(docsEntries).toHaveLength(2)

			const files = docsEntries.filter((e) => !e.isDirectory)
			const dirs = docsEntries.filter((e) => e.isDirectory)

			expect(files).toHaveLength(1)
			expect(files[0]!.path.toString()).toBe("readme.txt")

			expect(dirs).toHaveLength(1)
			expect(dirs[0]!.path.toString()).toBe("images")

			const imagesDir = await docsDir.openDir("images")
			const imageEntries = await imagesDir.list()
			expect(imageEntries).toHaveLength(1)
			expect(imageEntries[0]!.path.toString()).toBe("logo.png")
		})

		test("should maintain correct paths after navigation", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			await rootDir.mkdir("a/b/c")

			// Act
			const dirA = await rootDir.openDir("a")
			const dirB = await dirA.openDir("b")
			const dirC = await dirB.openDir("c")

			// Assert
			expect(dirA.path.toString()).toBe("a")
			expect(dirB.path.toString()).toBe("a/b")
			expect(dirC.path.toString()).toBe("a/b/c")

			// Create files at different levels
			await dirA.openFile("file_a.txt", { create: true })
			await dirB.openFile("file_b.txt", { create: true })
			await dirC.openFile("file_c.txt", { create: true })

			// Verify paths
			const fileA = await dirA.openFile("file_a.txt")
			const fileB = await dirB.openFile("file_b.txt")
			const fileC = await dirC.openFile("file_c.txt")

			expect(fileA.path.toString()).toBe("a/file_a.txt")
			expect(fileB.path.toString()).toBe("a/b/file_b.txt")
			expect(fileC.path.toString()).toBe("a/b/c/file_c.txt")
		})
	})

	describe("path error handling", () => {
		test("should throw when opening non-existent nested path", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()

			// Act & Assert
			await expect(
				rootDir.openDir("non/existent/path", { create: false }),
			).rejects.toThrow(FsErrorNotFound)
		})

		test("should throw when file blocks directory creation", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			await rootDir.openFile("blockingfile.txt", { create: true })

			// Act & Assert
			await expect(
				rootDir.openDir("blockingfile.txt/subdir"),
			).rejects.toThrow(FsErrorBadType)
		})

		test("should throw when directory blocks file creation", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			await rootDir.mkdir("blockingdir")

			// Act & Assert
			await expect(
				rootDir.openFile("blockingdir", { create: true }),
			).rejects.toThrow(FsErrorBadType)
		})

		test("should handle invalid path segments gracefully", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()

			// Act & Assert - empty filename should be handled gracefully
			await expect(
				rootDir.openFile("", { create: true }),
			).rejects.toThrow(FsErrorBadType)
		})
	})

	describe("path normalization", () => {
		test("should normalize paths with multiple slashes", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()

			// Act
			const fileHandle1 = await rootDir.openFile("path//to///file.txt", {
				create: true,
			})
			const fileHandle2 = await rootDir.openFile("path/to/file.txt")

			// Assert
			expect(fileHandle1.path.toString()).toBe("path/to/file.txt")
			expect(fileHandle2.path.toString()).toBe("path/to/file.txt")
		})

		test("should handle trailing slashes in directory paths", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()

			// Act
			await rootDir.mkdir("testdir/")
			const dirHandle = await rootDir.openDir("testdir")

			// Assert
			expect(dirHandle.path.toString()).toBe("testdir")
			expect(await dirHandle.exists()).toBe(true)
		})

		test("should handle current directory references", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()

			// Act
			const fileHandle = await rootDir.openFile("./file.txt", {
				create: true,
			})

			// Assert
			expect(fileHandle.path.toString()).toBe("file.txt")
			expect(fileHandle.name).toBe("file.txt")
		})
	})

	describe("boundary conditions", () => {
		test("should handle very long file names", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			const longName = "a".repeat(100) + ".txt"

			// Act
			const fileHandle = await rootDir.openFile(longName, {
				create: true,
			})

			// Assert
			expect(fileHandle.name).toBe(longName)
			expect(fileHandle.path.toString()).toBe(longName)
		})

		test("should handle deep nesting", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			const segments = Array.from({ length: 10 }, (_, i) => `level${i}`)
			const deepPath = segments.join("/")

			// Act
			await rootDir.mkdir(deepPath)
			const deepDir = await rootDir.openDir(deepPath)

			// Assert
			expect(deepDir.path.toString()).toBe(deepPath)
			expect(await deepDir.exists()).toBe(true)
		})

		test("should handle special characters in names", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			const specialName = "file-with_special.chars&numbers123.txt"

			// Act
			const fileHandle = await rootDir.openFile(specialName, {
				create: true,
			})

			// Assert
			expect(fileHandle.name).toBe(specialName)
			expect(fileHandle.path.toString()).toBe(specialName)
		})
	})
})
