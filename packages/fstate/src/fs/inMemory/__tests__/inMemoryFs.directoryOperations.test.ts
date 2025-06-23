import { describe, expect, test } from "vitest"
import { InMemoryFs } from "../inMemoryFs"

describe("InMemoryFs - Directory Operations", () => {
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
})
