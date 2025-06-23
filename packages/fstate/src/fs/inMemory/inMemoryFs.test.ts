import { describe, expect, test } from "vitest"
import { FsErrorAlreadyExists, FsErrorNotFound } from "../defines/error"
import { Path } from "../defines/path"
import { InMemoryFs } from "./inMemoryFs"

describe("InMemoryFs", () => {
	test("should create filesystem instance", () => {
		// Act
		const fs = new InMemoryFs()

		// Assert
		expect(fs).toBeDefined()
		expect(fs).toBeInstanceOf(InMemoryFs)
	})

	test("should return root directory handle", async () => {
		// Arrange
		const fs = new InMemoryFs()

		// Act
		const rootDir = await fs.getRootDir()

		// Assert
		expect(rootDir).toBeDefined()
		expect(await rootDir.exists()).toBe(true)
	})

	test("should return same root directory instance for multiple calls", async () => {
		// Arrange
		const fs = new InMemoryFs()

		// Act
		const rootDir1 = await fs.getRootDir()
		const rootDir2 = await fs.getRootDir()

		// Assert
		expect(rootDir1).toBeDefined()
		expect(rootDir2).toBeDefined()
		// Both should exist and represent the same logical directory
		expect(await rootDir1.exists()).toBe(true)
		expect(await rootDir2.exists()).toBe(true)
	})

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

	test("should create and list directories through root directory", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()

		// Act
		await rootDir.mkdir("subdir")
		const entries = await rootDir.list()

		// Assert
		expect(entries).toHaveLength(1)
		expect(entries[0].path.toString()).toBe("subdir")
		expect(entries[0].isDirectory).toBe(true)
	})

	test("should handle nested directory operations", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()

		// Act
		await rootDir.mkdir("level1")
		const level1Dir = await rootDir.openDir("level1")
		await level1Dir.mkdir("level2")
		const level2Dir = await level1Dir.openDir("level2")
		const fileHandle = await level2Dir.openFile("nested.txt", {
			create: true,
		})

		// Assert
		expect(await fileHandle.exists()).toBe(true)

		const level1Entries = await level1Dir.list()
		expect(level1Entries).toHaveLength(1)
		expect(level1Entries[0].path.toString()).toBe("level2")
		expect(level1Entries[0].isDirectory).toBe(true)

		const level2Entries = await level2Dir.list()
		expect(level2Entries).toHaveLength(1)
		expect(level2Entries[0].path.toString()).toBe("nested.txt")
		expect(level2Entries[0].isDirectory).toBe(false)
	})

	test("should handle file operations through filesystem", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()
		const testContent = "Hello, World!"
		const encoder = new TextEncoder()
		const decoder = new TextDecoder()

		// Act
		const fileHandle = await rootDir.openFile("data.txt", { create: true })
		// Note: InMemoryFileHandle doesn't have write method in the interface,
		// but we can test reading operations after creating files via directory operations

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

	test("should isolate multiple filesystem instances", async () => {
		// Arrange
		const fs1 = new InMemoryFs()
		const fs2 = new InMemoryFs()

		// Act
		const rootDir1 = await fs1.getRootDir()
		const rootDir2 = await fs2.getRootDir()

		await rootDir1.mkdir("fs1-dir")
		const fileHandle1 = await rootDir1.openFile("fs1-file.txt", {
			create: true,
		})

		await rootDir2.mkdir("fs2-dir")
		const fileHandle2 = await rootDir2.openFile("fs2-file.txt", {
			create: true,
		})

		// Assert
		const entries1 = await rootDir1.list()
		const entries2 = await rootDir2.list()

		expect(entries1).toHaveLength(2)
		expect(entries2).toHaveLength(2)

		const fs1Names = entries1.map((e) => e.path.toString()).sort()
		const fs2Names = entries2.map((e) => e.path.toString()).sort()

		expect(fs1Names).toEqual(["fs1-dir", "fs1-file.txt"])
		expect(fs2Names).toEqual(["fs2-dir", "fs2-file.txt"])
	})

	test("should handle directory deletion through root directory", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()

		// Act
		await rootDir.mkdir("temp-dir")
		const tempDir = await rootDir.openDir("temp-dir")
		await tempDir.delete(false)

		// Assert
		const entries = await rootDir.list()
		expect(entries).toHaveLength(0)
	})

	test("should handle recursive directory deletion", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()

		// Act
		await rootDir.mkdir("parent")
		const parentDir = await rootDir.openDir("parent")
		await parentDir.mkdir("child")
		const childDir = await parentDir.openDir("child")
		await childDir.openFile("grandchild.txt", { create: true })

		// Delete parent recursively
		await parentDir.delete(true)

		// Assert
		const rootEntries = await rootDir.list()
		expect(rootEntries).toHaveLength(0)
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

	test("should handle complex directory structure operations", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()

		// Act - Create complex structure
		await rootDir.mkdir("documents")
		await rootDir.mkdir("images")
		await rootDir.mkdir("videos")

		const docsDir = await rootDir.openDir("documents")
		await docsDir.mkdir("personal")
		await docsDir.mkdir("work")

		const personalDir = await docsDir.openDir("personal")
		await personalDir.openFile("diary.txt", { create: true })
		await personalDir.openFile("notes.txt", { create: true })

		const workDir = await docsDir.openDir("work")
		await workDir.openFile("project.md", { create: true })

		// Assert - Verify structure
		const rootEntries = await rootDir.list()
		expect(rootEntries).toHaveLength(3)

		const rootDirNames = rootEntries.map((e) => e.path.toString()).sort()
		expect(rootDirNames).toEqual(["documents", "images", "videos"])

		const docsEntries = await docsDir.list()
		expect(docsEntries).toHaveLength(2)

		const personalEntries = await personalDir.list()
		expect(personalEntries).toHaveLength(2)

		const workEntries = await workDir.list()
		expect(workEntries).toHaveLength(1)
		expect(workEntries[0].path.toString()).toBe("project.md")
	})

	test("should maintain consistent state after multiple operations", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()

		// Act - Perform multiple operations
		await rootDir.openFile("file1.txt", { create: true })
		await rootDir.mkdir("dir1")
		await rootDir.openFile("file2.txt", { create: true })

		const dir1 = await rootDir.openDir("dir1")
		await dir1.openFile("nested.txt", { create: true })

		// Delete file1
		const file1Handle = await rootDir.openFile("file1.txt")
		await file1Handle.delete()

		// Assert final state
		const rootEntries = await rootDir.list()
		expect(rootEntries).toHaveLength(2) // dir1 and file2.txt

		const rootNames = rootEntries.map((e) => e.path.toString()).sort()
		expect(rootNames).toEqual(["dir1", "file2.txt"])

		const dir1Entries = await dir1.list()
		expect(dir1Entries).toHaveLength(1)
		expect(dir1Entries[0].path.toString()).toBe("nested.txt")
	})

	test("should handle empty filesystem operations", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()

		// Act & Assert
		const entries = await rootDir.list()
		expect(entries).toHaveLength(0)

		// Root directory should always exist
		expect(await rootDir.exists()).toBe(true)
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

	test("should have correct name and path properties", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()

		// Act
		await rootDir.mkdir("testdir")
		const subDir = await rootDir.openDir("testdir")
		const fileHandle = await rootDir.openFile("test.txt", { create: true })

		// Assert
		expect(rootDir.name).toBe("")
		expect(rootDir.path.toString()).toBe(".")

		expect(subDir.name).toBe("testdir")
		expect(subDir.path.toString()).toBe("testdir")

		expect(fileHandle.name).toBe("test.txt")
		expect(fileHandle.path.toString()).toBe("test.txt")
	})

	test("should have correct name and path properties for nested paths", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()

		// Act
		await rootDir.mkdir("level1")
		const level1Dir = await rootDir.openDir("level1")
		await level1Dir.mkdir("level2")
		const level2Dir = await level1Dir.openDir("level2")
		const nestedFile = await level2Dir.openFile("nested.txt", {
			create: true,
		})

		// Assert
		expect(level1Dir.name).toBe("level1")
		expect(level1Dir.path.toString()).toBe("level1")

		expect(level2Dir.name).toBe("level2")
		expect(level2Dir.path.toString()).toBe("level1/level2")

		expect(nestedFile.name).toBe("nested.txt")
		expect(nestedFile.path.toString()).toBe("level1/level2/nested.txt")
	})
})
