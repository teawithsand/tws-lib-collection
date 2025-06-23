import { describe, expect, test } from "vitest"
import { FsErrorBadType } from "../defines/error"
import { InMemoryDirNode, InMemoryFileNode, InMemoryNodeUtil } from "./db"

describe("InMemoryNodeUtil.removeEntryByPath", () => {
	test("removes file from parent directory", () => {
		// Arrange
		const root = InMemoryNodeUtil.createEmptyRootDir()
		const file: InMemoryFileNode = {
			type: "file",
			name: "test.txt",
			parent: root,
			content: new Blob(["test"]),
			deleted: false,
		}
		root.entries.set("test.txt", file)

		// Act
		InMemoryNodeUtil.removeEntryByPath(file)

		// Assert
		expect(root.entries.has("test.txt")).toBe(false)
		expect(file.deleted).toBe(true)
	})

	test("removes directory from parent directory", () => {
		// Arrange
		const root = InMemoryNodeUtil.createEmptyRootDir()
		const subDir: InMemoryDirNode = {
			type: "directory",
			name: "subdir",
			parent: root,
			entries: new Map(),
			deleted: false,
		}
		root.entries.set("subdir", subDir)

		// Act
		InMemoryNodeUtil.removeEntryByPath(subDir)

		// Assert
		expect(root.entries.has("subdir")).toBe(false)
		expect(subDir.deleted).toBe(true)
	})

	test("marks all children as deleted when removing directory", () => {
		// Arrange
		const root = InMemoryNodeUtil.createEmptyRootDir()
		const subDir: InMemoryDirNode = {
			type: "directory",
			name: "subdir",
			parent: root,
			entries: new Map(),
			deleted: false,
		}
		const file1: InMemoryFileNode = {
			type: "file",
			name: "file1.txt",
			parent: subDir,
			content: new Blob(["content1"]),
			deleted: false,
		}
		const file2: InMemoryFileNode = {
			type: "file",
			name: "file2.txt",
			parent: subDir,
			content: new Blob(["content2"]),
			deleted: false,
		}
		const nestedDir: InMemoryDirNode = {
			type: "directory",
			name: "nested",
			parent: subDir,
			entries: new Map(),
			deleted: false,
		}
		const nestedFile: InMemoryFileNode = {
			type: "file",
			name: "nested.txt",
			parent: nestedDir,
			content: new Blob(["nested"]),
			deleted: false,
		}

		subDir.entries.set("file1.txt", file1)
		subDir.entries.set("file2.txt", file2)
		subDir.entries.set("nested", nestedDir)
		nestedDir.entries.set("nested.txt", nestedFile)
		root.entries.set("subdir", subDir)

		// Act
		InMemoryNodeUtil.removeEntryByPath(subDir)

		// Assert
		expect(root.entries.has("subdir")).toBe(false)
		expect(subDir.deleted).toBe(true)
		expect(file1.deleted).toBe(true)
		expect(file2.deleted).toBe(true)
		expect(nestedDir.deleted).toBe(true)
		expect(nestedFile.deleted).toBe(true)
	})

	test("marks deeply nested children as deleted", () => {
		// Arrange
		const root = InMemoryNodeUtil.createEmptyRootDir()
		const level1: InMemoryDirNode = {
			type: "directory",
			name: "level1",
			parent: root,
			entries: new Map(),
			deleted: false,
		}
		const level2: InMemoryDirNode = {
			type: "directory",
			name: "level2",
			parent: level1,
			entries: new Map(),
			deleted: false,
		}
		const level3: InMemoryDirNode = {
			type: "directory",
			name: "level3",
			parent: level2,
			entries: new Map(),
			deleted: false,
		}
		const deepFile: InMemoryFileNode = {
			type: "file",
			name: "deep.txt",
			parent: level3,
			content: new Blob(["deep content"]),
			deleted: false,
		}

		level1.entries.set("level2", level2)
		level2.entries.set("level3", level3)
		level3.entries.set("deep.txt", deepFile)
		root.entries.set("level1", level1)

		// Act
		InMemoryNodeUtil.removeEntryByPath(level1)

		// Assert
		expect(root.entries.has("level1")).toBe(false)
		expect(level1.deleted).toBe(true)
		expect(level2.deleted).toBe(true)
		expect(level3.deleted).toBe(true)
		expect(deepFile.deleted).toBe(true)
	})

	test("throws FsErrorBadType when trying to remove root directory", () => {
		// Arrange
		const root = InMemoryNodeUtil.createEmptyRootDir()

		// Act & Assert
		expect(() => InMemoryNodeUtil.removeEntryByPath(root)).toThrow(
			FsErrorBadType,
		)
		expect(() => InMemoryNodeUtil.removeEntryByPath(root)).toThrowError(
			"Cannot remove root directory",
		)
	})

	test("handles removal of empty directory", () => {
		// Arrange
		const root = InMemoryNodeUtil.createEmptyRootDir()
		const emptyDir: InMemoryDirNode = {
			type: "directory",
			name: "empty",
			parent: root,
			entries: new Map(),
			deleted: false,
		}
		root.entries.set("empty", emptyDir)

		// Act
		InMemoryNodeUtil.removeEntryByPath(emptyDir)

		// Assert
		expect(root.entries.has("empty")).toBe(false)
		expect(emptyDir.deleted).toBe(true)
	})

	test("removes node from correct parent even when name appears in multiple parents", () => {
		// Arrange
		const root = InMemoryNodeUtil.createEmptyRootDir()
		const subDir1: InMemoryDirNode = {
			type: "directory",
			name: "subdir1",
			parent: root,
			entries: new Map(),
			deleted: false,
		}
		const subDir2: InMemoryDirNode = {
			type: "directory",
			name: "subdir2",
			parent: root,
			entries: new Map(),
			deleted: false,
		}
		const file1: InMemoryFileNode = {
			type: "file",
			name: "same.txt",
			parent: subDir1,
			content: new Blob(["content1"]),
			deleted: false,
		}
		const file2: InMemoryFileNode = {
			type: "file",
			name: "same.txt",
			parent: subDir2,
			content: new Blob(["content2"]),
			deleted: false,
		}

		subDir1.entries.set("same.txt", file1)
		subDir2.entries.set("same.txt", file2)
		root.entries.set("subdir1", subDir1)
		root.entries.set("subdir2", subDir2)

		// Act
		InMemoryNodeUtil.removeEntryByPath(file1)

		// Assert
		expect(subDir1.entries.has("same.txt")).toBe(false)
		expect(subDir2.entries.has("same.txt")).toBe(true)
		expect(file1.deleted).toBe(true)
		expect(file2.deleted).toBe(false)
	})

	test("handles mixed content directory removal", () => {
		// Arrange
		const root = InMemoryNodeUtil.createEmptyRootDir()
		const mixedDir: InMemoryDirNode = {
			type: "directory",
			name: "mixed",
			parent: root,
			entries: new Map(),
			deleted: false,
		}
		const file: InMemoryFileNode = {
			type: "file",
			name: "file.txt",
			parent: mixedDir,
			content: new Blob(["content"]),
			deleted: false,
		}
		const nestedDir: InMemoryDirNode = {
			type: "directory",
			name: "nested",
			parent: mixedDir,
			entries: new Map(),
			deleted: false,
		}
		const nestedFile: InMemoryFileNode = {
			type: "file",
			name: "nested.txt",
			parent: nestedDir,
			content: new Blob(["nested"]),
			deleted: false,
		}

		mixedDir.entries.set("file.txt", file)
		mixedDir.entries.set("nested", nestedDir)
		nestedDir.entries.set("nested.txt", nestedFile)
		root.entries.set("mixed", mixedDir)

		// Act
		InMemoryNodeUtil.removeEntryByPath(mixedDir)

		// Assert
		expect(root.entries.has("mixed")).toBe(false)
		expect(mixedDir.deleted).toBe(true)
		expect(file.deleted).toBe(true)
		expect(nestedDir.deleted).toBe(true)
		expect(nestedFile.deleted).toBe(true)
	})

	test("does not affect parent's other entries", () => {
		// Arrange
		const root = InMemoryNodeUtil.createEmptyRootDir()
		const file1: InMemoryFileNode = {
			type: "file",
			name: "file1.txt",
			parent: root,
			content: new Blob(["content1"]),
			deleted: false,
		}
		const file2: InMemoryFileNode = {
			type: "file",
			name: "file2.txt",
			parent: root,
			content: new Blob(["content2"]),
			deleted: false,
		}
		const dir: InMemoryDirNode = {
			type: "directory",
			name: "dir",
			parent: root,
			entries: new Map(),
			deleted: false,
		}

		root.entries.set("file1.txt", file1)
		root.entries.set("file2.txt", file2)
		root.entries.set("dir", dir)

		// Act
		InMemoryNodeUtil.removeEntryByPath(file1)

		// Assert
		expect(root.entries.has("file1.txt")).toBe(false)
		expect(root.entries.has("file2.txt")).toBe(true)
		expect(root.entries.has("dir")).toBe(true)
		expect(file1.deleted).toBe(true)
		expect(file2.deleted).toBe(false)
		expect(dir.deleted).toBe(false)
	})
})
