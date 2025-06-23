import { describe, expect, test } from "vitest"
import { InMemoryFs } from "../inMemoryFs"

describe("InMemoryFs - Path Handling", () => {
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
