import { describe, expect, test } from "vitest"
import { FileListFile } from "./defines"
import { FileListUtils } from "./fileListParser"

const makeFile = (path: string): FileListFile => {
	return {
		webkitRelativePath: path,
		name: path.split("/").at(-1)!,
	}
}

describe("File list parser", () => {
	test("can parse empty file list", () => {
		const root = FileListUtils.parse([])
		expect(root.children).toEqual([])
		expect(root.files).toEqual([])
	})

	test("can parse simple file list", () => {
		const f1 = makeFile("asdf.txt")
		const f2 = makeFile("fdsa.txt")
		const root = FileListUtils.parse([f1, f2])

		expect(root.children).toEqual([])
		expect(root.files.length).toEqual(2)
		expect(root.files).toEqual(expect.arrayContaining([f1, f2]))
	})

	test("can parse file list with directories", () => {
		const rf1 = makeFile("asdf.txt")
		const d1f1 = makeFile("d1/asdf.txt")
		const d1f2 = makeFile("d1/fdsa.txt")
		const d2f1 = makeFile("d2/asdf.txt")
		const d2f2 = makeFile("d2/asdf.txt")
		const root = FileListUtils.parse([rf1, d1f1, d1f2, d2f1, d2f2])

		// Check root
		expect(root.children.length).toEqual(2)
		expect(root.children.map((e) => e.name)).toEqual(
			expect.arrayContaining(["d1", "d2"]),
		)
		expect(root.files.length).toEqual(1)
		expect(root.files).toEqual([rf1])

		// Check d1
		const d1 = root.children.find((e) => e.name === "d1")
		expect(d1).toBeDefined()
		expect(d1!.files.length).toEqual(2)
		expect(d1!.files.map((f) => f.name)).toEqual(
			expect.arrayContaining(["asdf.txt", "fdsa.txt"]),
		)
		expect(d1!.children).toEqual([])

		// Check d2
		const d2 = root.children.find((e) => e.name === "d2")
		expect(d2).toBeDefined()
		expect(d2!.files.length).toEqual(2)
		expect(d2!.files.map((f) => f.name)).toEqual(
			expect.arrayContaining(["asdf.txt", "asdf.txt"]),
		)
		expect(d2!.children).toEqual([])
	})

	test("can parse deeply nested duplicate paths nested", () => {
		const f1 = makeFile("a/b/c/dup.txt")
		const f2 = makeFile("a/b/c/dup.txt")
		const root = FileListUtils.parse([f1, f2])

		const a = root.children.find((e) => e.name === "a")
		expect(a).toBeDefined()
		const b = a!.children.find((e) => e.name === "b")
		expect(b).toBeDefined()
		const c = b!.children.find((e) => e.name === "c")
		expect(c).toBeDefined()

		expect(c!.children).toEqual([])
		expect(c!.files.length).toEqual(2)
		expect(c!.files).toEqual([f1, f2])
	})

	test("can parse deeply nested duplicate paths in root", () => {
		const f1 = makeFile("dup.txt")
		const f2 = makeFile("dup.txt")
		const root = FileListUtils.parse([f1, f2])

		expect(root.children).toEqual([])
		expect(root.files.length).toEqual(2)
		expect(root.files).toEqual([f1, f2])
	})

	test.each([
		["a", "a/a.txt"],
		["a/a.txt", "a"],
	])(
		"can parse file and directory with same name on path (order: %s, %s)",
		(path1, path2) => {
			const f1 = makeFile(path1)
			const f2 = makeFile(path2)
			const root = FileListUtils.parse([f1, f2])

			// Root should have one file and one child directory
			const rootFile = [f1, f2].find((f) => f.webkitRelativePath === "a")
			const dirFile = [f1, f2].find(
				(f) => f.webkitRelativePath === "a/a.txt",
			)

			expect(root.files.length).toEqual(1)
			expect(root.files).toEqual([rootFile])
			expect(root.children.length).toEqual(1)
			const aDir = root.children.find((e) => e.name === "a")
			expect(aDir).toBeDefined()
			expect(aDir!.files.length).toEqual(1)
			expect(aDir!.files[0]).toEqual(dirFile)
			expect(aDir!.children).toEqual([])
		},
	)

	test("can parse complex nested structure", () => {
		const files = [
			makeFile("package.json"),
			makeFile("README.md"),
			makeFile("src/index.ts"),
			makeFile("src/utils/helper.ts"),
			makeFile("src/utils/constants.ts"),
			makeFile("src/components/Button.tsx"),
			makeFile("src/components/Modal.tsx"),
			makeFile("tests/unit/helper.test.ts"),
			makeFile("tests/integration/app.test.ts"),
			makeFile("docs/README.md"),
		]

		const root = FileListUtils.parse(files)

		// Check root level
		expect(root.files.length).toEqual(2)
		expect(root.files.map((f) => f.name)).toEqual(
			expect.arrayContaining(["package.json", "README.md"]),
		)
		expect(root.children.length).toEqual(3)
		expect(root.children.map((c) => c.name)).toEqual(
			expect.arrayContaining(["src", "tests", "docs"]),
		)

		// Check src directory
		const srcDir = root.children.find((c) => c.name === "src")!
		expect(srcDir.files.length).toEqual(1)
		expect(srcDir.files[0]!.name).toEqual("index.ts")
		expect(srcDir.children.length).toEqual(2)
		expect(srcDir.children.map((c) => c.name)).toEqual(
			expect.arrayContaining(["utils", "components"]),
		)

		// Check src/utils
		const utilsDir = srcDir.children.find((c) => c.name === "utils")!
		expect(utilsDir.files.length).toEqual(2)
		expect(utilsDir.files.map((f) => f.name)).toEqual(
			expect.arrayContaining(["helper.ts", "constants.ts"]),
		)
		expect(utilsDir.children).toEqual([])

		// Check src/components
		const componentsDir = srcDir.children.find(
			(c) => c.name === "components",
		)!
		expect(componentsDir.files.length).toEqual(2)
		expect(componentsDir.files.map((f) => f.name)).toEqual(
			expect.arrayContaining(["Button.tsx", "Modal.tsx"]),
		)
		expect(componentsDir.children).toEqual([])

		// Check tests directory
		const testsDir = root.children.find((c) => c.name === "tests")!
		expect(testsDir.files).toEqual([])
		expect(testsDir.children.length).toEqual(2)
		expect(testsDir.children.map((c) => c.name)).toEqual(
			expect.arrayContaining(["unit", "integration"]),
		)

		// Check tests/unit
		const unitDir = testsDir.children.find((c) => c.name === "unit")!
		expect(unitDir.files.length).toEqual(1)
		expect(unitDir.files[0]!.name).toEqual("helper.test.ts")
		expect(unitDir.children).toEqual([])

		// Check tests/integration
		const integrationDir = testsDir.children.find(
			(c) => c.name === "integration",
		)!
		expect(integrationDir.files.length).toEqual(1)
		expect(integrationDir.files[0]!.name).toEqual("app.test.ts")
		expect(integrationDir.children).toEqual([])

		// Check docs directory
		const docsDir = root.children.find((c) => c.name === "docs")!
		expect(docsDir.files.length).toEqual(1)
		expect(docsDir.files[0]!.name).toEqual("README.md")
		expect(docsDir.children).toEqual([])
	})

	test("handles files with no webkitRelativePath", () => {
		const files: FileListFile[] = [
			{ name: "file1.txt" },
			{ name: "file2.txt" },
		]

		const root = FileListUtils.parse(files)

		expect(root.files.length).toEqual(2)
		expect(root.files.map((f) => f.name)).toEqual(
			expect.arrayContaining(["file1.txt", "file2.txt"]),
		)
		expect(root.children).toEqual([])
	})

	test("handles empty file name with no webkitRelativePath", () => {
		const files: FileListFile[] = [
			{ name: "" },
			{ name: "normal-file.txt" },
		]

		const root = FileListUtils.parse(files)

		expect(root.files.length).toEqual(2)
		expect(root.files.map((f) => f.name)).toEqual(
			expect.arrayContaining(["", "normal-file.txt"]),
		)
		expect(root.children).toEqual([])
	})

	test("handles file name with slashes but no webkitRelativePath", () => {
		const files: FileListFile[] = [
			{ name: "folder/file.txt" },
			{ name: "/root/deep/file.txt" },
			{ name: "normal-file.txt" },
		]

		const root = FileListUtils.parse(files)

		// All files should be treated as root-level files since webkitRelativePath is not set
		expect(root.files.length).toEqual(3)
		expect(root.files.map((f) => f.name)).toEqual(
			expect.arrayContaining([
				"folder/file.txt",
				"/root/deep/file.txt",
				"normal-file.txt",
			]),
		)
		expect(root.children).toEqual([])
	})

	test("handles empty path segments", () => {
		const files = [
			makeFile("dir//file.txt"), // Double slash
			makeFile("/root-file.txt"), // Leading slash
			makeFile("normal/file.txt"),
		]

		const root = FileListUtils.parse(files)

		// Should normalize and handle correctly
		expect(root.files.length).toEqual(1)
		expect(root.files[0]!.name).toEqual("root-file.txt")
		expect(root.children.length).toEqual(2)

		const dirChild = root.children.find((c) => c.name === "dir")
		expect(dirChild).toBeDefined()
		expect(dirChild!.files.length).toEqual(1)
		expect(dirChild!.files[0]!.name).toEqual("file.txt")

		const normalChild = root.children.find((c) => c.name === "normal")
		expect(normalChild).toBeDefined()
		expect(normalChild!.files.length).toEqual(1)
		expect(normalChild!.files[0]!.name).toEqual("file.txt")
	})

	test("handles very deep nesting", () => {
		const deepPath = "a/b/c/d/e/f/g/h/i/j/deep-file.txt"
		const file = makeFile(deepPath)
		const root = FileListUtils.parse([file])

		// Navigate to the deepest level
		let current: any = root
		const expectedPath = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"]

		for (const segment of expectedPath) {
			expect(current.children.length).toEqual(1)
			expect(current.children[0].name).toEqual(segment)
			current = current.children[0]
		}

		expect(current.files.length).toEqual(1)
		expect(current.files[0]!.name).toEqual("deep-file.txt")
		expect(current.children).toEqual([])
	})

	test("maintains file order based on input list order", () => {
		const files = [
			makeFile("third.txt"),
			makeFile("first.txt"),
			makeFile("second.txt"),
			makeFile("dir/c.txt"),
			makeFile("dir/a.txt"),
			makeFile("dir/b.txt"),
		]

		const root = FileListUtils.parse(files)

		// Check root files maintain order
		expect(root.files.length).toEqual(3)
		expect(root.files[0]!.name).toEqual("third.txt")
		expect(root.files[1]!.name).toEqual("first.txt")
		expect(root.files[2]!.name).toEqual("second.txt")

		// Check directory files maintain order
		const dirChild = root.children.find((c) => c.name === "dir")
		expect(dirChild).toBeDefined()
		expect(dirChild!.files.length).toEqual(3)
		expect(dirChild!.files[0]!.name).toEqual("c.txt")
		expect(dirChild!.files[1]!.name).toEqual("a.txt")
		expect(dirChild!.files[2]!.name).toEqual("b.txt")
	})
})
