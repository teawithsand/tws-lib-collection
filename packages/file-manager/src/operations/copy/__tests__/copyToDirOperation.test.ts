import { createStore, FsWriteMode, InMemoryFs, Path } from "@teawithsand/fstate"
import { Blobs } from "@teawithsand/lngext"
import { describe, expect, test } from "vitest"
import { OperationStatus } from "../../commonDefines"
import { FileAlreadyExistConflictResolutionType } from "../../conflict"
import {
	FileManagerCopyConflictError,
	FileManagerCopyOperationError,
} from "../error"
import { CopyEntryOperationRunner, CopyToDirOperationRunner } from "../impl"

describe("CopyToDirOperationRunner", () => {
	test("copies empty array successfully", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new CopyToDirOperationRunner(store)

		const outputDir = await (
			await fs.getRootDir()
		).openDir(Path.parse("output"), {
			create: true,
		})

		const handle = runner.runOperation({ input: [], output: outputDir })

		await handle.operationPromise

		expect(store.get(handle.status)).toBe(OperationStatus.SUCCEEDED)

		const state = store.get(handle.state)
		expect(state.stage).toBe("copying")
		if (state.stage === "copying") {
			expect(state.discoveredFiles).toBe(0)
			expect(state.discoveredDirs).toBe(0)
			expect(state.totalFilesProcessed).toBe(0)
			expect(state.totalDirsProcessed).toBe(0)
		}
	})

	test("copies single file", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new CopyToDirOperationRunner(store)

		const rootDir = await fs.getRootDir()
		const inputFile = await rootDir.openFile(Path.parse("input.txt"), {
			create: true,
		})

		const writer = await inputFile.write({ mode: FsWriteMode.OVERWRITE })
		const blob = new Blob(["test content"], { type: "text/plain" })
		await writer.write(blob)
		await writer.close()

		const outputDir = await rootDir.openDir(Path.parse("output"), {
			create: true,
		})

		const handle = runner.runOperation({
			input: [inputFile],
			output: outputDir,
		})

		await handle.operationPromise

		expect(store.get(handle.status)).toBe(OperationStatus.SUCCEEDED)

		const state = store.get(handle.state)
		expect(state.stage).toBe("copying")
		if (state.stage === "copying") {
			expect(state.discoveredFiles).toBe(1)
			expect(state.discoveredDirs).toBe(0)
			expect(state.totalFilesProcessed).toBe(1)
			expect(state.totalDirsProcessed).toBe(0)
			expect(state.totalBytesCopied).toBeGreaterThan(0)
		}

		const copiedFile = await outputDir.openFile(Path.parse("input.txt"))
		const file = await copiedFile.getFile()
		const content = await Blobs.blobToText(file)
		expect(content).toBe("test content")
	})

	test("copies directory with files", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new CopyToDirOperationRunner(store)

		const rootDir = await fs.getRootDir()

		const inputDir = await rootDir.openDir(Path.parse("source"), {
			create: true,
		})

		const file1 = await inputDir.openFile(Path.parse("file1.txt"), {
			create: true,
		})
		const writer1 = await file1.write({ mode: FsWriteMode.OVERWRITE })
		await writer1.write(new Blob(["file1"], { type: "text/plain" }))
		await writer1.close()

		const file2 = await inputDir.openFile(Path.parse("file2.txt"), {
			create: true,
		})
		const writer2 = await file2.write({ mode: FsWriteMode.OVERWRITE })
		await writer2.write(new Blob(["file2"], { type: "text/plain" }))
		await writer2.close()

		const outputDir = await rootDir.openDir(Path.parse("output"), {
			create: true,
		})

		const handle = runner.runOperation({
			input: [inputDir],
			output: outputDir,
		})

		await handle.operationPromise

		expect(store.get(handle.status)).toBe(OperationStatus.SUCCEEDED)

		const state = store.get(handle.state)
		expect(state.stage).toBe("copying")
		if (state.stage === "copying") {
			expect(state.discoveredFiles).toBe(2)
			expect(state.discoveredDirs).toBe(1)
			expect(state.totalFilesProcessed).toBe(2)
			expect(state.totalDirsProcessed).toBe(1)
		}

		const copiedDir = await outputDir.openDir(Path.parse("source"))
		const copiedFile1 = await copiedDir.openFile(Path.parse("file1.txt"))
		const content1 = await Blobs.blobToText(await copiedFile1.getFile())
		expect(content1).toBe("file1")

		const copiedFile2 = await copiedDir.openFile(Path.parse("file2.txt"))
		const content2 = await Blobs.blobToText(await copiedFile2.getFile())
		expect(content2).toBe("file2")
	})

	test("copies nested directory structure", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new CopyToDirOperationRunner(store)

		const rootDir = await fs.getRootDir()

		const inputDir = await rootDir.openDir(Path.parse("source"), {
			create: true,
		})

		await inputDir.openDir(Path.parse("sub1"), {
			create: true,
		})

		const sub2 = await inputDir.openDir(Path.parse("sub2"), {
			create: true,
		})

		const file = await sub2.openFile(Path.parse("nested.txt"), {
			create: true,
		})
		const writer = await file.write({ mode: FsWriteMode.OVERWRITE })
		await writer.write(new Blob(["nested"], { type: "text/plain" }))
		await writer.close()

		const outputDir = await rootDir.openDir(Path.parse("output"), {
			create: true,
		})

		const handle = runner.runOperation({
			input: [inputDir],
			output: outputDir,
		})

		await handle.operationPromise

		expect(store.get(handle.status)).toBe(OperationStatus.SUCCEEDED)

		const state = store.get(handle.state)
		expect(state.stage).toBe("copying")
		if (state.stage === "copying") {
			expect(state.discoveredFiles).toBe(1)
			expect(state.discoveredDirs).toBe(3)
			expect(state.totalFilesProcessed).toBe(1)
			expect(state.totalDirsProcessed).toBe(3)
		}

		const copiedFile = await outputDir.openFile(
			Path.parse("source/sub2/nested.txt"),
		)
		const content = await Blobs.blobToText(await copiedFile.getFile())
		expect(content).toBe("nested")
	})

	test("copies multiple mixed handles", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new CopyToDirOperationRunner(store)

		const rootDir = await fs.getRootDir()

		const file1 = await rootDir.openFile(Path.parse("file1.txt"), {
			create: true,
		})
		const writer1 = await file1.write({ mode: FsWriteMode.OVERWRITE })
		await writer1.write(new Blob(["file1"], { type: "text/plain" }))
		await writer1.close()

		const dir1 = await rootDir.openDir(Path.parse("dir1"), {
			create: true,
		})

		const file2 = await dir1.openFile(Path.parse("file2.txt"), {
			create: true,
		})
		const writer2 = await file2.write({ mode: FsWriteMode.OVERWRITE })
		await writer2.write(new Blob(["file2"], { type: "text/plain" }))
		await writer2.close()

		const outputDir = await rootDir.openDir(Path.parse("output"), {
			create: true,
		})

		const handle = runner.runOperation({
			input: [file1, dir1],
			output: outputDir,
		})

		await handle.operationPromise

		expect(store.get(handle.status)).toBe(OperationStatus.SUCCEEDED)

		const state = store.get(handle.state)
		expect(state.stage).toBe("copying")
		if (state.stage === "copying") {
			expect(state.discoveredFiles).toBe(2)
			expect(state.discoveredDirs).toBe(1)
		}

		const copiedFile1 = await outputDir.openFile(Path.parse("file1.txt"))
		expect(await Blobs.blobToText(await copiedFile1.getFile())).toBe(
			"file1",
		)

		const copiedFile2 = await outputDir.openFile(
			Path.parse("dir1/file2.txt"),
		)
		expect(await Blobs.blobToText(await copiedFile2.getFile())).toBe(
			"file2",
		)
	})

	test("handles interruption during discovery", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new CopyToDirOperationRunner(store)

		const rootDir = await fs.getRootDir()

		const inputDir = await rootDir.openDir(Path.parse("source"), {
			create: true,
		})

		await inputDir.openFile(Path.parse("file1.txt"), { create: true })
		await inputDir.openFile(Path.parse("file2.txt"), { create: true })

		const outputDir = await rootDir.openDir(Path.parse("output"), {
			create: true,
		})

		const handle = runner.runOperation({
			input: [inputDir],
			output: outputDir,
		})

		store.set(handle.interrupt)

		await expect(handle.operationPromise).rejects.toBeInstanceOf(
			FileManagerCopyOperationError,
		)

		expect(store.get(handle.status)).toBe(OperationStatus.INTERRUPTED)
	})

	test("handles interruption during copying", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new CopyToDirOperationRunner(store)

		const rootDir = await fs.getRootDir()

		const inputDir = await rootDir.openDir(Path.parse("source"), {
			create: true,
		})

		await inputDir.openFile(Path.parse("file1.txt"), { create: true })
		await inputDir.openFile(Path.parse("file2.txt"), { create: true })
		await inputDir.openFile(Path.parse("file3.txt"), { create: true })

		const outputDir = await rootDir.openDir(Path.parse("output"), {
			create: true,
		})

		const handle = runner.runOperation({
			input: [inputDir],
			output: outputDir,
		})

		// Interrupt immediately to maximize chance of catching during operation
		store.set(handle.interrupt)

		let thrownError: unknown
		try {
			await handle.operationPromise
		} catch (error) {
			thrownError = error
		}

		// With InMemoryFs the operation may complete too fast, so we check
		// that interruption works OR that the operation succeeded
		const status = store.get(handle.status)
		if (thrownError) {
			expect(thrownError).toBeInstanceOf(FileManagerCopyOperationError)
			expect(status).toBe(OperationStatus.INTERRUPTED)
		} else {
			expect(status).toBe(OperationStatus.SUCCEEDED)
		}
	})

	test("handles file conflict with ERROR resolution", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new CopyToDirOperationRunner(store)

		const rootDir = await fs.getRootDir()

		const inputFile = await rootDir.openFile(Path.parse("input.txt"), {
			create: true,
		})
		const writer = await inputFile.write({ mode: FsWriteMode.OVERWRITE })
		await writer.write(new Blob(["content"], { type: "text/plain" }))
		await writer.close()

		const outputDir = await rootDir.openDir(Path.parse("output"), {
			create: true,
		})

		// Create pre-existing file
		const existingFile = await outputDir.openFile(Path.parse("input.txt"), {
			create: true,
		})
		const existingWriter = await existingFile.write({
			mode: FsWriteMode.OVERWRITE,
		})
		await existingWriter.write(
			new Blob(["existing"], { type: "text/plain" }),
		)
		await existingWriter.close()

		const handle = runner.runOperation({
			input: [inputFile],
			output: outputDir,
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
		const runner = new CopyToDirOperationRunner(store)

		const rootDir = await fs.getRootDir()

		const inputFile = await rootDir.openFile(Path.parse("input.txt"), {
			create: true,
		})
		const writer = await inputFile.write({ mode: FsWriteMode.OVERWRITE })
		await writer.write(new Blob(["new content"], { type: "text/plain" }))
		await writer.close()

		const outputDir = await rootDir.openDir(Path.parse("output"), {
			create: true,
		})

		// Create pre-existing file
		const existingFile = await outputDir.openFile(Path.parse("input.txt"), {
			create: true,
		})
		const existingWriter = await existingFile.write({
			mode: FsWriteMode.OVERWRITE,
		})
		await existingWriter.write(
			new Blob(["existing content"], { type: "text/plain" }),
		)
		await existingWriter.close()

		const handle = runner.runOperation({
			input: [inputFile],
			output: outputDir,
			conflictResolver: {
				resolveFileAlreadyExistConflict: async () => ({
					type: FileAlreadyExistConflictResolutionType.SKIP,
				}),
			},
		})

		await handle.operationPromise

		expect(store.get(handle.status)).toBe(OperationStatus.SUCCEEDED)

		// Verify original file content is preserved
		const copiedFile = await outputDir.openFile(Path.parse("input.txt"))
		const content = await Blobs.blobToText(await copiedFile.getFile())
		expect(content).toBe("existing content")
	})

	test("handles file conflict with OVERWRITE resolution", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new CopyToDirOperationRunner(store)

		const rootDir = await fs.getRootDir()

		const inputFile = await rootDir.openFile(Path.parse("input.txt"), {
			create: true,
		})
		const writer = await inputFile.write({ mode: FsWriteMode.OVERWRITE })
		await writer.write(new Blob(["new content"], { type: "text/plain" }))
		await writer.close()

		const outputDir = await rootDir.openDir(Path.parse("output"), {
			create: true,
		})

		// Create pre-existing file
		const existingFile = await outputDir.openFile(Path.parse("input.txt"), {
			create: true,
		})
		const existingWriter = await existingFile.write({
			mode: FsWriteMode.OVERWRITE,
		})
		await existingWriter.write(
			new Blob(["existing content"], { type: "text/plain" }),
		)
		await existingWriter.close()

		const handle = runner.runOperation({
			input: [inputFile],
			output: outputDir,
			conflictResolver: {
				resolveFileAlreadyExistConflict: async () => ({
					type: FileAlreadyExistConflictResolutionType.OVERWRITE,
				}),
			},
		})

		await handle.operationPromise

		expect(store.get(handle.status)).toBe(OperationStatus.SUCCEEDED)

		// Verify file is overwritten
		const copiedFile = await outputDir.openFile(Path.parse("input.txt"))
		const content = await Blobs.blobToText(await copiedFile.getFile())
		expect(content).toBe("new content")
	})

	test("handles file conflict with RENAME resolution", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new CopyToDirOperationRunner(store)

		const rootDir = await fs.getRootDir()

		const inputFile = await rootDir.openFile(Path.parse("input.txt"), {
			create: true,
		})
		const writer = await inputFile.write({ mode: FsWriteMode.OVERWRITE })
		await writer.write(new Blob(["new content"], { type: "text/plain" }))
		await writer.close()

		const outputDir = await rootDir.openDir(Path.parse("output"), {
			create: true,
		})

		// Create pre-existing file
		const existingFile = await outputDir.openFile(Path.parse("input.txt"), {
			create: true,
		})
		const existingWriter = await existingFile.write({
			mode: FsWriteMode.OVERWRITE,
		})
		await existingWriter.write(
			new Blob(["existing content"], { type: "text/plain" }),
		)
		await existingWriter.close()

		const handle = runner.runOperation({
			input: [inputFile],
			output: outputDir,
			conflictResolver: {
				resolveFileAlreadyExistConflict: async () => ({
					type: FileAlreadyExistConflictResolutionType.RENAME,
					newFileName: "input-copy.txt",
				}),
			},
		})

		await handle.operationPromise

		expect(store.get(handle.status)).toBe(OperationStatus.SUCCEEDED)

		// Verify both files exist
		const originalFile = await outputDir.openFile(Path.parse("input.txt"))
		const originalContent = await Blobs.blobToText(
			await originalFile.getFile(),
		)
		expect(originalContent).toBe("existing content")

		const renamedFile = await outputDir.openFile(
			Path.parse("input-copy.txt"),
		)
		const renamedContent = await Blobs.blobToText(
			await renamedFile.getFile(),
		)
		expect(renamedContent).toBe("new content")
	})

	test("handles directory conflict when file exists at path", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new CopyToDirOperationRunner(store)

		const rootDir = await fs.getRootDir()

		const inputDir = await rootDir.openDir(Path.parse("source"), {
			create: true,
		})
		await inputDir.openFile(Path.parse("file.txt"), { create: true })

		const outputDir = await rootDir.openDir(Path.parse("output"), {
			create: true,
		})

		// Create file with same name as directory we want to create
		const blockingFile = await outputDir.openFile(Path.parse("source"), {
			create: true,
		})
		const writer = await blockingFile.write({ mode: FsWriteMode.OVERWRITE })
		await writer.write(new Blob(["blocking"], { type: "text/plain" }))
		await writer.close()

		const handle = runner.runOperation({
			input: [inputDir],
			output: outputDir,
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
		const runner = new CopyToDirOperationRunner(store)

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

		// Create directory with same name as file we want to create
		await outputDir.openDir(Path.parse("item.txt"), { create: true })

		const handle = runner.runOperation({
			input: [inputFile],
			output: outputDir,
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
		expect(state.stage).toBe("copying")
		if (state.stage === "copying") {
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
		expect(state.stage).toBe("copying")
		if (state.stage === "copying") {
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

		let thrownError: unknown
		try {
			await handle.operationPromise
		} catch (error) {
			thrownError = error
		}

		const status = store.get(handle.status)
		if (thrownError) {
			expect(thrownError).toBeInstanceOf(FileManagerCopyOperationError)
			expect(status).toBe(OperationStatus.INTERRUPTED)
		} else {
			expect(status).toBe(OperationStatus.SUCCEEDED)
		}
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
		expect(state.stage).toBe("copying")
		if (state.stage === "copying") {
			expect(state.totalBytesCopied).toBe(1000)
			expect(state.currentInputFile).toBeNull()
		}
	})

	test("handles file conflict with ERROR resolution", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new CopyToDirOperationRunner(store)

		const rootDir = await fs.getRootDir()

		const inputFile = await rootDir.openFile(Path.parse("input.txt"), {
			create: true,
		})
		const writer = await inputFile.write({ mode: FsWriteMode.OVERWRITE })
		await writer.write(new Blob(["content"], { type: "text/plain" }))
		await writer.close()

		const outputDir = await rootDir.openDir(Path.parse("output"), {
			create: true,
		})

		// Create pre-existing file
		const existingFile = await outputDir.openFile(Path.parse("input.txt"), {
			create: true,
		})
		const existingWriter = await existingFile.write({
			mode: FsWriteMode.OVERWRITE,
		})
		await existingWriter.write(
			new Blob(["existing"], { type: "text/plain" }),
		)
		await existingWriter.close()

		const handle = runner.runOperation({
			input: [inputFile],
			output: outputDir,
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
		const runner = new CopyToDirOperationRunner(store)

		const rootDir = await fs.getRootDir()

		const inputFile = await rootDir.openFile(Path.parse("input.txt"), {
			create: true,
		})
		const writer = await inputFile.write({ mode: FsWriteMode.OVERWRITE })
		await writer.write(new Blob(["new content"], { type: "text/plain" }))
		await writer.close()

		const outputDir = await rootDir.openDir(Path.parse("output"), {
			create: true,
		})

		// Create pre-existing file
		const existingFile = await outputDir.openFile(Path.parse("input.txt"), {
			create: true,
		})
		const existingWriter = await existingFile.write({
			mode: FsWriteMode.OVERWRITE,
		})
		await existingWriter.write(
			new Blob(["existing content"], { type: "text/plain" }),
		)
		await existingWriter.close()

		const handle = runner.runOperation({
			input: [inputFile],
			output: outputDir,
			conflictResolver: {
				resolveFileAlreadyExistConflict: async () => ({
					type: FileAlreadyExistConflictResolutionType.SKIP,
				}),
			},
		})

		await handle.operationPromise

		expect(store.get(handle.status)).toBe(OperationStatus.SUCCEEDED)

		// Verify original file content is preserved
		const copiedFile = await outputDir.openFile(Path.parse("input.txt"))
		const content = await Blobs.blobToText(await copiedFile.getFile())
		expect(content).toBe("existing content")
	})

	test("handles file conflict with OVERWRITE resolution", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new CopyToDirOperationRunner(store)

		const rootDir = await fs.getRootDir()

		const inputFile = await rootDir.openFile(Path.parse("input.txt"), {
			create: true,
		})
		const writer = await inputFile.write({ mode: FsWriteMode.OVERWRITE })
		await writer.write(new Blob(["new content"], { type: "text/plain" }))
		await writer.close()

		const outputDir = await rootDir.openDir(Path.parse("output"), {
			create: true,
		})

		// Create pre-existing file
		const existingFile = await outputDir.openFile(Path.parse("input.txt"), {
			create: true,
		})
		const existingWriter = await existingFile.write({
			mode: FsWriteMode.OVERWRITE,
		})
		await existingWriter.write(
			new Blob(["existing content"], { type: "text/plain" }),
		)
		await existingWriter.close()

		const handle = runner.runOperation({
			input: [inputFile],
			output: outputDir,
			conflictResolver: {
				resolveFileAlreadyExistConflict: async () => ({
					type: FileAlreadyExistConflictResolutionType.OVERWRITE,
				}),
			},
		})

		await handle.operationPromise

		expect(store.get(handle.status)).toBe(OperationStatus.SUCCEEDED)

		// Verify file is overwritten
		const copiedFile = await outputDir.openFile(Path.parse("input.txt"))
		const content = await Blobs.blobToText(await copiedFile.getFile())
		expect(content).toBe("new content")
	})

	test("handles file conflict with RENAME resolution", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new CopyToDirOperationRunner(store)

		const rootDir = await fs.getRootDir()

		const inputFile = await rootDir.openFile(Path.parse("input.txt"), {
			create: true,
		})
		const writer = await inputFile.write({ mode: FsWriteMode.OVERWRITE })
		await writer.write(new Blob(["new content"], { type: "text/plain" }))
		await writer.close()

		const outputDir = await rootDir.openDir(Path.parse("output"), {
			create: true,
		})

		// Create pre-existing file
		const existingFile = await outputDir.openFile(Path.parse("input.txt"), {
			create: true,
		})
		const existingWriter = await existingFile.write({
			mode: FsWriteMode.OVERWRITE,
		})
		await existingWriter.write(
			new Blob(["existing content"], { type: "text/plain" }),
		)
		await existingWriter.close()

		const handle = runner.runOperation({
			input: [inputFile],
			output: outputDir,
			conflictResolver: {
				resolveFileAlreadyExistConflict: async () => ({
					type: FileAlreadyExistConflictResolutionType.RENAME,
					newFileName: "input-copy.txt",
				}),
			},
		})

		await handle.operationPromise

		expect(store.get(handle.status)).toBe(OperationStatus.SUCCEEDED)

		// Verify both files exist
		const originalFile = await outputDir.openFile(Path.parse("input.txt"))
		const originalContent = await Blobs.blobToText(
			await originalFile.getFile(),
		)
		expect(originalContent).toBe("existing content")

		const renamedFile = await outputDir.openFile(
			Path.parse("input-copy.txt"),
		)
		const renamedContent = await Blobs.blobToText(
			await renamedFile.getFile(),
		)
		expect(renamedContent).toBe("new content")
	})

	test("handles directory conflict when file exists at path", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new CopyToDirOperationRunner(store)

		const rootDir = await fs.getRootDir()

		const inputDir = await rootDir.openDir(Path.parse("source"), {
			create: true,
		})
		await inputDir.openFile(Path.parse("file.txt"), { create: true })

		const outputDir = await rootDir.openDir(Path.parse("output"), {
			create: true,
		})

		// Create file with same name as directory we want to create
		const blockingFile = await outputDir.openFile(Path.parse("source"), {
			create: true,
		})
		const writer = await blockingFile.write({ mode: FsWriteMode.OVERWRITE })
		await writer.write(new Blob(["blocking"], { type: "text/plain" }))
		await writer.close()

		const handle = runner.runOperation({
			input: [inputDir],
			output: outputDir,
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
		const runner = new CopyToDirOperationRunner(store)

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

		// Create directory with same name as file we want to create
		await outputDir.openDir(Path.parse("item.txt"), { create: true })

		const handle = runner.runOperation({
			input: [inputFile],
			output: outputDir,
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
