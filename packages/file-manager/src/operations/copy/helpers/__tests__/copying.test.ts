import { FsWriteMode, InMemoryFs, Path } from "@teawithsand/fstate"
import { Blobs } from "@teawithsand/lngext"
import { afterEach, describe, expect, test, vi } from "vitest"
import { FileAlreadyExistConflictResolutionType } from "../../../conflict"
import { copyDirectory, copyFile } from "../copying"

const writeTextFile = async (
	content: string,
	fs: InMemoryFs,
	path: string,
): Promise<void> => {
	const root = await fs.getRootDir()
	const file = await root.openFile(Path.parse(path), {
		create: true,
		createMissingDirs: true,
	})
	const writer = await file.write({ mode: FsWriteMode.OVERWRITE })
	await writer.write(new Blob([content], { type: "text/plain" }))
	await writer.close()
}

afterEach(() => {
	vi.restoreAllMocks()
})

describe("copying helpers", () => {
	test("copies file content and updates progress", async () => {
		const fs = new InMemoryFs()
		const root = await fs.getRootDir()
		await writeTextFile("hello", fs, "input.txt")
		const inputFile = await root.openFile(Path.parse("input.txt"))
		const outputDir = await root.openDir(Path.fromSegment("out"), {
			create: true,
		})

		const updateCurrentFile = vi.fn()
		const updateProgress = vi.fn()
		const incrementSkipped = vi.fn()

		await copyFile(
			inputFile,
			outputDir,
			Path.parse("input.txt"),
			{
				resolveFileAlreadyExistConflict: async () => ({
					type: FileAlreadyExistConflictResolutionType.OVERWRITE,
				}),
			},
			updateCurrentFile,
			updateProgress,
			incrementSkipped,
		)

		const copied = await outputDir.openFile(Path.parse("input.txt"))
		const text = await Blobs.blobToText(await copied.getFile())

		expect(text).toBe("hello")
		expect(updateCurrentFile).toHaveBeenCalledWith(inputFile)
		expect(updateProgress).toHaveBeenCalledWith(5)
		expect(incrementSkipped).not.toHaveBeenCalled()
	})

	test("skips file when resolver chooses SKIP", async () => {
		const fs = new InMemoryFs()
		const root = await fs.getRootDir()
		await writeTextFile("new", fs, "input.txt")
		const inputFile = await root.openFile(Path.parse("input.txt"))
		const outputDir = await root.openDir(Path.fromSegment("out"), {
			create: true,
		})

		await writeTextFile("existing", fs, "out/input.txt")

		const updateCurrentFile = vi.fn()
		const updateProgress = vi.fn()
		const incrementSkipped = vi.fn()

		await copyFile(
			inputFile,
			outputDir,
			Path.parse("input.txt"),
			{
				resolveFileAlreadyExistConflict: async () => ({
					type: FileAlreadyExistConflictResolutionType.SKIP,
				}),
			},
			updateCurrentFile,
			updateProgress,
			incrementSkipped,
		)

		const copied = await outputDir.openFile(Path.parse("input.txt"))
		const text = await Blobs.blobToText(await copied.getFile())

		expect(text).toBe("existing")
		expect(updateCurrentFile).toHaveBeenCalledWith(inputFile)
		expect(updateProgress).not.toHaveBeenCalled()
		expect(incrementSkipped).toHaveBeenCalledTimes(1)
		// current file should remain set after skip
		expect(updateCurrentFile.mock.calls[0]?.[0]).toBe(inputFile)
	})

	test("creates directory and increments processed counter", async () => {
		const fs = new InMemoryFs()
		const root = await fs.getRootDir()
		const outputDir = await root.openDir(Path.fromSegment("out"), {
			create: true,
		})

		const incrementDirs = vi.fn()
		const incrementDirsSkipped = vi.fn()

		await copyDirectory(
			outputDir,
			Path.parse("nested/dir"),
			{
				resolveFileAlreadyExistConflict: async () => ({
					type: FileAlreadyExistConflictResolutionType.ERROR,
				}),
			},
			incrementDirs,
			incrementDirsSkipped,
		)

		const created = await outputDir.openDir(Path.parse("nested/dir"))
		const stat = await created.stat()

		expect(stat.exists).toBe(true)
		expect(incrementDirs).toHaveBeenCalledTimes(1)
		expect(incrementDirsSkipped).not.toHaveBeenCalled()
	})

	test("increments skipped dirs when conflict resolver skips", async () => {
		const fs = new InMemoryFs()
		const root = await fs.getRootDir()
		const outputDir = await root.openDir(Path.fromSegment("out"), {
			create: true,
		})
		// place file where dir should be created
		await writeTextFile("block", fs, "out/nested/dir")

		const incrementDirs = vi.fn()
		const incrementDirsSkipped = vi.fn()

		await copyDirectory(
			outputDir,
			Path.parse("nested/dir"),
			{
				resolveFileAlreadyExistConflict: async () => ({
					type: FileAlreadyExistConflictResolutionType.SKIP,
				}),
			},
			incrementDirs,
			incrementDirsSkipped,
		)

		expect(incrementDirs).toHaveBeenCalledTimes(1)
		expect(incrementDirsSkipped).toHaveBeenCalledTimes(1)
	})

	test("renames file on conflict and updates progress", async () => {
		const fs = new InMemoryFs()
		const root = await fs.getRootDir()
		await writeTextFile("incoming", fs, "input.txt")
		const inputFile = await root.openFile(Path.parse("input.txt"))
		const outputDir = await root.openDir(Path.fromSegment("out"), {
			create: true,
		})
		await writeTextFile("existing", fs, "out/input.txt")

		const updateCurrentFile = vi.fn()
		const updateProgress = vi.fn()
		const incrementSkipped = vi.fn()

		await copyFile(
			inputFile,
			outputDir,
			Path.parse("input.txt"),
			{
				resolveFileAlreadyExistConflict: async () => ({
					type: FileAlreadyExistConflictResolutionType.RENAME,
					newFileName: "renamed.txt",
				}),
			},
			updateCurrentFile,
			updateProgress,
			incrementSkipped,
		)

		const renamed = await outputDir.openFile(Path.parse("renamed.txt"))
		const renamedContent = await Blobs.blobToText(await renamed.getFile())
		const original = await outputDir.openFile(Path.parse("input.txt"))
		const originalContent = await Blobs.blobToText(await original.getFile())

		expect(renamedContent).toBe("incoming")
		expect(originalContent).toBe("existing")
		expect(updateProgress).toHaveBeenCalledWith(8)
		expect(incrementSkipped).not.toHaveBeenCalled()
	})

	test("counts processed directories when they already exist without skipping", async () => {
		const fs = new InMemoryFs()
		const root = await fs.getRootDir()
		const outputDir = await root.openDir(Path.fromSegment("out"), {
			create: true,
		})
		await outputDir.openDir(Path.parse("nested/dir"), {
			create: true,
			createMissingDirs: true,
		})

		const incrementDirs = vi.fn()
		const incrementDirsSkipped = vi.fn()

		await copyDirectory(
			outputDir,
			Path.parse("nested/dir"),
			{
				resolveFileAlreadyExistConflict: async () => ({
					type: FileAlreadyExistConflictResolutionType.OVERWRITE,
				}),
			},
			incrementDirs,
			incrementDirsSkipped,
		)

		expect(incrementDirs).toHaveBeenCalledTimes(1)
		expect(incrementDirsSkipped).not.toHaveBeenCalled()
	})
})
