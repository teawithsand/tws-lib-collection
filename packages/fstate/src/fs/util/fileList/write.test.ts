import { describe, expect, test } from "vitest"
import { Path } from "../../defines/path"
import { InMemoryFs } from "../../inMemory/fs"
import { ParsedFileListRoot } from "./defines"
import { FileExistsAction, FileListUtils } from "./fileListParser"

describe("FileListUtils.writeToDir", () => {
	test("should write files to root directory", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()

		const file1 = new File(["content1"], "file1.txt", {
			type: "text/plain",
		})
		const file2 = new File(["content2"], "file2.txt", {
			type: "text/plain",
		})

		const root: ParsedFileListRoot<File> = {
			files: [file1, file2],
			children: [],
		}

		// Act
		await FileListUtils.writeToDir(root, rootDir)

		// Assert
		const writtenFile1 = await rootDir.openFile(Path.parse("file1.txt"))
		const writtenFile2 = await rootDir.openFile(Path.parse("file2.txt"))

		const file1Content = await writtenFile1.getFile()
		const file2Content = await writtenFile2.getFile()

		expect(await file1Content.text()).toBe("content1")
		expect(await file2Content.text()).toBe("content2")
		expect(file1Content.name).toBe("file1.txt")
		expect(file2Content.name).toBe("file2.txt")
	})

	test("should create directories and write files in nested structure", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()

		const file1 = new File(["root content"], "root-file.txt", {
			type: "text/plain",
		})
		const file2 = new File(["dir content"], "dir-file.txt", {
			type: "text/plain",
		})
		const file3 = new File(["nested content"], "nested-file.txt", {
			type: "text/plain",
		})

		const root: ParsedFileListRoot<File> = {
			files: [file1],
			children: [
				{
					name: "subdir",
					files: [file2],
					children: [
						{
							name: "nested",
							files: [file3],
							children: [],
						},
					],
				},
			],
		}

		// Act
		await FileListUtils.writeToDir(root, rootDir)

		// Assert
		// Check root file
		const rootFile = await rootDir.openFile(Path.parse("root-file.txt"))
		const rootFileContent = await rootFile.getFile()
		expect(await rootFileContent.text()).toBe("root content")

		// Check subdirectory file
		const subDir = await rootDir.openDir(Path.parse("subdir"))
		const dirFile = await subDir.openFile(Path.parse("dir-file.txt"))
		const dirFileContent = await dirFile.getFile()
		expect(await dirFileContent.text()).toBe("dir content")

		// Check nested directory file
		const nestedDir = await subDir.openDir(Path.parse("nested"))
		const nestedFile = await nestedDir.openFile(
			Path.parse("nested-file.txt"),
		)
		const nestedFileContent = await nestedFile.getFile()
		expect(await nestedFileContent.text()).toBe("nested content")
	})

	test("should handle empty root structure", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()

		const root: ParsedFileListRoot<File> = {
			files: [],
			children: [],
		}

		// Act
		await FileListUtils.writeToDir(root, rootDir)

		// Assert
		const stat = await rootDir.stat()
		expect(stat.exists).toBe(true)
		expect(stat.entries).toHaveLength(0)
	})

	test("should handle directories without files", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()

		const root: ParsedFileListRoot<File> = {
			files: [],
			children: [
				{
					name: "empty-dir",
					files: [],
					children: [
						{
							name: "nested-empty-dir",
							files: [],
							children: [],
						},
					],
				},
			],
		}

		// Act
		await FileListUtils.writeToDir(root, rootDir)

		// Assert
		const emptyDir = await rootDir.openDir(Path.parse("empty-dir"))
		const emptyStat = await emptyDir.stat()
		expect(emptyStat.exists).toBe(true)
		expect(emptyStat.entries).toHaveLength(1)

		const nestedEmptyDir = await emptyDir.openDir(
			Path.parse("nested-empty-dir"),
		)
		const nestedEmptyStat = await nestedEmptyDir.stat()
		expect(nestedEmptyStat.exists).toBe(true)
		expect(nestedEmptyStat.entries).toHaveLength(0)
	})

	test("should handle files with same names in different directories", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()

		const rootFile = new File(["root same name"], "same-name.txt", {
			type: "text/plain",
		})
		const dir1File = new File(["dir1 same name"], "same-name.txt", {
			type: "text/plain",
		})
		const dir2File = new File(["dir2 same name"], "same-name.txt", {
			type: "text/plain",
		})

		const root: ParsedFileListRoot<File> = {
			files: [rootFile],
			children: [
				{
					name: "dir1",
					files: [dir1File],
					children: [],
				},
				{
					name: "dir2",
					files: [dir2File],
					children: [],
				},
			],
		}

		// Act
		await FileListUtils.writeToDir(root, rootDir)

		// Assert
		const rootFileContent = await (
			await rootDir.openFile(Path.parse("same-name.txt"))
		).getFile()
		expect(await rootFileContent.text()).toBe("root same name")

		const dir1FileContent = await (
			await (
				await rootDir.openDir(Path.parse("dir1"))
			).openFile(Path.parse("same-name.txt"))
		).getFile()
		expect(await dir1FileContent.text()).toBe("dir1 same name")

		const dir2FileContent = await (
			await (
				await rootDir.openDir(Path.parse("dir2"))
			).openFile(Path.parse("same-name.txt"))
		).getFile()
		expect(await dir2FileContent.text()).toBe("dir2 same name")
	})

	test("should handle non-File objects by creating empty files", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()

		const customFileListFile = {
			name: "custom-file.txt",
			webkitRelativePath: "custom-file.txt",
		}

		const root: ParsedFileListRoot<typeof customFileListFile> = {
			files: [customFileListFile],
			children: [],
		}

		// Act
		await FileListUtils.writeToDir(root, rootDir)

		// Assert
		const writtenFile = await rootDir.openFile(
			Path.parse("custom-file.txt"),
		)
		const fileContent = await writtenFile.getFile()
		expect(fileContent.size).toBe(0)
		expect(await fileContent.text()).toBe("")
		expect(fileContent.name).toBe("custom-file.txt")
	})

	test("should handle complex nested structure with mixed content", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()

		const file1 = new File(["readme content"], "README.md", {
			type: "text/markdown",
		})
		const file2 = new File(["index content"], "index.js", {
			type: "text/javascript",
		})
		const file3 = new File(["style content"], "style.css", {
			type: "text/css",
		})
		const file4 = new File(["test content"], "test.js", {
			type: "text/javascript",
		})
		const file5 = new File(["config content"], "config.json", {
			type: "application/json",
		})

		const root: ParsedFileListRoot<File> = {
			files: [file1],
			children: [
				{
					name: "src",
					files: [file2],
					children: [
						{
							name: "styles",
							files: [file3],
							children: [],
						},
					],
				},
				{
					name: "test",
					files: [file4],
					children: [],
				},
				{
					name: "config",
					files: [file5],
					children: [],
				},
			],
		}

		// Act
		await FileListUtils.writeToDir(root, rootDir)

		// Assert
		// Check root level
		const readme = await (
			await rootDir.openFile(Path.parse("README.md"))
		).getFile()
		expect(await readme.text()).toBe("readme content")

		// Check src directory
		const srcDir = await rootDir.openDir(Path.parse("src"))
		const indexFile = await (
			await srcDir.openFile(Path.parse("index.js"))
		).getFile()
		expect(await indexFile.text()).toBe("index content")

		// Check nested styles directory
		const stylesDir = await srcDir.openDir(Path.parse("styles"))
		const styleFile = await (
			await stylesDir.openFile(Path.parse("style.css"))
		).getFile()
		expect(await styleFile.text()).toBe("style content")

		// Check test directory
		const testDir = await rootDir.openDir(Path.parse("test"))
		const testFile = await (
			await testDir.openFile(Path.parse("test.js"))
		).getFile()
		expect(await testFile.text()).toBe("test content")

		// Check config directory
		const configDir = await rootDir.openDir(Path.parse("config"))
		const configFile = await (
			await configDir.openFile(Path.parse("config.json"))
		).getFile()
		expect(await configFile.text()).toBe("config content")
	})

	test("integration: should work with parsed file list from FileListUtils.parse", async () => {
		// Arrange
		const fs = new InMemoryFs()
		const rootDir = await fs.getRootDir()

		// Create mock files as they would come from a file input
		const file1 = new File(["root content"], "root.txt", {
			type: "text/plain",
		})
		Object.defineProperty(file1, "webkitRelativePath", {
			value: "root.txt",
			writable: false,
		})

		const file2 = new File(["nested content"], "nested.txt", {
			type: "text/plain",
		})
		Object.defineProperty(file2, "webkitRelativePath", {
			value: "folder/nested.txt",
			writable: false,
		})

		const file3 = new File(["deep content"], "deep.txt", {
			type: "text/plain",
		})
		Object.defineProperty(file3, "webkitRelativePath", {
			value: "folder/subfolder/deep.txt",
			writable: false,
		})

		const fileList = [file1, file2, file3]

		// Act
		const parsed = FileListUtils.parse(fileList)
		await FileListUtils.writeToDir(parsed, rootDir)

		// Assert
		// Check the structure was created correctly
		const rootFile = await (
			await rootDir.openFile(Path.parse("root.txt"))
		).getFile()
		expect(await rootFile.text()).toBe("root content")

		const folderDir = await rootDir.openDir(Path.parse("folder"))
		const nestedFile = await (
			await folderDir.openFile(Path.parse("nested.txt"))
		).getFile()
		expect(await nestedFile.text()).toBe("nested content")

		const subfolderDir = await folderDir.openDir(Path.parse("subfolder"))
		const deepFile = await (
			await subfolderDir.openFile(Path.parse("deep.txt"))
		).getFile()
		expect(await deepFile.text()).toBe("deep content")
	})

	describe("FileExistsAction behavior", () => {
		test("should throw error when file exists and action is THROW", async () => {
			// Arrange
			const fs = new InMemoryFs()
			const rootDir = await fs.getRootDir()

			// Create initial file
			const initialFile = await rootDir.openFile(Path.parse("test.txt"), {
				create: true,
			})
			const initialWriter = await initialFile.write()
			await initialWriter.write(
				new TextEncoder().encode("initial content"),
			)
			await initialWriter.close()

			// Prepare new content
			const newFile = new File(["new content"], "test.txt", {
				type: "text/plain",
			})
			const root: ParsedFileListRoot<File> = {
				files: [newFile],
				children: [],
			}

			// Act & Assert
			await expect(
				FileListUtils.writeToDir(root, rootDir, {
					onFileExists: FileExistsAction.THROW,
				}),
			).rejects.toThrow("File already exists: test.txt")

			// Verify original content is unchanged
			const existingFile = await rootDir.openFile(Path.parse("test.txt"))
			const existingContent = await existingFile.getFile()
			expect(await existingContent.text()).toBe("initial content")
		})

		test("should ignore existing files when action is IGNORE", async () => {
			// Arrange
			const fs = new InMemoryFs()
			const rootDir = await fs.getRootDir()

			// Create initial files
			const initialFile1 = await rootDir.openFile(
				Path.parse("existing.txt"),
				{
					create: true,
				},
			)
			const initialWriter1 = await initialFile1.write()
			await initialWriter1.write(
				new TextEncoder().encode("original content"),
			)
			await initialWriter1.close()

			// Prepare new content
			const file1 = new File(["new content"], "existing.txt", {
				type: "text/plain",
			})
			const file2 = new File(["fresh content"], "new.txt", {
				type: "text/plain",
			})
			const root: ParsedFileListRoot<File> = {
				files: [file1, file2],
				children: [],
			}

			// Act
			await FileListUtils.writeToDir(root, rootDir, {
				onFileExists: FileExistsAction.IGNORE,
			})

			// Assert
			// Existing file should remain unchanged
			const existingFile = await rootDir.openFile(
				Path.parse("existing.txt"),
			)
			const existingContent = await existingFile.getFile()
			expect(await existingContent.text()).toBe("original content")

			// New file should be created
			const newFile = await rootDir.openFile(Path.parse("new.txt"))
			const newContent = await newFile.getFile()
			expect(await newContent.text()).toBe("fresh content")
		})

		test("should overwrite existing files when action is OVERWRITE (default)", async () => {
			// Arrange
			const fs = new InMemoryFs()
			const rootDir = await fs.getRootDir()

			// Create initial file
			const initialFile = await rootDir.openFile(Path.parse("test.txt"), {
				create: true,
			})
			const initialWriter = await initialFile.write()
			await initialWriter.write(
				new TextEncoder().encode("initial content"),
			)
			await initialWriter.close()

			// Prepare new content
			const newFile = new File(["overwritten content"], "test.txt", {
				type: "text/plain",
			})
			const root: ParsedFileListRoot<File> = {
				files: [newFile],
				children: [],
			}

			// Act
			await FileListUtils.writeToDir(root, rootDir, {
				onFileExists: FileExistsAction.OVERWRITE,
			})

			// Assert
			const updatedFile = await rootDir.openFile(Path.parse("test.txt"))
			const updatedContent = await updatedFile.getFile()
			expect(await updatedContent.text()).toBe("overwritten content")
		})

		test("should overwrite existing files when no config is provided (default behavior)", async () => {
			// Arrange
			const fs = new InMemoryFs()
			const rootDir = await fs.getRootDir()

			// Create initial file
			const initialFile = await rootDir.openFile(Path.parse("test.txt"), {
				create: true,
			})
			const initialWriter = await initialFile.write()
			await initialWriter.write(
				new TextEncoder().encode("initial content"),
			)
			await initialWriter.close()

			// Prepare new content
			const newFile = new File(
				["default overwritten content"],
				"test.txt",
				{ type: "text/plain" },
			)
			const root: ParsedFileListRoot<File> = {
				files: [newFile],
				children: [],
			}

			// Act
			await FileListUtils.writeToDir(root, rootDir) // No config parameter

			// Assert
			const updatedFile = await rootDir.openFile(Path.parse("test.txt"))
			const updatedContent = await updatedFile.getFile()
			expect(await updatedContent.text()).toBe(
				"default overwritten content",
			)
		})

		test("should handle nested directories with different file exists actions", async () => {
			// Arrange
			const fs = new InMemoryFs()
			const rootDir = await fs.getRootDir()

			// Create existing nested structure
			const subDir = await rootDir.openDir(Path.parse("subdir"), {
				create: true,
			})
			const existingFile = await subDir.openFile(
				Path.parse("existing.txt"),
				{ create: true },
			)
			const existingWriter = await existingFile.write()
			await existingWriter.write(
				new TextEncoder().encode("original nested content"),
			)
			await existingWriter.close()

			// Prepare new content with nested structure
			const file1 = new File(["root content"], "root.txt", {
				type: "text/plain",
			})
			const file2 = new File(["new nested content"], "existing.txt", {
				type: "text/plain",
			})
			const file3 = new File(["fresh nested content"], "new-nested.txt", {
				type: "text/plain",
			})

			const root: ParsedFileListRoot<File> = {
				files: [file1],
				children: [
					{
						name: "subdir",
						files: [file2, file3],
						children: [],
					},
				],
			}

			// Act
			await FileListUtils.writeToDir(root, rootDir, {
				onFileExists: FileExistsAction.IGNORE,
			})

			// Assert
			// Root file should be created (doesn't exist)
			const rootFile = await rootDir.openFile(Path.parse("root.txt"))
			const rootContent = await rootFile.getFile()
			expect(await rootContent.text()).toBe("root content")

			// Existing nested file should remain unchanged
			const nestedExistingFile = await subDir.openFile(
				Path.parse("existing.txt"),
			)
			const nestedExistingContent = await nestedExistingFile.getFile()
			expect(await nestedExistingContent.text()).toBe(
				"original nested content",
			)

			// New nested file should be created
			const newNestedFile = await subDir.openFile(
				Path.parse("new-nested.txt"),
			)
			const newNestedContent = await newNestedFile.getFile()
			expect(await newNestedContent.text()).toBe("fresh nested content")
		})
	})

	describe("Path escaping prevention", () => {
		test("should handle file names with dots correctly (not treated as path traversal)", async () => {
			// Arrange
			const fs = new InMemoryFs()
			const rootDir = await fs.getRootDir()

			const file1 = new File(["content1"], ".hidden", {
				type: "text/plain",
			})
			const file2 = new File(["content2"], "..valid-name", {
				type: "text/plain",
			})
			const file3 = new File(["content3"], "file.with.dots.txt", {
				type: "text/plain",
			})

			const root: ParsedFileListRoot<File> = {
				files: [file1, file2, file3],
				children: [],
			}

			// Act
			await FileListUtils.writeToDir(root, rootDir)

			// Assert
			const hiddenFile = await rootDir.openFile(Path.parse(".hidden"))
			const hiddenContent = await hiddenFile.getFile()
			expect(await hiddenContent.text()).toBe("content1")

			const validNameFile = await rootDir.openFile(
				Path.parse("..valid-name"),
			)
			const validNameContent = await validNameFile.getFile()
			expect(await validNameContent.text()).toBe("content2")

			const dotsFile = await rootDir.openFile(
				Path.parse("file.with.dots.txt"),
			)
			const dotsContent = await dotsFile.getFile()
			expect(await dotsContent.text()).toBe("content3")
		})

		test("should handle directory names with dots correctly", async () => {
			// Arrange
			const fs = new InMemoryFs()
			const rootDir = await fs.getRootDir()

			const file1 = new File(["content"], "file.txt", {
				type: "text/plain",
			})

			const root: ParsedFileListRoot<File> = {
				files: [],
				children: [
					{
						name: ".hidden-dir",
						files: [file1],
						children: [],
					},
				],
			}

			// Act
			await FileListUtils.writeToDir(root, rootDir)

			// Assert
			const hiddenDir = await rootDir.openDir(Path.parse(".hidden-dir"))
			const fileInHiddenDir = await hiddenDir.openFile(
				Path.parse("file.txt"),
			)
			const content = await fileInHiddenDir.getFile()
			expect(await content.text()).toBe("content")
		})
	})
})
