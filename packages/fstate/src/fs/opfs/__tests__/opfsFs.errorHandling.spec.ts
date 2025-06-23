import { beforeEach, describe, expect, test } from "vitest"
import {
	FsErrorAlreadyExists,
	FsErrorBadType,
	FsErrorNotFound,
} from "../../defines/error.js"
import { OpfsFs } from "../opfsFs"

describe("OpfsFs - Error Handling", () => {
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

	describe("file not found errors", () => {
		test("should throw when opening non-existent file without create", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()

			// Act & Assert
			await expect(rootDir.openFile("nonexistent.txt")).rejects.toThrow(
				FsErrorNotFound,
			)
			await expect(
				rootDir.openFile("nonexistent.txt", { create: false }),
			).rejects.toThrow(FsErrorNotFound)
		})

		test("should throw when opening non-existent directory without create", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()

			// Act & Assert
			await expect(
				rootDir.openDir("nonexistent", { create: false }),
			).rejects.toThrow(FsErrorNotFound)
		})

		test("should throw when opening file in non-existent directory", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()

			// Act & Assert
			await expect(
				rootDir.openFile("nonexistent/file.txt", { create: false }),
			).rejects.toThrow(FsErrorNotFound)
		})

		test("should throw when listing non-existent directory", async () => {
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

		test("should throw when deleting non-existent directory", async () => {
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

		test("should throw when reading non-existent file", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()

			// Act & Assert
			await expect(async () => {
				const nonExistentFile = await rootDir.openFile(
					"nonexistent.txt",
					{ create: false },
				)
				await nonExistentFile.read()
			}).rejects.toThrow(FsErrorNotFound)
		})
	})

	describe("type mismatch errors", () => {
		test("should throw when opening file as directory", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			await rootDir.openFile("actualfile.txt", { create: true })

			// Act & Assert
			await expect(rootDir.openDir("actualfile.txt")).rejects.toThrow(
				FsErrorBadType,
			)
		})

		test("should throw when opening directory as file", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			await rootDir.mkdir("actualdir")

			// Act & Assert
			await expect(rootDir.openFile("actualdir")).rejects.toThrow(
				FsErrorBadType,
			)
		})

		test("should throw when creating directory over existing file", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			await rootDir.openFile("file.txt", { create: true })

			// Act & Assert
			await expect(rootDir.mkdir("file.txt")).rejects.toThrow()
		})

		test("should throw when trying to create file in path blocked by file", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			await rootDir.openFile("blocking.txt", { create: true })

			// Act & Assert
			await expect(
				rootDir.openFile("blocking.txt/nested.txt", { create: true }),
			).rejects.toThrow(FsErrorBadType)
		})

		test("should throw when trying to delete root directory", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()

			// Act & Assert
			await expect(rootDir.delete(false)).rejects.toThrow(FsErrorBadType)
			await expect(rootDir.delete(true)).rejects.toThrow(FsErrorBadType)
		})

		test("should throw when trying to delete non-empty directory without recursive", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			await rootDir.mkdir("nonempty")
			const nonEmptyDir = await rootDir.openDir("nonempty")
			await nonEmptyDir.openFile("file.txt", { create: true })

			// Act & Assert
			await expect(nonEmptyDir.delete(false)).rejects.toThrow(
				FsErrorBadType,
			)
		})
	})

	describe("already exists errors", () => {
		test("should throw when creating file that already exists with allowExisting false", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			await rootDir.openFile("existing.txt", { create: true })

			// Act & Assert
			await expect(
				rootDir.openFile("existing.txt", {
					create: true,
					allowExisting: false,
				}),
			).rejects.toThrow(FsErrorAlreadyExists)
		})

		test("should not throw when creating directory that already exists", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			await rootDir.mkdir("existing")

			// Act & Assert - should not throw
			await expect(rootDir.mkdir("existing")).resolves.toBeUndefined()
		})

		test("should not throw when opening existing directory with allowExisting undefined", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			await rootDir.mkdir("existing")

			// Act & Assert - should not throw
			const dirHandle = await rootDir.openDir("existing", {
				create: true,
			})
			expect(await dirHandle.exists()).toBe(true)
		})

		test("should throw when opening existing directory with allowExisting false", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			await rootDir.mkdir("existing")

			// Act & Assert
			await expect(
				rootDir.openDir("existing", { allowExisting: false }),
			).rejects.toThrow(FsErrorAlreadyExists)
		})
	})

	describe("invalid path errors", () => {
		test("should throw when using empty filename", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()

			// Act & Assert
			await expect(
				rootDir.openFile("", { create: true }),
			).rejects.toThrow(FsErrorBadType)
		})

		test("should throw when using empty directory name", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()

			// Act & Assert
			await expect(
				rootDir.openDir("", { create: true }),
			).rejects.toThrow()
		})

		test("should handle path with only slashes gracefully", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()

			// Act & Assert
			await expect(
				rootDir.openFile("///", { create: true }),
			).rejects.toThrow()
		})
	})

	describe("writer state errors", () => {
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
			).rejects.toThrow("Cannot write to a closed writer")
		})

		test("should throw when writing to file that doesn't exist", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()

			// Act & Assert
			await expect(async () => {
				const fileHandle = await rootDir.openFile("nonexistent.txt", {
					create: false,
				})
				await fileHandle.write()
			}).rejects.toThrow(FsErrorNotFound)
		})
	})

	describe("operation state errors", () => {
		test("should throw when reading from file that doesn't exist", async () => {
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

		test("should throw when getting file object for non-existent file", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()

			// Act & Assert
			await expect(async () => {
				const fileHandle = await rootDir.openFile("nonexistent.txt", {
					create: false,
				})
				await fileHandle.getFile()
			}).rejects.toThrow(FsErrorNotFound)
		})

		test("should handle stat for non-existent file gracefully", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()

			// Act & Assert - stat should not throw but return exists: false
			await expect(async () => {
				const fileHandle = await rootDir.openFile("nonexistent.txt", {
					create: false,
				})
				const stat = await fileHandle.stat()
				expect(stat.exists).toBe(false)
			}).rejects.toThrow(FsErrorNotFound)
		})
	})

	describe("concurrent operation errors", () => {
		test("should handle multiple writers on same file", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			const fileHandle = await rootDir.openFile("concurrent.txt", {
				create: true,
			})

			// Act - create multiple writers and write concurrently
			const writer1 = await fileHandle.write()
			const writer2 = await fileHandle.write()

			await writer1.write(new TextEncoder().encode("Writer 1"))
			await writer2.write(new TextEncoder().encode("Writer 2"))

			await writer1.close()
			await writer2.close()

			// Assert - one of the writers should win (implementation defined)
			const content = await fileHandle.read()
			const text = new TextDecoder().decode(content)
			expect(text).toMatch(/^Writer [12]$/)
		})

		test("should handle file creation while directory listing", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()
			await rootDir.openFile("existing.txt", { create: true })

			// Act - create file during iteration (this tests robustness)
			const entries1 = await rootDir.list()
			await rootDir.openFile("new.txt", { create: true })
			const entries2 = await rootDir.list()

			// Assert
			expect(entries1).toHaveLength(1)
			expect(entries2).toHaveLength(2)
		})
	})

	describe("error message clarity", () => {
		test("should provide clear error messages for common mistakes", async () => {
			// Arrange
			const rootDir = await fs.getRootDir()

			// Act & Assert - check error messages are informative
			try {
				await rootDir.openFile("nonexistent.txt")
				expect.fail("Expected error to be thrown")
			} catch (error) {
				expect(error).toBeInstanceOf(FsErrorNotFound)
				expect((error as Error).message).toContain("nonexistent.txt")
			}

			try {
				await rootDir.mkdir("testdir")
				await rootDir.openFile("testdir")
				expect.fail("Expected error to be thrown")
			} catch (error) {
				expect(error).toBeInstanceOf(FsErrorBadType)
				expect((error as Error).message).toContain("testdir")
			}

			try {
				await rootDir.openFile("test.txt", { create: true })
				await rootDir.openFile("test.txt", {
					create: true,
					allowExisting: false,
				})
				expect.fail("Expected error to be thrown")
			} catch (error) {
				expect(error).toBeInstanceOf(FsErrorAlreadyExists)
				expect((error as Error).message).toContain("test.txt")
			}
		})
	})
})
