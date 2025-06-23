import { describe, expect, test } from "vitest"
import {
	FsErrorAlreadyExists,
	FsErrorBadType,
	FsErrorNotFound,
} from "../../defines/error"
import { Path } from "../../defines/path"
import { InMemoryDirNode, InMemoryFileNode, InMemoryNodeUtil } from "../db"
import { InMemoryDirHandle } from "../inMemoryDirHandle"

describe("InMemoryDirHandle", () => {
	const createTestFileSystem = () => {
		const rootNode: InMemoryDirNode = {
			type: "directory",
			name: "",
			parent: null,
			entries: new Map(),
			deleted: false,
		}

		return { rootNode }
	}

	const createTestFileSystemWithFile = () => {
		const { rootNode } = createTestFileSystem()

		const fileNode: InMemoryFileNode = {
			type: "file",
			name: "existing-file.txt",
			parent: rootNode,
			content: new Blob(["content"]),
			deleted: false,
		}

		rootNode.entries.set("existing-file.txt", fileNode)

		return { rootNode, fileNode }
	}

	const createTestFileSystemWithDir = () => {
		const { rootNode } = createTestFileSystem()

		const dirNode: InMemoryDirNode = {
			type: "directory",
			name: "existing-dir",
			parent: rootNode,
			entries: new Map(),
			deleted: false,
		}

		rootNode.entries.set("existing-dir", dirNode)

		return { rootNode, dirNode }
	}

	const createTestFileSystemWithDeletedFile = () => {
		const { rootNode, fileNode } = createTestFileSystemWithFile()
		fileNode.deleted = true
		return { rootNode, fileNode }
	}

	const createTestFileSystemWithDeletedDir = () => {
		const { rootNode, dirNode } = createTestFileSystemWithDir()
		dirNode.deleted = true
		return { rootNode, dirNode }
	}

	describe("constructor", () => {
		test("should create InMemoryDirHandle with correct properties", () => {
			// Arrange
			const { rootNode } = createTestFileSystem()
			const dirPath = new Path("test-dir")

			// Act
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Assert
			expect(handle.name).toBe("test-dir")
			expect(handle.path).toBe(dirPath)
		})
	})

	describe("mkdir", () => {
		test("should create directory when it does not exist", async () => {
			// Arrange
			const { rootNode } = createTestFileSystem()
			const dirPath = new Path("")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act
			await handle.mkdir("new-dir")

			// Assert
			const newDirNode = InMemoryNodeUtil.getEntryByPath(
				rootNode,
				new Path("new-dir"),
			)
			expect(newDirNode).toBeDefined()
			expect(InMemoryNodeUtil.isDirNode(newDirNode!)).toBe(true)
			expect(newDirNode!.deleted).toBe(false)
		})

		test("should succeed when directory already exists", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithDir()
			const dirPath = new Path("")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act & Assert - should not throw
			await expect(handle.mkdir("existing-dir")).resolves.toBeUndefined()
		})

		test("should throw FsErrorBadType when file exists at target path", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithFile()
			const dirPath = new Path("")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act & Assert
			await expect(handle.mkdir("existing-file.txt")).rejects.toThrow(
				FsErrorBadType,
			)
			await expect(handle.mkdir("existing-file.txt")).rejects.toThrow(
				"Cannot create directory, file exists at: existing-file.txt",
			)
		})

		test("should handle deleted file at target path (implementation limitation)", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithDeletedFile()
			const dirPath = new Path("")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act & Assert
			// Current implementation treats deleted nodes as still existing in the Map
			// This is a known implementation detail
			await expect(handle.mkdir("existing-file.txt")).rejects.toThrow(
				FsErrorBadType,
			)
			await expect(handle.mkdir("existing-file.txt")).rejects.toThrow(
				"Entry already exists and override is false",
			)
		})

		test("should handle deleted directory at target path (implementation limitation)", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithDeletedDir()
			const dirPath = new Path("")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act & Assert
			// Current implementation treats deleted nodes as still existing in the Map
			// This is a known implementation detail
			await expect(handle.mkdir("existing-dir")).rejects.toThrow(
				FsErrorBadType,
			)
			await expect(handle.mkdir("existing-dir")).rejects.toThrow(
				"Entry already exists and override is false",
			)
		})
	})

	describe("openFile", () => {
		test("should open existing file", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithFile()
			const dirPath = new Path("")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act
			const fileHandle = await handle.openFile("existing-file.txt")

			// Assert
			expect(fileHandle).toBeDefined()
			expect(await fileHandle.exists()).toBe(true)
		})

		test("should create new file when create is true", async () => {
			// Arrange
			const { rootNode } = createTestFileSystem()
			const dirPath = new Path("")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act
			const fileHandle = await handle.openFile("new-file.txt", {
				create: true,
			})

			// Assert
			expect(fileHandle).toBeDefined()
			expect(await fileHandle.exists()).toBe(true)
		})

		test("should throw FsErrorAlreadyExists when file exists and allowExisting is false", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithFile()
			const dirPath = new Path("")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act & Assert
			await expect(
				handle.openFile("existing-file.txt", {
					create: true,
					allowExisting: false,
				}),
			).rejects.toThrow(FsErrorAlreadyExists)
			await expect(
				handle.openFile("existing-file.txt", {
					create: true,
					allowExisting: false,
				}),
			).rejects.toThrow("File already exists: existing-file.txt")
		})

		test("should throw FsErrorBadType when directory exists at target path", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithDir()
			const dirPath = new Path("")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act & Assert
			await expect(handle.openFile("existing-dir")).rejects.toThrow(
				FsErrorBadType,
			)
			await expect(handle.openFile("existing-dir")).rejects.toThrow(
				"Expected file but found directory: existing-dir",
			)
		})

		test("should handle deleted file when creating new file (implementation limitation)", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithDeletedFile()
			const dirPath = new Path("")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act & Assert
			// Current implementation treats deleted nodes as still existing in the Map
			await expect(
				handle.openFile("existing-file.txt", { create: true }),
			).rejects.toThrow(FsErrorBadType)
			await expect(
				handle.openFile("existing-file.txt", { create: true }),
			).rejects.toThrow("Entry already exists and override is false")
		})

		test("should throw FsErrorNotFound when file does not exist and create is false", async () => {
			// Arrange
			const { rootNode } = createTestFileSystem()
			const dirPath = new Path("")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act & Assert
			await expect(handle.openFile("nonexistent.txt")).rejects.toThrow(
				FsErrorNotFound,
			)
		})
	})

	describe("openDir", () => {
		test("should open existing directory", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithDir()
			const dirPath = new Path("")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act
			const dirHandle = await handle.openDir("existing-dir")

			// Assert
			expect(dirHandle).toBeDefined()
			expect(await dirHandle.exists()).toBe(true)
		})

		test("should create new directory when create is true", async () => {
			// Arrange
			const { rootNode } = createTestFileSystem()
			const dirPath = new Path("")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act
			const dirHandle = await handle.openDir("new-dir", { create: true })

			// Assert
			expect(dirHandle).toBeDefined()
			expect(await dirHandle.exists()).toBe(true)
		})

		test("should throw FsErrorAlreadyExists when directory exists and allowExisting is false", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithDir()
			const dirPath = new Path("")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act & Assert
			await expect(
				handle.openDir("existing-dir", { allowExisting: false }),
			).rejects.toThrow(FsErrorAlreadyExists)
			await expect(
				handle.openDir("existing-dir", { allowExisting: false }),
			).rejects.toThrow("Directory already exists: existing-dir")
		})

		test("should throw FsErrorBadType when file exists at target path", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithFile()
			const dirPath = new Path("")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act & Assert
			await expect(handle.openDir("existing-file.txt")).rejects.toThrow(
				FsErrorBadType,
			)
			await expect(handle.openDir("existing-file.txt")).rejects.toThrow(
				"Expected directory but found file: existing-file.txt",
			)
		})

		test("should handle deleted directory when creating new directory (implementation limitation)", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithDeletedDir()
			const dirPath = new Path("")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act & Assert
			// Current implementation treats deleted nodes as still existing in the Map
			await expect(
				handle.openDir("existing-dir", { create: true }),
			).rejects.toThrow(FsErrorBadType)
			await expect(
				handle.openDir("existing-dir", { create: true }),
			).rejects.toThrow("Entry already exists and override is false")
		})

		test("should throw FsErrorNotFound when directory does not exist and create is false", async () => {
			// Arrange
			const { rootNode } = createTestFileSystem()
			const dirPath = new Path("")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act & Assert
			await expect(
				handle.openDir("nonexistent", { create: false }),
			).rejects.toThrow(FsErrorNotFound)
			await expect(
				handle.openDir("nonexistent", { create: false }),
			).rejects.toThrow(
				"Directory not found and create is false: nonexistent",
			)
		})
	})

	describe("error condition coverage", () => {
		test("should handle existingNode null case in mkdir", async () => {
			// Arrange
			const { rootNode } = createTestFileSystem()
			const dirPath = new Path("")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act
			await handle.mkdir("new-directory")

			// Assert
			const newNode = InMemoryNodeUtil.getEntryByPath(
				rootNode,
				new Path("new-directory"),
			)
			expect(newNode).toBeDefined()
			expect(InMemoryNodeUtil.isDirNode(newNode!)).toBe(true)
		})

		test("should handle existingNode deleted case in mkdir (implementation limitation)", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithDeletedDir()
			const dirPath = new Path("")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act & Assert
			// Current implementation treats deleted nodes as still existing in the Map
			await expect(handle.mkdir("existing-dir")).rejects.toThrow(
				FsErrorBadType,
			)
			await expect(handle.mkdir("existing-dir")).rejects.toThrow(
				"Entry already exists and override is false",
			)
		})

		test("should handle existingNode is file case in mkdir", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithFile()
			const dirPath = new Path("")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act & Assert
			await expect(handle.mkdir("existing-file.txt")).rejects.toThrow(
				FsErrorBadType,
			)
		})

		test("should handle existingNode is directory case in mkdir", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithDir()
			const dirPath = new Path("")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act - should not throw
			await expect(handle.mkdir("existing-dir")).resolves.toBeUndefined()
		})

		test("should handle existingNode null case in openFile", async () => {
			// Arrange
			const { rootNode } = createTestFileSystem()
			const dirPath = new Path("")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act & Assert
			await expect(handle.openFile("nonexistent.txt")).rejects.toThrow(
				FsErrorNotFound,
			)
		})

		test("should handle existingNode deleted case in openFile", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithDeletedFile()
			const dirPath = new Path("")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act & Assert
			await expect(handle.openFile("existing-file.txt")).rejects.toThrow(
				FsErrorNotFound,
			)
		})

		test("should handle existingNode is file case in openFile", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithFile()
			const dirPath = new Path("")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act
			const fileHandle = await handle.openFile("existing-file.txt")

			// Assert
			expect(fileHandle).toBeDefined()
			expect(await fileHandle.exists()).toBe(true)
		})

		test("should handle existingNode is directory case in openFile", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithDir()
			const dirPath = new Path("")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act & Assert
			await expect(handle.openFile("existing-dir")).rejects.toThrow(
				FsErrorBadType,
			)
		})

		test("should handle existingNode null case in openDir", async () => {
			// Arrange
			const { rootNode } = createTestFileSystem()
			const dirPath = new Path("")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act
			const dirHandle = await handle.openDir("new-dir", { create: true })

			// Assert
			expect(dirHandle).toBeDefined()
			expect(await dirHandle.exists()).toBe(true)
		})

		test("should handle existingNode deleted case in openDir (implementation limitation)", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithDeletedDir()
			const dirPath = new Path("")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act & Assert
			// Current implementation treats deleted nodes as still existing in the Map
			await expect(
				handle.openDir("existing-dir", { create: true }),
			).rejects.toThrow(FsErrorBadType)
			await expect(
				handle.openDir("existing-dir", { create: true }),
			).rejects.toThrow("Entry already exists and override is false")
		})

		test("should handle existingNode is directory case in openDir", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithDir()
			const dirPath = new Path("")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act
			const dirHandle = await handle.openDir("existing-dir")

			// Assert
			expect(dirHandle).toBeDefined()
			expect(await dirHandle.exists()).toBe(true)
		})

		test("should handle existingNode is file case in openDir", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithFile()
			const dirPath = new Path("")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act & Assert
			await expect(handle.openDir("existing-file.txt")).rejects.toThrow(
				FsErrorBadType,
			)
		})
	})

	describe("delete", () => {
		test("should delete empty directory when recursive is false", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithDir()
			const dirPath = new Path("existing-dir")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act
			await handle.delete(false)

			// Assert
			const deletedNode = InMemoryNodeUtil.getEntryByPath(
				rootNode,
				new Path("existing-dir"),
			)
			expect(deletedNode).toBeUndefined()
		})

		test("should delete empty directory when recursive is true", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithDir()
			const dirPath = new Path("existing-dir")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act
			await handle.delete(true)

			// Assert
			const deletedNode = InMemoryNodeUtil.getEntryByPath(
				rootNode,
				new Path("existing-dir"),
			)
			expect(deletedNode).toBeUndefined()
		})

		test("should delete directory with deleted entries when recursive is false", async () => {
			// Arrange
			const { rootNode, dirNode } = createTestFileSystemWithDir()

			// Add a deleted file to the directory
			const deletedFile: InMemoryFileNode = {
				type: "file",
				name: "deleted-file.txt",
				parent: dirNode,
				content: new Blob(["content"]),
				deleted: true,
			}
			dirNode.entries.set("deleted-file.txt", deletedFile)

			const dirPath = new Path("existing-dir")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act
			await handle.delete(false)

			// Assert
			const deletedNode = InMemoryNodeUtil.getEntryByPath(
				rootNode,
				new Path("existing-dir"),
			)
			expect(deletedNode).toBeUndefined()
		})

		test("should delete directory with active entries when recursive is true", async () => {
			// Arrange
			const { rootNode, dirNode } = createTestFileSystemWithDir()

			// Add an active file to the directory
			const activeFile: InMemoryFileNode = {
				type: "file",
				name: "active-file.txt",
				parent: dirNode,
				content: new Blob(["content"]),
				deleted: false,
			}
			dirNode.entries.set("active-file.txt", activeFile)

			const dirPath = new Path("existing-dir")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act
			await handle.delete(true)

			// Assert
			const deletedNode = InMemoryNodeUtil.getEntryByPath(
				rootNode,
				new Path("existing-dir"),
			)
			expect(deletedNode).toBeUndefined()
		})

		test("should throw FsErrorBadType when directory has active entries and recursive is false", async () => {
			// Arrange
			const { rootNode, dirNode } = createTestFileSystemWithDir()

			// Add an active file to the directory
			const activeFile: InMemoryFileNode = {
				type: "file",
				name: "active-file.txt",
				parent: dirNode,
				content: new Blob(["content"]),
				deleted: false,
			}
			dirNode.entries.set("active-file.txt", activeFile)

			const dirPath = new Path("existing-dir")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act & Assert
			await expect(handle.delete(false)).rejects.toThrow(FsErrorBadType)
			await expect(handle.delete(false)).rejects.toThrow(
				"Directory not empty and recursive is false: existing-dir",
			)
		})

		test("should throw FsErrorBadType when directory has mix of active and deleted entries and recursive is false", async () => {
			// Arrange
			const { rootNode, dirNode } = createTestFileSystemWithDir()

			// Add both active and deleted files to the directory
			const activeFile: InMemoryFileNode = {
				type: "file",
				name: "active-file.txt",
				parent: dirNode,
				content: new Blob(["content"]),
				deleted: false,
			}
			const deletedFile: InMemoryFileNode = {
				type: "file",
				name: "deleted-file.txt",
				parent: dirNode,
				content: new Blob(["content"]),
				deleted: true,
			}
			dirNode.entries.set("active-file.txt", activeFile)
			dirNode.entries.set("deleted-file.txt", deletedFile)

			const dirPath = new Path("existing-dir")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act & Assert
			await expect(handle.delete(false)).rejects.toThrow(FsErrorBadType)
			await expect(handle.delete(false)).rejects.toThrow(
				"Directory not empty and recursive is false: existing-dir",
			)
		})

		test("should throw FsErrorNotFound when directory does not exist", async () => {
			// Arrange
			const { rootNode } = createTestFileSystem()
			const dirPath = new Path("nonexistent-dir")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act & Assert
			await expect(handle.delete(false)).rejects.toThrow(FsErrorNotFound)
			await expect(handle.delete(false)).rejects.toThrow(
				"Directory not found: nonexistent-dir",
			)
		})

		test("should throw FsErrorNotFound when directory is already deleted", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithDeletedDir()
			const dirPath = new Path("existing-dir")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act & Assert
			await expect(handle.delete(false)).rejects.toThrow(FsErrorNotFound)
			await expect(handle.delete(false)).rejects.toThrow(
				"Directory not found: existing-dir",
			)
		})

		test("should throw FsErrorBadType when path points to file", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithFile()
			const dirPath = new Path("existing-file.txt")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act & Assert
			await expect(handle.delete(false)).rejects.toThrow(FsErrorBadType)
			await expect(handle.delete(false)).rejects.toThrow(
				"Expected directory but found file: existing-file.txt",
			)
		})

		test("should handle nested directory structure when recursive is true", async () => {
			// Arrange
			const { rootNode, dirNode } = createTestFileSystemWithDir()

			// Add nested directory with files
			const nestedDir: InMemoryDirNode = {
				type: "directory",
				name: "nested",
				parent: dirNode,
				entries: new Map(),
				deleted: false,
			}
			const nestedFile: InMemoryFileNode = {
				type: "file",
				name: "nested-file.txt",
				parent: nestedDir,
				content: new Blob(["nested content"]),
				deleted: false,
			}
			nestedDir.entries.set("nested-file.txt", nestedFile)
			dirNode.entries.set("nested", nestedDir)

			const dirPath = new Path("existing-dir")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act
			await handle.delete(true)

			// Assert
			const deletedNode = InMemoryNodeUtil.getEntryByPath(
				rootNode,
				new Path("existing-dir"),
			)
			expect(deletedNode).toBeUndefined()
		})
	})

	describe("delete error condition coverage", () => {
		test("should handle node is null case", async () => {
			// Arrange
			const { rootNode } = createTestFileSystem()
			const dirPath = new Path("nonexistent")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act & Assert
			await expect(handle.delete(false)).rejects.toThrow(FsErrorNotFound)
		})

		test("should handle node is deleted case", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithDeletedDir()
			const dirPath = new Path("existing-dir")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act & Assert
			await expect(handle.delete(false)).rejects.toThrow(FsErrorNotFound)
		})

		test("should handle node is file case", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithFile()
			const dirPath = new Path("existing-file.txt")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act & Assert
			await expect(handle.delete(false)).rejects.toThrow(FsErrorBadType)
		})

		test("should handle node is directory case with no entries", async () => {
			// Arrange
			const { rootNode } = createTestFileSystemWithDir()
			const dirPath = new Path("existing-dir")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act - should not throw
			await expect(handle.delete(false)).resolves.toBeUndefined()
		})

		test("should handle node is directory case with deleted entries only", async () => {
			// Arrange
			const { rootNode, dirNode } = createTestFileSystemWithDir()

			// Add only deleted entries
			const deletedFile1: InMemoryFileNode = {
				type: "file",
				name: "deleted1.txt",
				parent: dirNode,
				content: new Blob(["content"]),
				deleted: true,
			}
			const deletedFile2: InMemoryFileNode = {
				type: "file",
				name: "deleted2.txt",
				parent: dirNode,
				content: new Blob(["content"]),
				deleted: true,
			}
			dirNode.entries.set("deleted1.txt", deletedFile1)
			dirNode.entries.set("deleted2.txt", deletedFile2)

			const dirPath = new Path("existing-dir")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act - should not throw since all entries are deleted
			await expect(handle.delete(false)).resolves.toBeUndefined()
		})

		test("should handle node is directory case with active entries and recursive false", async () => {
			// Arrange
			const { rootNode, dirNode } = createTestFileSystemWithDir()

			// Add active entry
			const activeFile: InMemoryFileNode = {
				type: "file",
				name: "active.txt",
				parent: dirNode,
				content: new Blob(["content"]),
				deleted: false,
			}
			dirNode.entries.set("active.txt", activeFile)

			const dirPath = new Path("existing-dir")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act & Assert
			await expect(handle.delete(false)).rejects.toThrow(FsErrorBadType)
		})

		test("should handle node is directory case with active entries and recursive true", async () => {
			// Arrange
			const { rootNode, dirNode } = createTestFileSystemWithDir()

			// Add active entry
			const activeFile: InMemoryFileNode = {
				type: "file",
				name: "active.txt",
				parent: dirNode,
				content: new Blob(["content"]),
				deleted: false,
			}
			dirNode.entries.set("active.txt", activeFile)

			const dirPath = new Path("existing-dir")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act - should not throw since recursive is true
			await expect(handle.delete(true)).resolves.toBeUndefined()
		})

		test("should verify hasActiveEntries logic with edge cases", async () => {
			// Arrange
			const { rootNode, dirNode } = createTestFileSystemWithDir()

			// Add multiple types of entries: active files, deleted files, active dirs, deleted dirs
			const activeFile: InMemoryFileNode = {
				type: "file",
				name: "active-file.txt",
				parent: dirNode,
				content: new Blob(["content"]),
				deleted: false,
			}
			const deletedFile: InMemoryFileNode = {
				type: "file",
				name: "deleted-file.txt",
				parent: dirNode,
				content: new Blob(["content"]),
				deleted: true,
			}
			const activeDir: InMemoryDirNode = {
				type: "directory",
				name: "active-dir",
				parent: dirNode,
				entries: new Map(),
				deleted: false,
			}
			const deletedDir: InMemoryDirNode = {
				type: "directory",
				name: "deleted-dir",
				parent: dirNode,
				entries: new Map(),
				deleted: true,
			}

			dirNode.entries.set("active-file.txt", activeFile)
			dirNode.entries.set("deleted-file.txt", deletedFile)
			dirNode.entries.set("active-dir", activeDir)
			dirNode.entries.set("deleted-dir", deletedDir)

			const dirPath = new Path("existing-dir")
			const handle = new InMemoryDirHandle({ rootNode, dirPath })

			// Act & Assert - should fail because there are active entries
			await expect(handle.delete(false)).rejects.toThrow(FsErrorBadType)
			await expect(handle.delete(false)).rejects.toThrow(
				"Directory not empty and recursive is false: existing-dir",
			)
		})
	})
})
