import { describe, expect, test } from "vitest"
import {
	FileListFile,
	ParsedFileListEntry,
	ParsedFileListRoot,
} from "./defines"
import { FileListUtils } from "./fileListParser"

const makeFile = (name: string): FileListFile => {
	return {
		name,
		webkitRelativePath: name,
	}
}

const makeEntry = <T extends FileListFile>(
	name: string,
	files: T[] = [],
	children: ParsedFileListEntry<T>[] = [],
): ParsedFileListEntry<T> => {
	return {
		name,
		files: files as any, // Type mismatch in defines, but this works for testing
		children,
	}
}

const makeRoot = <T extends FileListFile>(
	files: T[] = [],
	children: ParsedFileListEntry<T>[] = [],
): ParsedFileListRoot<T> => {
	return {
		files,
		children,
	}
}

describe("isCanonical", () => {
	test("empty root is canonical", () => {
		const root = makeRoot()
		expect(FileListUtils.isCanonical(root)).toBe(true)
	})

	test("root with single file is canonical", () => {
		const file = makeFile("file.txt")
		const root = makeRoot([file])
		expect(FileListUtils.isCanonical(root)).toBe(true)
	})

	test("root with single directory is canonical", () => {
		const dir = makeEntry("dir")
		const root = makeRoot([], [dir])
		expect(FileListUtils.isCanonical(root)).toBe(true)
	})

	test("root with file and directory is not canonical (violates rule 1)", () => {
		const file = makeFile("file.txt")
		const dir = makeEntry("dir")
		const root = makeRoot([file], [dir])
		expect(FileListUtils.isCanonical(root)).toBe(false)
	})

	test("root with multiple files is not canonical (violates rule 2)", () => {
		const file1 = makeFile("file1.txt")
		const file2 = makeFile("file2.txt")
		const root = makeRoot([file1, file2])
		expect(FileListUtils.isCanonical(root)).toBe(false)
	})

	test("file name with slash is not canonical (violates rule 3)", () => {
		const file = makeFile("folder/file.txt")
		const root = makeRoot([file])
		expect(FileListUtils.isCanonical(root)).toBe(false)
	})

	test("empty file name is not canonical (violates rule 4)", () => {
		const file = makeFile("")
		const root = makeRoot([file])
		expect(FileListUtils.isCanonical(root)).toBe(false)
	})

	test("empty directory name is not canonical (violates rule 4)", () => {
		const dir = makeEntry("")
		const root = makeRoot([], [dir])
		expect(FileListUtils.isCanonical(root)).toBe(false)
	})

	test("directory name with slash is not canonical (violates rule 5)", () => {
		const dir = makeEntry("dir/subdir")
		const root = makeRoot([], [dir])
		expect(FileListUtils.isCanonical(root)).toBe(false)
	})

	test("duplicate directory names are not canonical (violates rule 6)", () => {
		const dir1 = makeEntry("dir")
		const dir2 = makeEntry("dir")
		const root = makeRoot([], [dir1, dir2])
		expect(FileListUtils.isCanonical(root)).toBe(false)
	})

	test("file and directory with same name is not canonical (violates rule 7)", () => {
		const file = makeFile("name")
		const dir = makeEntry("name")
		const entry = makeEntry("parent", [file], [dir])
		const root = makeRoot([], [entry])
		expect(FileListUtils.isCanonical(root)).toBe(false)
	})

	test("nested valid structure is canonical", () => {
		const deepFile = makeFile("deep.txt")
		const deepDir = makeEntry("deep", [deepFile])
		const midDir = makeEntry("mid", [], [deepDir])
		const topDir = makeEntry("top", [], [midDir])
		const root = makeRoot([], [topDir])
		expect(FileListUtils.isCanonical(root)).toBe(true)
	})

	test("nested invalid structure is not canonical", () => {
		const file1 = makeFile("file1.txt")
		const file2 = makeFile("file2.txt")
		const invalidDir = makeEntry("invalid", [file1, file2]) // Multiple files
		const root = makeRoot([], [invalidDir])
		expect(FileListUtils.isCanonical(root)).toBe(false)
	})

	test("complex valid tree structure is canonical", () => {
		const srcFile = makeFile("index.ts")
		const utilsFile = makeFile("helper.ts")
		const testFile = makeFile("test.spec.ts")

		const utilsDir = makeEntry("utils", [utilsFile])
		const testsDir = makeEntry("tests", [testFile])
		const srcDir = makeEntry("src", [], [utilsDir]) // src only has children, no files
		const rootFile = makeEntry("root", [srcFile]) // separate entry for the root file

		const root = makeRoot([], [srcDir, testsDir, rootFile])
		expect(FileListUtils.isCanonical(root)).toBe(true)
	})

	test("directory with both files and children is not canonical", () => {
		const file = makeFile("file.txt")
		const childDir = makeEntry("child")
		const parentDir = makeEntry("parent", [file], [childDir])
		const root = makeRoot([], [parentDir])
		expect(FileListUtils.isCanonical(root)).toBe(false)
	})

	test("multiple levels with violations are not canonical", () => {
		// Create a structure where a deep nested entry violates rules
		const invalidFile = makeFile("bad/file.txt") // File with slash
		const deepDir = makeEntry("deep", [invalidFile])
		const midDir = makeEntry("mid", [], [deepDir])
		const root = makeRoot([], [midDir])
		expect(FileListUtils.isCanonical(root)).toBe(false)
	})

	test("mixed valid and invalid siblings", () => {
		const validFile = makeFile("valid.txt")
		const validDir = makeEntry("valid", [validFile])

		const invalidFile1 = makeFile("invalid1.txt")
		const invalidFile2 = makeFile("invalid2.txt")
		const invalidDir = makeEntry("invalid", [invalidFile1, invalidFile2]) // Multiple files

		const root = makeRoot([], [validDir, invalidDir])
		expect(FileListUtils.isCanonical(root)).toBe(false)
	})

	test("edge case: directory names with special characters are canonical", () => {
		const dir1 = makeEntry("dir-with-dashes")
		const dir2 = makeEntry("dir_with_underscores")
		const dir3 = makeEntry("dir.with.dots")
		const dir4 = makeEntry("dir with spaces")
		const root = makeRoot([], [dir1, dir2, dir3, dir4])
		expect(FileListUtils.isCanonical(root)).toBe(true)
	})

	test("edge case: file names with special characters are canonical", () => {
		const file = makeFile("file-name_with.special@chars!.txt")
		const root = makeRoot([file])
		expect(FileListUtils.isCanonical(root)).toBe(true)
	})
})
