import { beforeEach, describe, expect, test } from "vitest"
import { FsErrorBadType, FsErrorNotFound } from "../../defines/error"
import { OpfsFs } from "../opfsFs"

describe("OpfsFs - Directory Operations", () => {
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

	describe("mkdir operations", () => {
		test("should create a simple directory", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()

			// Act
			await rootDir.mkdir("testdir")
			// Assert
			const entries = await rootDir.list()
			expect(entries).toHaveLength(1)
			expect(entries[0]!.path.toString()).toBe("testdir")
			expect(entries[0]!.isDirectory).toBe(true)
		})

		test("should create nested directories", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()

			// Act
			await rootDir.mkdir("parent/child/grandchild")

			// Assert
			const rootEntries = await rootDir.list()
			expect(rootEntries).toHaveLength(1)
			expect(rootEntries[0]!.path.toString()).toBe("parent")

			const parentDir = await rootDir.openDir("parent")
			const parentEntries = await parentDir.list()
			expect(parentEntries).toHaveLength(1)
			expect(parentEntries[0]!.path.toString()).toBe("child")

			const childDir = await parentDir.openDir("child")
			const childEntries = await childDir.list()
			expect(childEntries).toHaveLength(1)
			expect(childEntries[0]!.path.toString()).toBe("grandchild")
		})

		test("should not fail when creating existing directory", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			await rootDir.mkdir("testdir")

			// Act & Assert - should not throw
			await expect(rootDir.mkdir("testdir")).resolves.toBeUndefined()

			const entries = await rootDir.list()
			expect(entries).toHaveLength(1)
		})

		test("should fail when trying to create directory over existing file", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			await rootDir.openFile("testfile.txt", { create: true })

			// Act & Assert
			await expect(rootDir.mkdir("testfile.txt")).rejects.toThrow()
		})
	})

	describe("directory existence checks", () => {
		test("should return true for existing directory", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			await rootDir.mkdir("testdir")

			// Act
			const subDir = await rootDir.openDir("testdir")

			// Assert
			expect(await subDir.exists()).toBe(true)
		})

		test("should throw when opening non-existing directory with create false", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()

			// Act & Assert
			await expect(
				rootDir.openDir("nonexistent", { create: false }),
			).rejects.toThrow(FsErrorNotFound)
		})

		test("should return true for root directory", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()

			// Act & Assert
			expect(await rootDir.exists()).toBe(true)
		})
	})

	describe("directory listing", () => {
		test("should list mixed entries correctly", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			await rootDir.mkdir("dir1")
			await rootDir.mkdir("dir2")
			await rootDir.openFile("file1.txt", { create: true })
			await rootDir.openFile("file2.txt", { create: true })

			// Act
			const entries = await rootDir.list()

			// Assert
			expect(entries).toHaveLength(4)

			const dirs = entries.filter((e) => e.isDirectory)
			const files = entries.filter((e) => !e.isDirectory)

			expect(dirs).toHaveLength(2)
			expect(files).toHaveLength(2)

			const dirNames = dirs.map((d) => d.path.toString()).sort()
			const fileNames = files.map((f) => f.path.toString()).sort()

			expect(dirNames).toEqual(["dir1", "dir2"])
			expect(fileNames).toEqual(["file1.txt", "file2.txt"])
		})

		test("should return empty array for empty directory", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			await rootDir.mkdir("emptydir")
			const emptyDir = await rootDir.openDir("emptydir")

			// Act
			const entries = await emptyDir.list()

			// Assert
			expect(entries).toHaveLength(0)
		})

		test("should throw for non-existing directory", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()

			// Act & Assert
			await expect(async () => {
				const nonExistentDir = await rootDir.openDir("nonexistent", {
					create: false,
				})
				await nonExistentDir.list()
			}).rejects.toThrow(FsErrorNotFound)
		})
	})

	describe("directory deletion", () => {
		test("should delete empty directory", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			await rootDir.mkdir("testdir")
			const testDir = await rootDir.openDir("testdir")

			// Act
			await testDir.delete(false)

			// Assert
			const entries = await rootDir.list()
			expect(entries).toHaveLength(0)
		})

		test("should fail to delete non-empty directory without recursive flag", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			await rootDir.mkdir("testdir")
			const testDir = await rootDir.openDir("testdir")
			await testDir.openFile("file.txt", { create: true })

			// Act & Assert
			await expect(testDir.delete(false)).rejects.toThrow(FsErrorBadType)
		})

		test("should delete non-empty directory with recursive flag", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			await rootDir.mkdir("testdir")
			const testDir = await rootDir.openDir("testdir")
			await testDir.openFile("file.txt", { create: true })
			await testDir.mkdir("subdir")

			// Act
			await testDir.delete(true)

			// Assert
			const entries = await rootDir.list()
			expect(entries).toHaveLength(0)
		})

		test("should fail to delete root directory", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()

			// Act & Assert
			await expect(rootDir.delete(false)).rejects.toThrow(FsErrorBadType)
			await expect(rootDir.delete(true)).rejects.toThrow(FsErrorBadType)
		})

		test("should throw when trying to delete non-existing directory", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()

			// Act & Assert
			await expect(async () => {
				const nonExistentDir = await rootDir.openDir("nonexistent", {
					create: false,
				})
				await nonExistentDir.delete(false)
			}).rejects.toThrow(FsErrorNotFound)
		})
	})

	describe("openDir operations", () => {
		test("should open existing directory", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			await rootDir.mkdir("testdir")

			// Act
			const subDir = await rootDir.openDir("testdir")

			// Assert
			expect(subDir).toBeDefined()
			expect(subDir.name).toBe("testdir")
			expect(subDir.path.toString()).toBe("testdir")
			expect(await subDir.exists()).toBe(true)
		})

		test("should create and open directory when create is true", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()

			// Act
			const subDir = await rootDir.openDir("newdir", { create: true })

			// Assert
			expect(subDir).toBeDefined()
			expect(await subDir.exists()).toBe(true)

			const entries = await rootDir.list()
			expect(entries).toHaveLength(1)
			expect(entries[0]!.path.toString()).toBe("newdir")
		})

		test("should throw when opening non-existing directory with create false", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()

			// Act & Assert
			await expect(
				rootDir.openDir("nonexistent", { create: false }),
			).rejects.toThrow(FsErrorNotFound)
		})

		test("should throw when trying to open file as directory", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			await rootDir.openFile("testfile.txt", { create: true })

			// Act & Assert
			await expect(rootDir.openDir("testfile.txt")).rejects.toThrow(
				FsErrorBadType,
			)
		})

		test("should create nested directories recursively", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()

			// Act
			const deepDir = await rootDir.openDir("a/b/c/d", {
				create: true,
				isRecursive: true,
			})

			// Assert
			expect(await deepDir.exists()).toBe(true)
			expect(deepDir.path.toString()).toBe("a/b/c/d")

			// Verify intermediate directories were created
			const dirA = await rootDir.openDir("a")
			expect(await dirA.exists()).toBe(true)

			const dirB = await dirA.openDir("b")
			expect(await dirB.exists()).toBe(true)

			const dirC = await dirB.openDir("c")
			expect(await dirC.exists()).toBe(true)
		})
	})
})
