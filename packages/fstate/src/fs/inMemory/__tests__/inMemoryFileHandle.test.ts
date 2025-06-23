import { describe, expect, test } from "vitest"
import { FsErrorBadType, FsErrorNotFound } from "../../defines/error"
import { Path } from "../../defines/path"
import { FsWriteMode } from "../../defines/writer"
import { InMemoryDirNode, InMemoryFileNode, InMemoryNodeUtil } from "../db"
import { InMemoryFileHandle } from "../inMemoryFileHandle"

describe("InMemoryFileHandle", () => {
	const createTestFileSystem = () => {
		const rootNode: InMemoryDirNode = {
			type: "directory",
			name: "",
			parent: null,
			entries: new Map(),
			deleted: false,
		}

		const fileNode: InMemoryFileNode = {
			type: "file",
			name: "test.txt",
			parent: rootNode,
			content: new Blob(["test content"]),
			deleted: false,
		}

		rootNode.entries.set("test.txt", fileNode)

		return { rootNode, fileNode }
	}

	const createTestFileSystemWithDeletedFile = () => {
		const { rootNode, fileNode } = createTestFileSystem()
		fileNode.deleted = true
		return { rootNode, fileNode }
	}

	const createTestFileSystemWithDirectory = () => {
		const rootNode: InMemoryDirNode = {
			type: "directory",
			name: "",
			parent: null,
			entries: new Map(),
			deleted: false,
		}

		const dirNode: InMemoryDirNode = {
			type: "directory",
			name: "testdir",
			parent: rootNode,
			entries: new Map(),
			deleted: false,
		}

		rootNode.entries.set("testdir", dirNode)

		return { rootNode, dirNode }
	}

	describe("constructor", () => {
		test("should create InMemoryFileHandle with correct properties", () => {
			// Arrange
			const { rootNode } = createTestFileSystem()
			const filePath = new Path("test.txt")

			// Act
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Assert
			expect(handle.name).toBe("test.txt")
			expect(handle.path).toBe(filePath)
		})
	})

	describe("name property", () => {
		test("should return basename of file path", () => {
			// Arrange
			const { rootNode } = createTestFileSystem()
			const filePath = new Path("folder/subfolder/document.pdf")

			// Act
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Assert
			expect(handle.name).toBe("document.pdf")
		})

		test("should return empty string when basename is null", () => {
			// Arrange
			const { rootNode } = createTestFileSystem()
			const filePath = new Path("")

			// Act
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Assert
			expect(handle.name).toBe("")
		})
	})

	describe("path property", () => {
		test("should return the file path", () => {
			// Arrange
			const { rootNode } = createTestFileSystem()
			const filePath = new Path("test.txt")

			// Act
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Assert
			expect(handle.path).toBe(filePath)
		})
	})

	describe("exists", () => {
		test("should return true when file exists and is not deleted", async () => {
			// Arrange
			const { rootNode } = createTestFileSystem()
			const filePath = new Path("test.txt")
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Act
			const exists = await handle.exists()

			// Assert
			expect(exists).toBe(true)
		})

		test("should return false when file does not exist", async () => {
			// Arrange
			const { rootNode } = createTestFileSystem()
			const filePath = new Path("nonexistent.txt")
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Act
			const exists = await handle.exists()

			// Assert
			expect(exists).toBe(false)
		})

		test("should return false when file is deleted", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithDeletedFile()
			const filePath = new Path("test.txt")
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Act
			const exists = await handle.exists()

			// Assert
			expect(exists).toBe(false)
		})

		test("should return false when path points to directory", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithDirectory()
			const filePath = new Path("testdir")
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Act
			const exists = await handle.exists()

			// Assert
			expect(exists).toBe(false)
		})
	})

	describe("read", () => {
		test("should read file content as Uint8Array", async () => {
			// Arrange
			const { rootNode } = createTestFileSystem()
			const filePath = new Path("test.txt")
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Act
			const content = await handle.read()

			// Assert
			expect(content).toBeInstanceOf(Uint8Array)
			const text = new TextDecoder().decode(content)
			expect(text).toBe("test content")
		})

		test("should throw FsErrorNotFound when file does not exist", async () => {
			// Arrange
			const { rootNode } = createTestFileSystem()
			const filePath = new Path("nonexistent.txt")
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Act & Assert
			await expect(handle.read()).rejects.toThrow(FsErrorNotFound)
			await expect(handle.read()).rejects.toThrow(
				"File not found: nonexistent.txt",
			)
		})

		test("should throw FsErrorNotFound when file is deleted", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithDeletedFile()
			const filePath = new Path("test.txt")
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Act & Assert
			await expect(handle.read()).rejects.toThrow(FsErrorNotFound)
			await expect(handle.read()).rejects.toThrow(
				"File not found: test.txt",
			)
		})

		test("should throw FsErrorBadType when path points to directory", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithDirectory()
			const filePath = new Path("testdir")
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Act & Assert
			await expect(handle.read()).rejects.toThrow(FsErrorBadType)
			await expect(handle.read()).rejects.toThrow(
				"Expected file but found directory: testdir",
			)
		})
	})

	describe("getFile", () => {
		test("should return File object with correct name and content", async () => {
			// Arrange
			const { rootNode } = createTestFileSystem()
			const filePath = new Path("test.txt")
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Act
			const file = await handle.getFile()

			// Assert
			expect(file).toBeInstanceOf(File)
			expect(file.name).toBe("test.txt")
			const content = await file.text()
			expect(content).toBe("test content")
		})

		test("should return File object with basename when path has directories", async () => {
			// Arrange
			const { rootNode, fileNode } = createTestFileSystem()
			fileNode.name = "document.pdf"
			rootNode.entries.delete("test.txt")
			rootNode.entries.set("document.pdf", fileNode)
			const filePath = new Path("document.pdf")
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Act
			const file = await handle.getFile()

			// Assert
			expect(file.name).toBe("document.pdf")
		})

		test("should return File object with empty name when basename is null", async () => {
			// Arrange
			const rootNode: InMemoryDirNode = {
				type: "directory",
				name: "",
				parent: null,
				entries: new Map(),
				deleted: false,
			}

			const fileNode: InMemoryFileNode = {
				type: "file",
				name: "emptyname",
				parent: rootNode,
				content: new Blob(["content"]),
				deleted: false,
			}

			rootNode.entries.set("emptyname", fileNode)
			const filePath = new Path("emptyname")
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Act
			const file = await handle.getFile()

			// Assert
			expect(file.name).toBe("emptyname")
		})

		test("should throw FsErrorNotFound when file does not exist", async () => {
			// Arrange
			const { rootNode } = createTestFileSystem()
			const filePath = new Path("nonexistent.txt")
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Act & Assert
			await expect(handle.getFile()).rejects.toThrow(FsErrorNotFound)
			await expect(handle.getFile()).rejects.toThrow(
				"File not found: nonexistent.txt",
			)
		})

		test("should throw FsErrorNotFound when file is deleted", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithDeletedFile()
			const filePath = new Path("test.txt")
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Act & Assert
			await expect(handle.getFile()).rejects.toThrow(FsErrorNotFound)
			await expect(handle.getFile()).rejects.toThrow(
				"File not found: test.txt",
			)
		})

		test("should throw FsErrorBadType when path points to directory", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithDirectory()
			const filePath = new Path("testdir")
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Act & Assert
			await expect(handle.getFile()).rejects.toThrow(FsErrorBadType)
			await expect(handle.getFile()).rejects.toThrow(
				"Expected file but found directory: testdir",
			)
		})
	})

	describe("delete", () => {
		test("should delete existing file", async () => {
			// Arrange
			const { rootNode, fileNode } = createTestFileSystem()
			const filePath = new Path("test.txt")
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Act
			await handle.delete()

			// Assert
			expect(fileNode.deleted).toBe(true)
		})

		test("should throw FsErrorNotFound when file does not exist", async () => {
			// Arrange
			const { rootNode } = createTestFileSystem()
			const filePath = new Path("nonexistent.txt")
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Act & Assert
			await expect(handle.delete()).rejects.toThrow(FsErrorNotFound)
			await expect(handle.delete()).rejects.toThrow(
				"File not found: nonexistent.txt",
			)
		})

		test("should throw FsErrorNotFound when file is already deleted", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithDeletedFile()
			const filePath = new Path("test.txt")
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Act & Assert
			await expect(handle.delete()).rejects.toThrow(FsErrorNotFound)
			await expect(handle.delete()).rejects.toThrow(
				"File not found: test.txt",
			)
		})

		test("should throw FsErrorBadType when path points to directory", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithDirectory()
			const filePath = new Path("testdir")
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Act & Assert
			await expect(handle.delete()).rejects.toThrow(FsErrorBadType)
			await expect(handle.delete()).rejects.toThrow(
				"Expected file but found directory: testdir",
			)
		})
	})

	describe("stat", () => {
		test("should return file stat with exists true and correct size", async () => {
			// Arrange
			const { rootNode } = createTestFileSystem()
			const filePath = new Path("test.txt")
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Act
			const stat = await handle.stat()

			// Assert
			expect(stat.exists).toBe(true)
			expect(stat.size).toBe(12) // "test content" is 12 bytes
		})

		test("should return file stat with exists false when file does not exist", async () => {
			// Arrange
			const { rootNode } = createTestFileSystem()
			const filePath = new Path("nonexistent.txt")
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Act
			const stat = await handle.stat()

			// Assert
			expect(stat.exists).toBe(false)
			expect(stat.size).toBeUndefined()
		})

		test("should return file stat with exists false when file is deleted", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithDeletedFile()
			const filePath = new Path("test.txt")
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Act
			const stat = await handle.stat()

			// Assert
			expect(stat.exists).toBe(false)
			expect(stat.size).toBeUndefined()
		})

		test("should return file stat with exists false when path points to directory", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithDirectory()
			const filePath = new Path("testdir")
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Act
			const stat = await handle.stat()

			// Assert
			expect(stat.exists).toBe(false)
			expect(stat.size).toBeUndefined()
		})
	})

	describe("write", () => {
		test("should return writer for existing file", async () => {
			// Arrange
			const { rootNode } = createTestFileSystem()
			const filePath = new Path("test.txt")
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Act
			const writer = await handle.write()

			// Assert
			expect(writer).toBeDefined()
			expect(typeof writer.write).toBe("function")
			expect(typeof writer.close).toBe("function")
		})

		test("should return writer with specified mode", async () => {
			// Arrange
			const { rootNode } = createTestFileSystem()
			const filePath = new Path("test.txt")
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Act
			const writer = await handle.write({ mode: FsWriteMode.APPEND })

			// Assert
			expect(writer).toBeDefined()
		})

		test("should return writer when options mode is undefined", async () => {
			// Arrange
			const { rootNode } = createTestFileSystem()
			const filePath = new Path("test.txt")
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Act
			const writer = await handle.write({ mode: undefined })

			// Assert
			expect(writer).toBeDefined()
		})

		test("should throw FsErrorNotFound when file does not exist", async () => {
			// Arrange
			const { rootNode } = createTestFileSystem()
			const filePath = new Path("nonexistent.txt")
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Act & Assert
			await expect(handle.write()).rejects.toThrow(FsErrorNotFound)
			await expect(handle.write()).rejects.toThrow(
				"File not found: nonexistent.txt",
			)
		})

		test("should throw FsErrorNotFound when file is deleted", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithDeletedFile()
			const filePath = new Path("test.txt")
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Act & Assert
			await expect(handle.write()).rejects.toThrow(FsErrorNotFound)
			await expect(handle.write()).rejects.toThrow(
				"File not found: test.txt",
			)
		})

		test("should throw FsErrorBadType when path points to directory", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithDirectory()
			const filePath = new Path("testdir")
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Act & Assert
			await expect(handle.write()).rejects.toThrow(FsErrorBadType)
			await expect(handle.write()).rejects.toThrow(
				"Expected file but found directory: testdir",
			)
		})
	})

	describe("error condition coverage", () => {
		test("should throw FsErrorNotFound when node is null in read", async () => {
			// Arrange
			const rootNode: InMemoryDirNode = {
				type: "directory",
				name: "",
				parent: null,
				entries: new Map(),
				deleted: false,
			}
			const filePath = new Path("missing.txt")
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Act & Assert
			await expect(handle.read()).rejects.toThrow(FsErrorNotFound)
			await expect(handle.read()).rejects.toThrow(
				"File not found: missing.txt",
			)
		})

		test("should throw FsErrorNotFound when node is deleted in read", async () => {
			// Arrange
			const { rootNode, fileNode } = createTestFileSystem()
			fileNode.deleted = true
			const filePath = new Path("test.txt")
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Act & Assert
			await expect(handle.read()).rejects.toThrow(FsErrorNotFound)
			await expect(handle.read()).rejects.toThrow(
				"File not found: test.txt",
			)
		})

		test("should throw FsErrorBadType when node is directory in read", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithDirectory()
			const filePath = new Path("testdir")
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Act & Assert
			await expect(handle.read()).rejects.toThrow(FsErrorBadType)
			await expect(handle.read()).rejects.toThrow(
				"Expected file but found directory: testdir",
			)
		})

		test("should throw FsErrorNotFound when node is null in getFile", async () => {
			// Arrange
			const rootNode: InMemoryDirNode = {
				type: "directory",
				name: "",
				parent: null,
				entries: new Map(),
				deleted: false,
			}
			const filePath = new Path("missing.txt")
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Act & Assert
			await expect(handle.getFile()).rejects.toThrow(FsErrorNotFound)
			await expect(handle.getFile()).rejects.toThrow(
				"File not found: missing.txt",
			)
		})

		test("should throw FsErrorNotFound when node is deleted in getFile", async () => {
			// Arrange
			const { rootNode, fileNode } = createTestFileSystem()
			fileNode.deleted = true
			const filePath = new Path("test.txt")
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Act & Assert
			await expect(handle.getFile()).rejects.toThrow(FsErrorNotFound)
			await expect(handle.getFile()).rejects.toThrow(
				"File not found: test.txt",
			)
		})

		test("should throw FsErrorBadType when node is directory in getFile", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithDirectory()
			const filePath = new Path("testdir")
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Act & Assert
			await expect(handle.getFile()).rejects.toThrow(FsErrorBadType)
			await expect(handle.getFile()).rejects.toThrow(
				"Expected file but found directory: testdir",
			)
		})

		test("should throw FsErrorNotFound when node is null in delete", async () => {
			// Arrange
			const rootNode: InMemoryDirNode = {
				type: "directory",
				name: "",
				parent: null,
				entries: new Map(),
				deleted: false,
			}
			const filePath = new Path("missing.txt")
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Act & Assert
			await expect(handle.delete()).rejects.toThrow(FsErrorNotFound)
			await expect(handle.delete()).rejects.toThrow(
				"File not found: missing.txt",
			)
		})

		test("should throw FsErrorNotFound when node is deleted in delete", async () => {
			// Arrange
			const { rootNode, fileNode } = createTestFileSystem()
			fileNode.deleted = true
			const filePath = new Path("test.txt")
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Act & Assert
			await expect(handle.delete()).rejects.toThrow(FsErrorNotFound)
			await expect(handle.delete()).rejects.toThrow(
				"File not found: test.txt",
			)
		})

		test("should throw FsErrorBadType when node is directory in delete", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithDirectory()
			const filePath = new Path("testdir")
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Act & Assert
			await expect(handle.delete()).rejects.toThrow(FsErrorBadType)
			await expect(handle.delete()).rejects.toThrow(
				"Expected file but found directory: testdir",
			)
		})

		test("should throw FsErrorNotFound when node is null in write", async () => {
			// Arrange
			const rootNode: InMemoryDirNode = {
				type: "directory",
				name: "",
				parent: null,
				entries: new Map(),
				deleted: false,
			}
			const filePath = new Path("missing.txt")
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Act & Assert
			await expect(handle.write()).rejects.toThrow(FsErrorNotFound)
			await expect(handle.write()).rejects.toThrow(
				"File not found: missing.txt",
			)
		})

		test("should throw FsErrorNotFound when node is deleted in write", async () => {
			// Arrange
			const { rootNode, fileNode } = createTestFileSystem()
			fileNode.deleted = true
			const filePath = new Path("test.txt")
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Act & Assert
			await expect(handle.write()).rejects.toThrow(FsErrorNotFound)
			await expect(handle.write()).rejects.toThrow(
				"File not found: test.txt",
			)
		})

		test("should throw FsErrorBadType when node is directory in write", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithDirectory()
			const filePath = new Path("testdir")
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Act & Assert
			await expect(handle.write()).rejects.toThrow(FsErrorBadType)
			await expect(handle.write()).rejects.toThrow(
				"Expected file but found directory: testdir",
			)
		})
	})

	describe("edge cases", () => {
		test("should handle file with empty content", async () => {
			// Arrange
			const { rootNode, fileNode } = createTestFileSystem()
			fileNode.content = new Blob([])
			const filePath = new Path("test.txt")
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Act
			const content = await handle.read()
			const file = await handle.getFile()
			const stat = await handle.stat()

			// Assert
			expect(content.length).toBe(0)
			expect(file.size).toBe(0)
			expect(stat.size).toBe(0)
		})

		test("should handle large file content", async () => {
			// Arrange
			const { rootNode, fileNode } = createTestFileSystem()
			const largeContent = "x".repeat(10000)
			fileNode.content = new Blob([largeContent])
			const filePath = new Path("test.txt")
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Act
			const content = await handle.read()
			const stat = await handle.stat()

			// Assert
			expect(content.length).toBe(10000)
			expect(stat.size).toBe(10000)
		})

		test("should handle binary file content", async () => {
			// Arrange
			const { rootNode, fileNode } = createTestFileSystem()
			const binaryData = new Uint8Array([0, 1, 2, 3, 255, 254, 253])
			fileNode.content = new Blob([binaryData])
			fileNode.name = "test.bin"
			rootNode.entries.delete("test.txt")
			rootNode.entries.set("test.bin", fileNode)
			const filePath = new Path("test.bin")
			const handle = new InMemoryFileHandle({ rootNode, filePath })

			// Act
			const content = await handle.read()

			// Assert
			expect(content).toEqual(binaryData)
		})
	})
})
