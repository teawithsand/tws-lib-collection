import { Blobs } from "@teawithsand/lngext"
import { afterEach, beforeEach, describe, expect, test } from "vitest"
import {
	Fs,
	FsDirOpenOrNullSettings,
	FsDirOpenSettings,
	FsErrorBadPath,
	FsErrorBadType,
	FsErrorNotFound,
	FsFileOpenOrNullSettings,
	FsFileOpenSettings,
} from "../defines"
import { Path } from "../defines/path"
import { FsWriteMode, FsWriteSettings } from "../defines/writer"
import { createTestFs, FsType, TestFs } from "./testingSetup"

const fsTypes = [FsType.IN_MEMORY, FsType.INDEXED_DB, FsType.OPFS]

function blobToString(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = function () {
			resolve(reader.result as string)
		}
		reader.onerror = function () {
			reject(reader.error)
		}
		reader.readAsText(blob)
	})
}

fsTypes.forEach((fsType) => {
	describe(`Basic FS tests - ${fsType}`, () => {
		let fs: Fs
		let testFs: TestFs

		beforeEach(async () => {
			testFs = await createTestFs(fsType)
			fs = testFs.fs
		})

		afterEach(async () => {
			if (testFs) {
				await testFs.release()
			}
		})

		describe("delete", () => {
			test("deletes a file and it no longer exists", async () => {
				// Arrange
				const root = await fs.getRootDir()
				const file = await root.openFile(Path.from("file.txt"), {
					create: true,
				})

				// Act
				await file.delete()
				const stat = await file.stat()

				// Assert
				expect(stat.exists).toBe(false)
			})

			test("deletes an empty directory and it no longer exists", async () => {
				// Arrange
				const root = await fs.getRootDir()
				const dir = await root.openDir(Path.from("dir1"), {
					create: true,
				})

				// Act
				await dir.delete(false)
				const stat = await dir.stat()

				// Assert
				expect(stat.exists).toBe(false)
			})

			test("deleting non-empty directory without recursive throws", async () => {
				// Arrange
				const root = await fs.getRootDir()
				const dir = await root.openDir(Path.from("dir2"), {
					create: true,
				})
				await dir.openFile(Path.from("file.txt"), { create: true })

				// Act & Assert
				await expect(dir.delete(false)).rejects.toThrow()
			})

			test("deleting non-empty directory with recursive removes it", async () => {
				// Arrange
				const root = await fs.getRootDir()
				const dir = await root.openDir(Path.from("dir3"), {
					create: true,
				})
				await dir.openFile(Path.from("file.txt"), { create: true })

				// Act
				await dir.delete(true)
				const stat = await dir.stat()

				// Assert
				expect(stat.exists).toBe(false)
			})

			test("deleting truly non-existent file does not throw", async () => {
				// Arrange
				const root = await fs.getRootDir()
				const file = await root.openFile(Path.from("truly-ghost.txt"), {
					create: true,
				})
				await file.delete() // Delete it first

				// Act & Assert - should not throw when deleting again
				await expect(file.delete()).resolves.not.toThrow()
				const stat = await file.stat()
				expect(stat.exists).toBe(false)
			})

			test.each([true, false])(
				"deleting truly non-existent directory does not throw; recursive = %s",
				async (recursive) => {
					// Arrange
					const root = await fs.getRootDir()
					const dir = await root.openDir(
						Path.from("truly-ghostdir"),
						{
							create: true,
						},
					)
					await dir.delete(recursive) // Delete it first

					// Act & Assert - should not throw when deleting again
					await expect(dir.delete(recursive)).resolves.not.toThrow()
					const stat = await dir.stat()
					expect(stat.exists).toBe(false)
				},
			)
		})

		describe("fs root", () => {
			test.each([true, false])(
				"can delete empty fs root; recursive = %s",
				async (recursive) => {
					// Arrange
					const root = await fs.getRootDir()

					// Act
					await root.delete(recursive)

					// Assert
					// No error means success
				},
			)

			test("deleting non-empty root with recursive false should throw", async () => {
				// Arrange
				const root = await fs.getRootDir()
				await root.openDir(Path.from("subdir"), { create: true })
				await root.openFile(Path.from("data.txt"), { create: true })

				// Act & Assert
				await expect(root.delete(false)).rejects.toThrow()
			})

			test("deleting root directory only removes its contents", async () => {
				// Arrange
				const root = await fs.getRootDir()
				await root.openDir(Path.from("subdir"), { create: true })
				await root.openFile(Path.from("data.txt"), { create: true })

				// Act
				await root.delete(true)
				const res = await root.stat()

				// Assert
				expect(res.exists).toBe(true)
				expect(res.entries.length).toBe(0)
			})

			test("can open root dir with current path and it returns same directory", async () => {
				// Arrange
				const root = await fs.getRootDir()

				// Act
				const dir = await root.openDir(Path.from("."))

				// Assert
				expect(dir.path.equals(root.path)).toBe(true)
			})
		})

		describe("openDir", () => {
			test.each([
				{},
				{ create: false },
				{ create: false, allowExisting: true },
				{ allowExisting: true },
				{ createMissingDirs: false },
				{ create: false, createMissingDirs: true, allowExisting: true },
			])(
				"open dir without create true fails if there is no dir",
				async (settings: FsDirOpenSettings) => {
					if (settings.create) {
						throw new Error(`Create can't be true in this test`)
					}

					const root = await fs.getRootDir()

					await expect(
						root.openDir(Path.from("asdf"), settings),
					).rejects.toThrow(FsErrorNotFound)
				},
			)

			test("can open dir with current path and it returns same directory", async () => {
				// Arrange
				const root = await fs.getRootDir()

				// Act
				const subdirOne = await root.openDir(Path.from("subdir"), {
					create: true,
				})
				const subdirTwo = await subdirOne.openDir(Path.from("."), {
					create: true,
				})

				// Assert
				expect(subdirOne.path.equals(subdirTwo.path)).toBe(true)
			})

			test("opened dir has correct path", async () => {
				// Arrange
				const root = await fs.getRootDir()

				// Act
				const d1 = await root.openDir(Path.from("subdir"), {
					create: true,
				})
				const d2 = await d1.openDir(Path.from("d2"), { create: true })
				const d3 = await d1.openDir(Path.from("d3"), { create: true })
				const d11 = await d2.openDir(Path.from("d11"), { create: true })

				// Assert
				expect(d1.path.equals(Path.from("subdir"))).toBe(true)
				expect(d2.path.equals(Path.from("subdir/d2"))).toBe(true)
				expect(d3.path.equals(Path.from("subdir/d3"))).toBe(true)
				expect(d11.path.equals(Path.from("subdir/d2/d11"))).toBe(true)
			})

			test("can list entries in a directory", async () => {
				// Arrange
				const root = await fs.getRootDir()
				const dir = await root.openDir(Path.from("subdir"), {
					create: true,
				})
				const subDirOne = await dir.openDir(Path.from("asdf"), {
					create: true,
				})
				const subDirTwo = await dir.openDir(Path.from("fdsa"), {
					create: true,
				})
				const fileOne = await dir.openFile(Path.from("2134"), {
					create: true,
				})

				// Act
				const stat = await dir.stat()
				const entryPaths = stat.entries.map((e) => e.path.toString())

				// Assert
				expect(stat.exists).toBe(true)
				expect(stat.entries.length).toBe(3)
				expect(entryPaths).toContain(subDirOne.path.toString())
				expect(entryPaths).toContain(subDirTwo.path.toString())
				expect(entryPaths).toContain(fileOne.path.toString())
			})

			test.each([
				{},
				{ create: true },
				{ allowExisting: true },
				{ create: true, allowExisting: false },
				{ allowExisting: true, create: true },

				{
					allowExisting: true,
					create: true,
					allowMissingParentDirectories: true,
				},
				{
					allowExisting: true,
					create: true,
					allowMissingParentDirectories: false,
				},
			])(
				"opening a dir when it's a file throws",
				async (settings: FsDirOpenSettings) => {
					// Arrange
					const root = await fs.getRootDir()
					const filePath = Path.from("notadir.txt")
					await root.openFile(filePath, { create: true })

					// Act & Assert
					await expect(
						root.openDir(filePath, settings),
					).rejects.toThrow(FsErrorBadType)
				},
			)

			test.each([
				{},
				{
					allowMissingParentDirectories: false,
				},
				{
					allowMissingParentDirectories: true,
				},
			])(
				"opening a dir or null when it's a file throws",
				async (settings: FsDirOpenOrNullSettings) => {
					// Arrange
					const root = await fs.getRootDir()
					const filePath = Path.from("notadir2.txt")
					await root.openFile(filePath, { create: true })

					// Act & Assert
					await expect(
						root.openDirOrNull(filePath, settings),
					).rejects.toThrow()
				},
			)

			test("properly creates directories when set in create directories mode", async () => {
				// Arrange
				const root = await fs.getRootDir()

				// Act
				const path = Path.from("a/b/c/d")
				await root.openDir(path, {
					createMissingDirs: true,
					create: true,
				})

				// Assert

				const aDir = await root.openDir(Path.from("a"))
				const bDir = await aDir.openDir(Path.from("b"))
				const cDir = await bDir.openDir(Path.from("c"))
				const dDir = await cDir.openDir(Path.from("d"))
				const stat = await dDir.stat()
				expect(stat.exists).toBe(true)
			})

			test.each([
				{},
				{ create: true },
				{ allowExisting: true },
				{ create: true, allowExisting: false },
				{ allowExisting: true, create: true },
			])(
				"opening a dir fails when parent directories don't exist",
				async (settings: FsDirOpenSettings) => {
					// Arrange
					const root = await fs.getRootDir()

					// Act & Assert
					const targetPath = Path.from("missing/parent/dirs/target")
					await expect(
						root.openDir(targetPath, settings),
					).rejects.toThrow()
				},
			)

			test.each([{}, { allowMissingParentDirectories: false }])(
				"opening a dir or null fails when parent directories don't exist and allowMissingParentDirectories is false",
				async (settings: FsDirOpenOrNullSettings) => {
					// Arrange
					const root = await fs.getRootDir()

					// Act & Assert
					const targetPath = Path.from("missing/parent/dirs/target")
					await expect(
						root.openDirOrNull(targetPath, settings),
					).rejects.toThrow()
				},
			)

			test("opening a dir or null returns null when parent directories don't exist and allowMissingParentDirectories is true", async () => {
				// Arrange
				const root = await fs.getRootDir()

				// Act
				const targetPath = Path.from("missing/parent/dirs/target")
				const result = await root.openDirOrNull(targetPath, {
					allowMissingParentDirectories: true,
				})

				// Assert
				expect(result).toBe(null)
			})

			test("can open itself using empty path", async () => {
				// Arrange
				const root = await fs.getRootDir()

				// Act
				const dir = await root.openDir(Path.from(""), { create: false })

				// Assert
				expect(dir.path.equals(root.path)).toBe(true)
			})
		})

		describe("openFile", () => {
			test("can't open itself using empty path", async () => {
				const root = await fs.getRootDir()

				await expect(
					root.openFile(Path.from(""), { create: false }),
				).rejects.toThrow(FsErrorBadPath)
			})

			test.each([
				{},
				{ create: false },
				{ create: false, allowExisting: true },
				{ allowExisting: true },
				{ createMissingDirs: false },
				{ create: false, createMissingDirs: true, allowExisting: true },
			])(
				"open file without create true fails if there is no file",
				async (settings: FsFileOpenSettings) => {
					if (settings.create) {
						throw new Error(`Create can't be true in this test`)
					}

					const root = await fs.getRootDir()

					await expect(
						root.openFile(Path.from("asdf"), settings),
					).rejects.toThrow(FsErrorNotFound)
				},
			)

			test("open file without create true fails if there is no file", async () => {
				const root = await fs.getRootDir()

				await expect(root.openFile(Path.from("asdf"))).rejects.toThrow()
			})

			test("opened file has correct path", async () => {
				// Arrange
				const root = await fs.getRootDir()

				// Act
				const f1 = await root.openFile(Path.from("file1.txt"), {
					create: true,
				})
				const d1 = await root.openDir(Path.from("subdir"), {
					create: true,
				})
				const f2 = await d1.openFile(Path.from("file2.txt"), {
					create: true,
				})
				const f3 = await d1.openFile(Path.from("file3.txt"), {
					create: true,
				})
				const d2 = await d1.openDir(Path.from("d2"), { create: true })
				const f4 = await d2.openFile(Path.from("file4.txt"), {
					create: true,
				})

				// Assert
				expect(f1.path.equals(Path.from("file1.txt"))).toBe(true)
				expect(f2.path.equals(Path.from("subdir/file2.txt"))).toBe(true)
				expect(f3.path.equals(Path.from("subdir/file3.txt"))).toBe(true)
				expect(f4.path.equals(Path.from("subdir/d2/file4.txt"))).toBe(
					true,
				)
			})

			test.each([
				{},
				{ create: true },
				{ allowExisting: true },
				{ create: true, allowExisting: false },
				{ allowExisting: true, create: true },
				{
					allowExisting: true,
					create: true,
					allowMissingParentDirectories: true,
				},
				{
					allowExisting: true,
					create: true,
					allowMissingParentDirectories: false,
				},
			])(
				"opening a file when it's a directory throws",
				async (settings: FsFileOpenSettings) => {
					// Arrange
					const root = await fs.getRootDir()
					const dirPath = Path.from("notafile")
					await root.openDir(dirPath, { create: true })

					// Act & Assert
					await expect(
						root.openFile(dirPath, settings),
					).rejects.toThrow()
				},
			)

			test.each([
				{},
				{ create: true },
				{ allowExisting: true },
				{ create: true, allowExisting: false },
				{ allowExisting: true, create: true },
				{
					allowExisting: true,
					create: true,
					allowMissingParentDirectories: true,
				},
				{
					allowExisting: true,
					create: true,
					allowMissingParentDirectories: false,
				},
			])(
				"opening a file when expected directory on path is a file throws",
				async (settings: FsFileOpenSettings) => {
					// Arrange
					const root = await fs.getRootDir()

					const dir = await root.openDir(Path.from("dir"), {
						create: true,
					})
					await dir.openFile(Path.from("file"), { create: true })

					// Act & Assert
					const targetPath = Path.from("dir/file/asdf.txt")
					await expect(
						root.openFile(targetPath, settings),
					).rejects.toThrow()
				},
			)

			test.each([
				{},
				{ allowMissingParentDirectories: false },
				{ allowMissingParentDirectories: true },
			])(
				"opening a file or null when it's a directory throws",
				async (settings: FsFileOpenOrNullSettings) => {
					// Arrange
					const root = await fs.getRootDir()
					const dirPath = Path.from("notafile2")
					await root.openDir(dirPath, { create: true })

					// Act & Assert
					await expect(
						root.openFileOrNull(dirPath, settings),
					).rejects.toThrow()
				},
			)

			test.each([
				{},
				{ allowMissingParentDirectories: false },
				{ allowMissingParentDirectories: true },
			])(
				"opening a file or null when expected directory on path is a file throws",
				async (settings: FsFileOpenOrNullSettings) => {
					// Arrange
					const root = await fs.getRootDir()

					const dir = await root.openDir(Path.from("dir"), {
						create: true,
					})
					await dir.openFile(Path.from("file"), { create: true })

					// Act & Assert
					const targetPath = Path.from("dir/file/asdf.txt")
					await expect(
						root.openFileOrNull(targetPath, settings),
					).rejects.toThrow()
				},
			)

			test("properly creates directories when set in create directories mode", async () => {
				// Arrange
				const root = await fs.getRootDir()

				// Act
				const path = Path.from("a/b/c/file.txt")
				await root.openFile(path, {
					createMissingDirs: true,
					create: true,
				})

				// Assert

				const aDir = await root.openDir(Path.from("a"))
				const bDir = await aDir.openDir(Path.from("b"))
				const cDir = await bDir.openDir(Path.from("c"))

				const cDirFile = await cDir.openFile(Path.from("file.txt"))
				expect(await cDirFile.exists()).toBe(true)
			})

			test.each([
				{},
				{ create: true },
				{ allowExisting: true },
				{ create: true, allowExisting: false },
				{ allowExisting: true, create: true },
			])(
				"opening a file fails when parent directories don't exist",
				async (settings: FsFileOpenSettings) => {
					// Arrange
					const root = await fs.getRootDir()

					// Act & Assert
					const targetPath = Path.from("missing/parent/dirs/file.txt")
					await expect(
						root.openFile(targetPath, settings),
					).rejects.toThrow()
				},
			)

			test.each([{}, { allowMissingParentDirectories: false }])(
				"opening a file or null fails when parent directories don't exist and allowMissingParentDirectories is false",
				async (settings: FsFileOpenOrNullSettings) => {
					// Arrange
					const root = await fs.getRootDir()

					// Act & Assert
					const targetPath = Path.from("missing/parent/dirs/file.txt")
					await expect(
						root.openFileOrNull(targetPath, settings),
					).rejects.toThrow()
				},
			)

			test("opening a file or null returns null when parent directories don't exist and allowMissingParentDirectories is true", async () => {
				// Arrange
				const root = await fs.getRootDir()

				// Act
				const targetPath = Path.from("missing/parent/dirs/file.txt")
				const result = await root.openFileOrNull(targetPath, {
					allowMissingParentDirectories: true,
				})

				// Assert
				expect(result).toBe(null)
			})
		})

		describe("getFile", () => {
			test("gets empty file when file was just created", async () => {
				// Arrange
				const root = await fs.getRootDir()
				const file = await root.openFile(Path.from("nonexistent.txt"), {
					create: true,
				})

				// Act
				const content = await file.getFile()

				// Assert
				expect(content.size).toBe(0)
			})

			test("throws when file does not exist", async () => {
				// Arrange
				const root = await fs.getRootDir()
				const file = await root.openFile(Path.from("nonexistent.txt"), {
					create: true,
				})
				await file.delete()

				// Act & Assert
				await expect(file.getFile()).rejects.toThrow(FsErrorNotFound)
			})
		})

		describe("getFileOrNull", () => {
			test("gets empty file when file was just created", async () => {
				// Arrange
				const root = await fs.getRootDir()
				const file = await root.openFile(Path.from("nonexistent.txt"), {
					create: true,
				})

				// Act
				const content = await file.getFileOrNull()

				// Assert
				expect(content?.size).toBe(0)
			})

			test("returns null when file does not exist", async () => {
				// Arrange
				const root = await fs.getRootDir()
				const file = await root.openFile(Path.from("nonexistent.txt"), {
					create: true,
				})
				await file.delete()

				// Act
				const data = await file.getFileOrNull()

				// Assert
				expect(data).toBe(null)
			})
		})

		describe("file write", () => {
			test.each([
				[FsWriteMode.OVERWRITE, true],
				[FsWriteMode.OVERWRITE, false],
				[FsWriteMode.APPEND, true],
				[FsWriteMode.APPEND, false],
			])(
				"last-close-wins (mode=%s): isWriterOneClosesFirst=%s",
				async (writeMode, isWriterOneClosesFirst) => {
					// Arrange
					const root = await fs.getRootDir()
					const filePath = Path.from(
						`concurrent-writers-${writeMode}.txt`,
					)
					const file = await root.openFile(filePath, { create: true })

					// Act
					const writer1 = await file.write({ mode: writeMode })
					const writer2 = await file.write({ mode: writeMode })

					const writerOneContent = "first"
					const writerTwoContent = "second1234567890"
					await writer1.write(
						new TextEncoder().encode(writerOneContent),
					)
					await writer2.write(
						new TextEncoder().encode(writerTwoContent),
					)

					if (isWriterOneClosesFirst) {
						await writer1.close()
						await writer2.close()
					} else {
						await writer2.close()
						await writer1.close()
					}

					// Assert
					const blob = await file.getFile()
					const text = await blobToString(blob)

					const expectedContent = isWriterOneClosesFirst
						? writerTwoContent
						: writerOneContent
					expect(text).toBe(expectedContent)
				},
			)

			test.each([
				{},
				{ mode: FsWriteMode.OVERWRITE },
				{ mode: FsWriteMode.APPEND },
			])(
				"can write a file with chained write calls",
				async (settings: FsWriteSettings) => {
					// Arrange
					const root = await fs.getRootDir()
					const filePath = Path.from("reappear.txt")
					const file = await root.openFile(filePath, { create: true })

					// Act
					const contentOne = "Hello, World!"
					const contentTwo = "Goodbye, World!"
					const writer = await file.write(settings)
					await writer.write(new TextEncoder().encode(contentOne))
					await writer.write(new TextEncoder().encode(contentTwo))
					await writer.close()

					// Assert
					const stat = await file.stat()
					expect(stat.exists).toBe(true)
					expect(stat.size).toBe(
						contentOne.length + contentTwo.length,
					)

					const blob = await file.getFile()
					const res = await blobToString(blob)
					expect(res).toStrictEqual(contentOne + contentTwo)
				},
			)

			test("append mode appends to file content", async () => {
				// Arrange
				const root = await fs.getRootDir()
				const filePath = Path.from("append-test.txt")
				const file = await root.openFile(filePath, { create: true })

				// Act
				const firstContent = "First line. "
				const secondContent = "Second line."
				const writer1 = await file.write({ mode: FsWriteMode.APPEND })
				await writer1.write(new TextEncoder().encode(firstContent))
				await writer1.close()

				const writer2 = await file.write({ mode: FsWriteMode.APPEND })
				await writer2.write(new TextEncoder().encode(secondContent))
				await writer2.close()

				// Assert
				const blob = await file.getFile()
				const result = await blobToString(blob)
				expect(result).toStrictEqual(firstContent + secondContent)
			})

			test("overwrite mode overwrites file content", async () => {
				// Arrange
				const root = await fs.getRootDir()
				const filePath = Path.from("overwrite-test.txt")
				const file = await root.openFile(filePath, { create: true })

				// Act
				const firstContent = "First line. "
				const secondContent = "Second line."
				const writer1 = await file.write({
					mode: FsWriteMode.OVERWRITE,
				})
				await writer1.write(new TextEncoder().encode(firstContent))
				await writer1.close()

				const writer2 = await file.write({
					mode: FsWriteMode.OVERWRITE,
				})
				await writer2.write(new TextEncoder().encode(secondContent))
				await writer2.close()

				// Assert
				const blob = await file.getFile()
				const result = await blobToString(blob)
				expect(result).toStrictEqual(secondContent)
			})

			test("file content is flushed only after closing writer", async () => {
				// Arrange
				const root = await fs.getRootDir()
				const filePath = Path.from("flush-on-close.txt")
				const file = await root.openFile(filePath, { create: true })

				// Act
				const content = "Should flush on close."
				const writer = await file.write({ mode: FsWriteMode.OVERWRITE })
				await writer.write(new TextEncoder().encode(content))

				// Assert before close: file should be empty or not have the new content
				const blobBefore = await file.getFile()
				const resultBefore = await blobToString(blobBefore)
				expect(resultBefore).not.toStrictEqual(content)

				// Act: close writer
				await writer.close()

				// Assert after close: file should have the new content
				const blobAfter = await file.getFile()
				const resultAfter = await blobToString(blobAfter)
				expect(resultAfter).toStrictEqual(content)
			})
		})

		describe("deleted entries behavior", () => {
			test("delete method throws when there is at least one writer active", async () => {
				// Arrange
				const root = await fs.getRootDir()
				const filePath = Path.from("delete-with-writer.txt")
				const file = await root.openFile(filePath, { create: true })
				const writer = await file.write({})
				await writer.write(new TextEncoder().encode("Hello, World!"))

				// Act & Assert
				await expect(file.delete()).rejects.toThrow()
				await writer.close()
				// After closing writer, delete should succeed
				await expect(file.delete()).resolves.not.toThrow()
			})

			test("file.stat throws if file was deleted and recreated as a directory", async () => {
				// Arrange
				const root = await fs.getRootDir()
				const path = Path.from("file-to-dir.txt")
				const file = await root.openFile(path, { create: true })
				await file.delete()
				await root.openDir(path, { create: true })

				// Act & Assert
				await expect(file.stat()).rejects.toThrow()
			})

			test("dir.stat throws if dir was deleted and recreated as a file", async () => {
				// Arrange
				const root = await fs.getRootDir()
				const path = Path.from("dir-to-file")
				const dir = await root.openDir(path, { create: true })
				await dir.delete(false)
				await root.openFile(path, { create: true })

				// Act & Assert
				await expect(dir.stat()).rejects.toThrow()
			})

			test("file stat.exists is true after recreating at same path", async () => {
				// Arrange
				const root = await fs.getRootDir()
				const filePath = Path.from("reappear.txt")
				const file = await root.openFile(filePath, { create: true })

				// Act
				await file.delete()
				const statAfterDelete = await file.stat()
				const file2 = await root.openFile(filePath, { create: true })
				const statAfterRecreate = await file2.stat()

				// Assert
				expect(statAfterDelete.exists).toBe(false)
				expect(statAfterRecreate.exists).toBe(true)
			})

			test("directory stat.exists is true after recreating at same path", async () => {
				// Arrange
				const root = await fs.getRootDir()
				const dirPath = Path.from("reappeardir")
				const dir = await root.openDir(dirPath, { create: true })

				// Act
				await dir.delete(false)
				const statAfterDelete = await dir.stat()
				const dir2 = await root.openDir(dirPath, { create: true })
				// Create entries in the new directory
				const fileA = await dir2.openFile(Path.from("fileA.txt"), {
					create: true,
				})
				const subDir = await dir2.openDir(Path.from("subdir"), {
					create: true,
				})
				const statAfterRecreate = await dir2.stat()

				// Assert
				expect(statAfterDelete.exists).toBe(false)
				expect(statAfterRecreate.exists).toBe(true)
				const entryPaths = statAfterRecreate.entries.map((e) =>
					e.path.toString(),
				)
				expect(entryPaths).toContain(fileA.path.toString())
				expect(entryPaths).toContain(subDir.path.toString())
			})

			test("directory stat.exists is true after recreating at same path (recursive parent removal)", async () => {
				// Arrange
				const root = await fs.getRootDir()
				const dirPath = Path.from("a/b/c/reappeardir")
				const dir = await root.openDir(dirPath, {
					create: true,
					createMissingDirs: true,
				})

				// Act
				const aDir = await root.openDir(Path.from("a"))
				await aDir.delete(true)
				const statAfterDelete = await dir.stat()
				const dir2 = await root.openDir(dirPath, {
					create: true,
					createMissingDirs: true,
				})
				// Create entries in the new directory
				const fileA = await dir2.openFile(Path.from("fileA.txt"), {
					create: true,
				})
				const subDir = await dir2.openDir(Path.from("subdir"), {
					create: true,
				})
				const statAfterRecreate = await dir2.stat()

				// Assert
				expect(statAfterDelete.exists).toBe(false)
				expect(statAfterRecreate.exists).toBe(true)
				const entryPaths = statAfterRecreate.entries.map((e) =>
					e.path.toString(),
				)
				expect(entryPaths).toContain(fileA.path.toString())
				expect(entryPaths).toContain(subDir.path.toString())
			})

			test("file handle is valid after parent tree removal and recreation", async () => {
				// Arrange
				const root = await fs.getRootDir()
				const filePath = Path.from("a/b/c/file.txt")
				const file = await root.openFile(filePath, {
					create: true,
					createMissingDirs: true,
				})

				// Act
				const aDir = await root.openDir(Path.from("a"))
				await aDir.delete(true)
				// Recreate dir tree and file
				await root.openDir(Path.from("a/b/c"), {
					create: true,
					createMissingDirs: true,
				})
				await root.openFile(filePath, { create: true })
				const oldFileStatAfterRecreate = await file.stat()

				// Assert
				expect(oldFileStatAfterRecreate.exists).toBe(true)
			})

			test("directory handle is valid after parent tree removal and recreation", async () => {
				// Arrange
				const root = await fs.getRootDir()
				const dirPath = Path.from("a/b/c/dir")
				const dir = await root.openDir(dirPath, {
					create: true,
					createMissingDirs: true,
				})

				// Act
				const aDir = await root.openDir(Path.from("a"))
				await aDir.delete(true)
				// Recreate dir tree and directory
				await root.openDir(Path.from("a/b/c"), {
					create: true,
					createMissingDirs: true,
				})

				await root.openDir(dirPath, { create: true })
				const oldDirStatAfterRecreate = await dir.stat()

				// Assert
				expect(oldDirStatAfterRecreate.exists).toBe(true)
			})
		})
	})
})
