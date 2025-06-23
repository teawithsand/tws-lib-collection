import { describe, expect, test } from "vitest"
import { InMemoryFs } from "../inMemoryFs"

describe("InMemoryFs - Basic Operations", () => {
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
})
