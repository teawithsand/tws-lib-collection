import { createStore, FsWriteMode, InMemoryFs, Path } from "@teawithsand/fstate"
import { Blobs } from "@teawithsand/lngext"
import { describe, expect, test } from "vitest"
import { OperationStatus } from "../../../commonDefines"
import { FileAlreadyExistConflictResolutionType } from "../../../conflict"
import { CopyEntryOperationStage } from "../../defines"
import {
	FileManagerCopyConflictError,
	FileManagerCopyOperationError,
} from "../../error"
import { CopyEntryOperationRunner } from "../copyEntryOperationRunner"

const writeFile = async (
	content: string,
	path: string,
	fs: InMemoryFs,
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

describe("CopyEntryOperationRunner", () => {
	test("copies file to specific path", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new CopyEntryOperationRunner(store)

		const rootDir = await fs.getRootDir()

		const inputFile = await rootDir.openFile(Path.parse("source.txt"), {
			create: true,
		})
		const writer = await inputFile.write({ mode: FsWriteMode.OVERWRITE })
		await writer.write(new Blob(["content"], { type: "text/plain" }))
		await writer.close()

		const handle = runner.runOperation({
			input: inputFile,
			pathResolutionRoot: rootDir,
			path: Path.parse("output/target.txt"),
		})

		await handle.operationPromise

		expect(store.get(handle.status)).toBe(OperationStatus.SUCCEEDED)

		const state = store.get(handle.state)
		expect(state.stage).toBe(CopyEntryOperationStage.COPYING)
		if (state.stage === CopyEntryOperationStage.COPYING) {
			expect(state.discoveredFiles).toBe(1)
			expect(state.discoveredDirs).toBe(0)
			expect(state.totalFilesProcessed).toBe(1)
		}

		const copiedFile = await rootDir.openFile(
			Path.parse("output/target.txt"),
		)
		const content = await Blobs.blobToText(await copiedFile.getFile())
		expect(content).toBe("content")
	})

	test("copies directory to specific path", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new CopyEntryOperationRunner(store)

		const rootDir = await fs.getRootDir()

		const inputDir = await rootDir.openDir(Path.parse("source"), {
			create: true,
		})

		const file = await inputDir.openFile(Path.parse("file.txt"), {
			create: true,
		})
		const writer = await file.write({ mode: FsWriteMode.OVERWRITE })
		await writer.write(new Blob(["content"], { type: "text/plain" }))
		await writer.close()

		const handle = runner.runOperation({
			input: inputDir,
			pathResolutionRoot: rootDir,
			path: Path.parse("output/targetdir"),
		})

		await handle.operationPromise

		expect(store.get(handle.status)).toBe(OperationStatus.SUCCEEDED)

		const state = store.get(handle.state)
		expect(state.stage).toBe(CopyEntryOperationStage.COPYING)
		if (state.stage === CopyEntryOperationStage.COPYING) {
			expect(state.discoveredFiles).toBe(1)
			expect(state.discoveredDirs).toBe(1)
			expect(state.totalFilesProcessed).toBe(1)
			expect(state.totalDirsProcessed).toBe(1)
		}

		const copiedFile = await rootDir.openFile(
			Path.parse("output/targetdir/file.txt"),
		)
		const content = await Blobs.blobToText(await copiedFile.getFile())
		expect(content).toBe("content")
	})

	test("handles interruption", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new CopyEntryOperationRunner(store)

		const rootDir = await fs.getRootDir()

		const inputDir = await rootDir.openDir(Path.parse("source"), {
			create: true,
		})

		await inputDir.openFile(Path.parse("file1.txt"), { create: true })
		await inputDir.openFile(Path.parse("file2.txt"), { create: true })

		const handle = runner.runOperation({
			input: inputDir,
			pathResolutionRoot: rootDir,
			path: Path.parse("output"),
		})

		store.set(handle.interrupt)

		await expect(handle.operationPromise).rejects.toBeInstanceOf(
			FileManagerCopyOperationError,
		)

		expect(store.get(handle.status)).toBe(OperationStatus.INTERRUPTED)
	})

	test("tracks copy progress correctly", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new CopyEntryOperationRunner(store)

		const rootDir = await fs.getRootDir()

		const inputDir = await rootDir.openDir(Path.parse("source"), {
			create: true,
		})

		const file = await inputDir.openFile(Path.parse("large.txt"), {
			create: true,
		})
		const writer = await file.write({ mode: FsWriteMode.OVERWRITE })
		const largeContent = "x".repeat(1000)
		await writer.write(new Blob([largeContent], { type: "text/plain" }))
		await writer.close()

		const handle = runner.runOperation({
			input: inputDir,
			pathResolutionRoot: rootDir,
			path: Path.parse("output"),
		})

		await handle.operationPromise

		expect(store.get(handle.status)).toBe(OperationStatus.SUCCEEDED)

		const state = store.get(handle.state)
		expect(state.stage).toBe(CopyEntryOperationStage.COPYING)
		if (state.stage === CopyEntryOperationStage.COPYING) {
			expect(state.totalBytesCopied).toBe(1000)
			expect(state.currentInputFile).toBeNull()
		}
	})

	test("handles file conflict with ERROR resolution", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new CopyEntryOperationRunner(store)

		const rootDir = await fs.getRootDir()

		const inputFile = await rootDir.openFile(Path.parse("input.txt"), {
			create: true,
		})
		const writer = await inputFile.write({ mode: FsWriteMode.OVERWRITE })
		await writer.write(new Blob(["content"], { type: "text/plain" }))
		await writer.close()

		await writeFile("existing", "output/input.txt", fs)

		const handle = runner.runOperation({
			input: inputFile,
			pathResolutionRoot: rootDir,
			path: Path.parse("output/input.txt"),
			conflictResolver: {
				resolveFileAlreadyExistConflict: async () => ({
					type: FileAlreadyExistConflictResolutionType.ERROR,
				}),
			},
		})

		await expect(handle.operationPromise).rejects.toBeInstanceOf(
			FileManagerCopyConflictError,
		)

		expect(store.get(handle.status)).toBe(OperationStatus.ERRORED)
		expect(store.get(handle.error)).toBeInstanceOf(
			FileManagerCopyConflictError,
		)
	})

	test("handles file conflict with SKIP resolution", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new CopyEntryOperationRunner(store)

		const rootDir = await fs.getRootDir()

		const inputFile = await rootDir.openFile(Path.parse("input.txt"), {
			create: true,
		})
		const writer = await inputFile.write({ mode: FsWriteMode.OVERWRITE })
		await writer.write(new Blob(["new content"], { type: "text/plain" }))
		await writer.close()

		await writeFile("existing content", "output/input.txt", fs)

		const handle = runner.runOperation({
			input: inputFile,
			pathResolutionRoot: rootDir,
			path: Path.parse("output/input.txt"),
			conflictResolver: {
				resolveFileAlreadyExistConflict: async () => ({
					type: FileAlreadyExistConflictResolutionType.SKIP,
				}),
			},
		})

		await handle.operationPromise

		expect(store.get(handle.status)).toBe(OperationStatus.SUCCEEDED)

		const copiedFile = await rootDir.openFile(
			Path.parse("output/input.txt"),
		)
		const content = await Blobs.blobToText(await copiedFile.getFile())
		expect(content).toBe("existing content")
	})

	test("handles file conflict with OVERWRITE resolution", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new CopyEntryOperationRunner(store)

		const rootDir = await fs.getRootDir()

		const inputFile = await rootDir.openFile(Path.parse("input.txt"), {
			create: true,
		})
		const writer = await inputFile.write({ mode: FsWriteMode.OVERWRITE })
		await writer.write(new Blob(["new content"], { type: "text/plain" }))
		await writer.close()

		await writeFile("existing content", "output/input.txt", fs)

		const handle = runner.runOperation({
			input: inputFile,
			pathResolutionRoot: rootDir,
			path: Path.parse("output/input.txt"),
			conflictResolver: {
				resolveFileAlreadyExistConflict: async () => ({
					type: FileAlreadyExistConflictResolutionType.OVERWRITE,
				}),
			},
		})

		await handle.operationPromise

		expect(store.get(handle.status)).toBe(OperationStatus.SUCCEEDED)

		const copiedFile = await rootDir.openFile(
			Path.parse("output/input.txt"),
		)
		const content = await Blobs.blobToText(await copiedFile.getFile())
		expect(content).toBe("new content")
	})

	test("handles file conflict with RENAME resolution", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new CopyEntryOperationRunner(store)

		const rootDir = await fs.getRootDir()

		const inputFile = await rootDir.openFile(Path.parse("input.txt"), {
			create: true,
		})
		const writer = await inputFile.write({ mode: FsWriteMode.OVERWRITE })
		await writer.write(new Blob(["new content"], { type: "text/plain" }))
		await writer.close()

		await writeFile("existing content", "output/input.txt", fs)

		const handle = runner.runOperation({
			input: inputFile,
			pathResolutionRoot: rootDir,
			path: Path.parse("output/input.txt"),
			conflictResolver: {
				resolveFileAlreadyExistConflict: async () => ({
					type: FileAlreadyExistConflictResolutionType.RENAME,
					newFileName: "input-copy.txt",
				}),
			},
		})

		await handle.operationPromise

		expect(store.get(handle.status)).toBe(OperationStatus.SUCCEEDED)

		const originalFile = await rootDir.openFile(
			Path.parse("output/input.txt"),
		)
		const originalContent = await Blobs.blobToText(
			await originalFile.getFile(),
		)
		expect(originalContent).toBe("existing content")

		const renamedFile = await rootDir.openFile(
			Path.parse("output/input-copy.txt"),
		)
		const renamedContent = await Blobs.blobToText(
			await renamedFile.getFile(),
		)
		expect(renamedContent).toBe("new content")
	})

	test("handles directory conflict when file exists at path", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new CopyEntryOperationRunner(store)

		const rootDir = await fs.getRootDir()

		const inputDir = await rootDir.openDir(Path.parse("source"), {
			create: true,
		})
		await inputDir.openFile(Path.parse("file.txt"), { create: true })

		await writeFile("blocking", "output/source", fs)

		const handle = runner.runOperation({
			input: inputDir,
			pathResolutionRoot: rootDir,
			path: Path.parse("output/source"),
			conflictResolver: {
				resolveFileAlreadyExistConflict: async () => ({
					type: FileAlreadyExistConflictResolutionType.ERROR,
				}),
			},
		})

		await expect(handle.operationPromise).rejects.toBeInstanceOf(
			FileManagerCopyConflictError,
		)

		expect(store.get(handle.status)).toBe(OperationStatus.ERRORED)
	})

	test("handles file conflict when directory exists at path", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new CopyEntryOperationRunner(store)

		const rootDir = await fs.getRootDir()

		const inputFile = await rootDir.openFile(Path.parse("item.txt"), {
			create: true,
		})
		const writer = await inputFile.write({ mode: FsWriteMode.OVERWRITE })
		await writer.write(new Blob(["content"], { type: "text/plain" }))
		await writer.close()

		const outputDir = await rootDir.openDir(Path.parse("output"), {
			create: true,
		})
		await outputDir.openDir(Path.parse("item.txt"), { create: true })

		const handle = runner.runOperation({
			input: inputFile,
			pathResolutionRoot: rootDir,
			path: Path.parse("output/item.txt"),
			conflictResolver: {
				resolveFileAlreadyExistConflict: async () => ({
					type: FileAlreadyExistConflictResolutionType.ERROR,
				}),
			},
		})

		await expect(handle.operationPromise).rejects.toBeInstanceOf(Error)

		expect(store.get(handle.status)).toBe(OperationStatus.ERRORED)
	})
})
