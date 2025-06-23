import { describe, expect, test } from "vitest"
import {
	InMemoryDirNode,
	InMemoryFileNode,
	InMemoryNodeUtil,
} from "../inMemory/db"

const createSampleTree = (): InMemoryDirNode => {
	const root = InMemoryNodeUtil.createEmptyRootDir()
	const subDir: InMemoryDirNode = {
		type: "directory",
		name: "sub",
		parent: root,
		entries: new Map(),
		deleted: false,
	}
	const file: InMemoryFileNode = {
		type: "file",
		name: "file.txt",
		parent: subDir,
		content: new Blob(["hello"]),
		deleted: false,
	}
	subDir.entries.set("file.txt", file)
	root.entries.set("sub", subDir)
	return root
}

describe("InMemoryNodeUtil.getEntryByPath", () => {
	test("returns correct file node for valid path", () => {
		// Arrange
		const root = createSampleTree()
		// Act
		const result = InMemoryNodeUtil.getEntryByPath(root, "sub/file.txt")
		// Assert
		expect(result).toBeDefined()
		expect(InMemoryNodeUtil.isFileNode(result!)).toBe(true)
		expect(result!.name).toBe("file.txt")
	})

	test("returns undefined for non-existent path", () => {
		// Arrange
		const root = createSampleTree()
		// Act
		const result = InMemoryNodeUtil.getEntryByPath(root, "sub/missing.txt")
		// Assert
		expect(result).toBeUndefined()
	})

	test("returns root node for empty path", () => {
		// Arrange
		const root = createSampleTree()
		// Act
		const result = InMemoryNodeUtil.getEntryByPath(root, "")
		// Assert
		expect(result).toBe(root)
	})

	test("throws FsErrorBadType if a file is found where a directory is expected", () => {
		// Arrange
		const root = InMemoryNodeUtil.createEmptyRootDir()
		const file: InMemoryFileNode = {
			type: "file",
			name: "file.txt",
			parent: root,
			content: new Blob(["data"]),
			deleted: false,
		}
		root.entries.set("file.txt", file)
		// Act & Assert
		expect(() =>
			InMemoryNodeUtil.getEntryByPath(root, "file.txt/shouldNotExist"),
		).toThrowError("Expected directory node in path traversal")
	})

	test("allows last entry to be a file", () => {
		// Arrange
		const root = InMemoryNodeUtil.createEmptyRootDir()
		const file: InMemoryFileNode = {
			type: "file",
			name: "file.txt",
			parent: root,
			content: new Blob(["data"]),
			deleted: false,
		}
		root.entries.set("file.txt", file)
		// Act
		const result = InMemoryNodeUtil.getEntryByPath(root, "file.txt")
		// Assert
		expect(result).toBe(file)
		// Should not throw
	})
})
