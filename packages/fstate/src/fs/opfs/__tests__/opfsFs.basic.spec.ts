import { beforeEach, describe, expect, test } from "vitest"
import { OpfsFs } from "../opfsFs"

describe("OpfsFs - Basic Operations", () => {
	let rootDirectoryHandle: FileSystemDirectoryHandle
	let fs: OpfsFs

	beforeEach(async () => {
		// Get a fresh OPFS directory handle for each test
		rootDirectoryHandle = await navigator.storage.getDirectory()

		// Clean up any existing test files
		for await (const [name] of rootDirectoryHandle.entries()) {
			if (name.startsWith("test-")) {
				await rootDirectoryHandle.removeEntry(name, { recursive: true })
			}
		}

		// Create a test-specific subdirectory
		const testDirName = `test-${Date.now()}-${Math.random().toString(36).substring(2)}`
		const testDir = await rootDirectoryHandle.getDirectoryHandle(
			testDirName,
			{ create: true },
		)

		fs = new OpfsFs(testDir)
	})

	test("should create filesystem instance", () => {
		// Assert
		expect(fs).toBeDefined()
		expect(fs).toBeInstanceOf(OpfsFs)
	})

	test("should return root directory handle", async () => {
		// Act
		const rootDir = await fs.getRootDir()

		// Assert
		expect(rootDir).toBeDefined()
		expect(await rootDir.exists()).toBe(true)
		expect(rootDir.name).toBe("")
		expect(rootDir.path.toString()).toBe(".")
	})

	test("should return same root directory instance for multiple calls", async () => {
		// Act
		const rootDir1 = await fs.getRootDir()
		const rootDir2 = await fs.getRootDir()

		// Assert
		expect(rootDir1).toBeDefined()
		expect(rootDir2).toBeDefined()
		// Both should exist and represent the same logical directory
		expect(await rootDir1.exists()).toBe(true)
		expect(await rootDir2.exists()).toBe(true)
		expect(rootDir1.path.toString()).toBe(".")
		expect(rootDir2.path.toString()).toBe(".")
	})

	test("should handle empty filesystem operations", async () => {
		// Act
		const rootDir = await fs.getRootDir()
		const entries = await rootDir.list()

		// Assert
		expect(entries).toHaveLength(0)
		expect(await rootDir.exists()).toBe(true)
	})

	test("should isolate multiple filesystem instances", async () => {
		// Arrange
		const opfsRoot = await navigator.storage.getDirectory()
		const testDirName2 = `test-${Date.now()}-${Math.random().toString(36).substring(2)}`
		const testDir2 = await opfsRoot.getDirectoryHandle(testDirName2, {
			create: true,
		})
		const fs2 = new OpfsFs(testDir2)

		// Act
		const rootDir1 = await fs.getRootDir()
		const rootDir2 = await fs2.getRootDir()

		await rootDir1.mkdir("fs1-dir")
		await rootDir1.openFile("fs1-file.txt", {
			create: true,
		})

		await rootDir2.mkdir("fs2-dir")
		await rootDir2.openFile("fs2-file.txt", {
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
})
