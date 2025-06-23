import { describe, expect, test } from "vitest"
import { InMemoryDirNode, InMemoryFileNode, InMemoryNodeUtil } from "./db"

// Helper function to create a temporary parent for testing
const createTempParent = (): InMemoryDirNode => ({
	type: "directory",
	name: "temp",
	parent: null,
	entries: new Map(),
	deleted: false,
})

describe("InMemoryNodeUtil.createEntryByPath", () => {
	test("creates file in root directory", () => {
		// Arrange
		const root = InMemoryNodeUtil.createEmptyRootDir()
		const file: InMemoryFileNode = {
			type: "file",
			name: "",
			parent: createTempParent(),
			content: new Blob(["test"]),
			deleted: false,
		}
		// Act
		InMemoryNodeUtil.createEntryByPath(root, "test.txt", { entry: file })
		// Assert
		const result = root.entries.get("test.txt")
		expect(result).toBe(file)
		expect(file.name).toBe("test.txt")
		expect(file.parent).toBe(root)
	})

	test("throws error when entry exists without override", () => {
		// Arrange
		const root = InMemoryNodeUtil.createEmptyRootDir()
		const existingFile: InMemoryFileNode = {
			type: "file",
			name: "test.txt",
			parent: root,
			content: new Blob(["existing"]),
			deleted: false,
		}
		root.entries.set("test.txt", existingFile)
		const newFile: InMemoryFileNode = {
			type: "file",
			name: "",
			parent: createTempParent(),
			content: new Blob(["new"]),
			deleted: false,
		}
		// Act & Assert
		expect(() =>
			InMemoryNodeUtil.createEntryByPath(root, "test.txt", {
				entry: newFile,
			}),
		).toThrowError("Entry already exists and override is false")
	})

	test("overrides file with file when override is true", () => {
		// Arrange
		const root = InMemoryNodeUtil.createEmptyRootDir()
		const existingFile: InMemoryFileNode = {
			type: "file",
			name: "test.txt",
			parent: root,
			content: new Blob(["existing"]),
			deleted: false,
		}
		root.entries.set("test.txt", existingFile)
		const newFile: InMemoryFileNode = {
			type: "file",
			name: "",
			parent: createTempParent(),
			content: new Blob(["new"]),
			deleted: false,
		}
		// Act
		InMemoryNodeUtil.createEntryByPath(root, "test.txt", {
			entry: newFile,
			override: true,
		})
		// Assert
		const result = root.entries.get("test.txt")
		expect(result).toBe(newFile)
		expect(newFile.name).toBe("test.txt")
		expect(newFile.parent).toBe(root)
	})

	test("returns existing directory when dir->dir override is requested", () => {
		// Arrange
		const root = InMemoryNodeUtil.createEmptyRootDir()
		const existingDir: InMemoryDirNode = {
			type: "directory",
			name: "subdir",
			parent: root,
			entries: new Map(),
			deleted: false,
		}
		root.entries.set("subdir", existingDir)
		const newDir: InMemoryDirNode = {
			type: "directory",
			name: "",
			parent: null,
			entries: new Map(),
			deleted: false,
		}
		// Act
		InMemoryNodeUtil.createEntryByPath(root, "subdir", {
			entry: newDir,
			override: true,
		})
		// Assert
		const result = root.entries.get("subdir")
		expect(result).toBe(existingDir) // Should be the existing directory, not the new one
	})

	test("throws error when trying to override file with directory", () => {
		// Arrange
		const root = InMemoryNodeUtil.createEmptyRootDir()
		const existingFile: InMemoryFileNode = {
			type: "file",
			name: "test",
			parent: root,
			content: new Blob(["data"]),
			deleted: false,
		}
		root.entries.set("test", existingFile)
		const newDir: InMemoryDirNode = {
			type: "directory",
			name: "",
			parent: createTempParent(),
			entries: new Map(),
			deleted: false,
		}
		// Act & Assert
		expect(() =>
			InMemoryNodeUtil.createEntryByPath(root, "test", {
				entry: newDir,
				override: true,
			}),
		).toThrowError("Cannot override file with dir or dir with file")
	})

	test("throws error when trying to override directory with file", () => {
		// Arrange
		const root = InMemoryNodeUtil.createEmptyRootDir()
		const existingDir: InMemoryDirNode = {
			type: "directory",
			name: "test",
			parent: root,
			entries: new Map(),
			deleted: false,
		}
		root.entries.set("test", existingDir)
		const newFile: InMemoryFileNode = {
			type: "file",
			name: "",
			parent: createTempParent(),
			content: new Blob(["data"]),
			deleted: false,
		}
		// Act & Assert
		expect(() =>
			InMemoryNodeUtil.createEntryByPath(root, "test", {
				entry: newFile,
				override: true,
			}),
		).toThrowError("Cannot override file with dir or dir with file")
	})

	test("creates missing directories when createDirs is true", () => {
		// Arrange
		const root = InMemoryNodeUtil.createEmptyRootDir()
		const file: InMemoryFileNode = {
			type: "file",
			name: "",
			parent: createTempParent(),
			content: new Blob(["test"]),
			deleted: false,
		}
		// Act
		InMemoryNodeUtil.createEntryByPath(root, "path/to/file.txt", {
			entry: file,
			createDirs: true,
		})
		// Assert
		const pathDir = root.entries.get("path")
		expect(pathDir).toBeDefined()
		expect(InMemoryNodeUtil.isDirNode(pathDir!)).toBe(true)
		const toDir = (pathDir as InMemoryDirNode).entries.get("to")
		expect(toDir).toBeDefined()
		expect(InMemoryNodeUtil.isDirNode(toDir!)).toBe(true)
		const result = (toDir as InMemoryDirNode).entries.get("file.txt")
		expect(result).toBe(file)
	})

	test("throws error when missing directory and createDirs is false", () => {
		// Arrange
		const root = InMemoryNodeUtil.createEmptyRootDir()
		const file: InMemoryFileNode = {
			type: "file",
			name: "",
			parent: createTempParent(),
			content: new Blob(["test"]),
			deleted: false,
		}
		// Act & Assert
		expect(() =>
			InMemoryNodeUtil.createEntryByPath(root, "missing/file.txt", {
				entry: file,
			}),
		).toThrowError("Missing directory in path and createDirs is false")
	})

	test("throws error when file found in intermediate path", () => {
		// Arrange
		const root = InMemoryNodeUtil.createEmptyRootDir()
		const blockingFile: InMemoryFileNode = {
			type: "file",
			name: "blocking",
			parent: root,
			content: new Blob(["blocker"]),
			deleted: false,
		}
		root.entries.set("blocking", blockingFile)
		const newFile: InMemoryFileNode = {
			type: "file",
			name: "",
			parent: createTempParent(),
			content: new Blob(["new"]),
			deleted: false,
		}
		// Act & Assert
		expect(() =>
			InMemoryNodeUtil.createEntryByPath(root, "blocking/file.txt", {
				entry: newFile,
				createDirs: true,
			}),
		).toThrowError("Expected directory node in path traversal")
	})
})
