import { describe, expect, test } from "vitest"
import { FsErrorAlreadyExists, FsErrorNotFound } from "../../defines/error"
import { InMemoryFs } from "../inMemoryFs"

describe("InMemoryFs - File Operations", () => {
	test("should create and list files through root directory", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()

		// Act
		const fileHandle = await rootDir.openFile("test.txt", { create: true })
		const entries = await rootDir.list()

		// Assert
		expect(await fileHandle.exists()).toBe(true)
		expect(entries).toHaveLength(1)
		expect(entries[0].path.toString()).toBe("test.txt")
		expect(entries[0].isDirectory).toBe(false)
	})

	test("should handle file operations through filesystem", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()

		// Act
		const fileHandle = await rootDir.openFile("data.txt", { create: true })

		// Let's create a file with content by using the internal structure
		await rootDir.mkdir("testdir")
		const subDir = await rootDir.openDir("testdir")
		const subFile = await subDir.openFile("subfile.txt", { create: true })

		// Assert file operations work
		expect(await fileHandle.exists()).toBe(true)
		expect(await subFile.exists()).toBe(true)

		const stat = await fileHandle.stat()
		expect(stat.exists).toBe(true)
	})

	test("should handle file deletion through directory", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()

		// Act
		const fileHandle = await rootDir.openFile("delete-me.txt", {
			create: true,
		})
		await fileHandle.delete()

		// Assert
		const entries = await rootDir.list()
		expect(entries).toHaveLength(0)
		expect(await fileHandle.exists()).toBe(false)
	})

	test("should handle non-existent file operations", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()

		// Act & Assert
		await expect(rootDir.openFile("non-existent.txt")).rejects.toThrow(
			FsErrorNotFound,
		)
	})

	test("should handle duplicate file creation with allowExisting", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()

		// Act
		await rootDir.openFile("duplicate.txt", { create: true })
		const secondHandle = await rootDir.openFile("duplicate.txt", {
			create: true,
			allowExisting: true,
		})

		// Assert
		expect(await secondHandle.exists()).toBe(true)
		const entries = await rootDir.list()
		expect(entries).toHaveLength(1)
	})

	test("should reject duplicate file creation without allowExisting", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()

		// Act
		await rootDir.openFile("duplicate.txt", { create: true })

		// Assert
		await expect(
			rootDir.openFile("duplicate.txt", { create: true }),
		).rejects.toThrow(FsErrorAlreadyExists)
	})

	test("should support file stat operations", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()

		// Act
		const fileHandle = await rootDir.openFile("stat-test.txt", {
			create: true,
		})
		const stat = await fileHandle.stat()

		// Assert
		expect(stat.exists).toBe(true)
		expect(stat.size).toBeDefined()
		expect(typeof stat.size).toBe("number")
	})

	test("should create file when create flag is true", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()

		// Act
		const fileHandle = await rootDir.openFile("new-file.txt", {
			create: true,
		})

		// Assert
		expect(await fileHandle.exists()).toBe(true)
		const entries = await rootDir.list()
		expect(entries).toHaveLength(1)
		expect(entries[0].path.toString()).toBe("new-file.txt")
		expect(entries[0].isDirectory).toBe(false)
	})

	test("should fail when trying to open non-existent file with create false", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()

		// Act & Assert
		await expect(
			rootDir.openFile("non-existent.txt", { create: false }),
		).rejects.toThrow(FsErrorNotFound)
	})

	test("should fail when trying to open non-existent file without create flag", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()

		// Act & Assert
		await expect(rootDir.openFile("non-existent.txt")).rejects.toThrow(
			FsErrorNotFound,
		)
	})

	test("should fail when no settings provided (defaults to create false)", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()

		// Act & Assert
		await expect(rootDir.openFile("default-file.txt")).rejects.toThrow(
			FsErrorNotFound,
		)
	})

	test("should allow opening existing file with create true and allowExisting true", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()
		await rootDir.openFile("existing.txt", { create: true })

		// Act
		const fileHandle = await rootDir.openFile("existing.txt", {
			create: true,
			allowExisting: true,
		})

		// Assert
		expect(await fileHandle.exists()).toBe(true)
		const entries = await rootDir.list()
		expect(entries).toHaveLength(1)
		expect(entries[0].path.toString()).toBe("existing.txt")
	})

	test("should allow opening existing file without create flag", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()
		await rootDir.openFile("existing.txt", { create: true })

		// Act
		const fileHandle = await rootDir.openFile("existing.txt")

		// Assert
		expect(await fileHandle.exists()).toBe(true)
	})

	test("should fail when trying to create file that already exists with allowExisting false", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()
		await rootDir.openFile("duplicate.txt", { create: true })

		// Act & Assert
		await expect(
			rootDir.openFile("duplicate.txt", {
				create: true,
				allowExisting: false,
			}),
		).rejects.toThrow(FsErrorAlreadyExists)
	})
})
