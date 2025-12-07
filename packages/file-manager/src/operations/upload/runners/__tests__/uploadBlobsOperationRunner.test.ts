import { createStore, InMemoryFs, Path } from "@teawithsand/fstate"
import { Blobs } from "@teawithsand/lngext"
import { describe, expect, test } from "vitest"
import { OperationStatus } from "../../../commonDefines"
import { FileManagerUploadOperationError } from "../../error"
import { UploadBlobsOperationRunner } from "../uploadBlobsOperationRunner"

describe("UploadBlobsOperationRunner", () => {
	test("uploads single blob with rename", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new UploadBlobsOperationRunner(store)

		const outputDir = await (
			await fs.getRootDir()
		).openDir(Path.parse("uploads"), { create: true })

		const blob = new Blob(["hello"], { type: "text/plain" })

		const handle = runner.runOperation({
			input: [{ blob, fileName: "greeting.txt" }],
			output: outputDir,
		})

		await handle.operationPromise

		expect(store.get(handle.status)).toBe(OperationStatus.SUCCEEDED)

		const uploadedFile = await outputDir.openFile(
			Path.parse("greeting.txt"),
		)
		const uploadedBlob = await uploadedFile.getFile()
		expect(await Blobs.blobToText(uploadedBlob)).toBe("hello")
	})

	test("uploads multiple blobs respecting provided names", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new UploadBlobsOperationRunner(store)

		const outputDir = await (
			await fs.getRootDir()
		).openDir(Path.parse("bin"), { create: true })

		const handle = runner.runOperation({
			input: [
				{
					blob: new Blob(["a"], { type: "text/plain" }),
					fileName: "a.txt",
				},
				{
					blob: new Blob(["b"], { type: "text/plain" }),
					fileName: "folder/b.txt",
				},
			],
			output: outputDir,
		})

		await handle.operationPromise

		expect(store.get(handle.status)).toBe(OperationStatus.SUCCEEDED)

		const fileA = await outputDir.openFile(Path.parse("a.txt"))
		expect(await Blobs.blobToText(await fileA.getFile())).toBe("a")
		const fileB = await outputDir.openFile(Path.parse("folder/b.txt"))
		expect(await Blobs.blobToText(await fileB.getFile())).toBe("b")
	})

	test("tracks chunked progress across multiple blobs", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new UploadBlobsOperationRunner(store)

		const outputDir = await (
			await fs.getRootDir()
		).openDir(Path.parse("chunks"), { create: true })

		const handle = runner.runOperation({
			input: [
				{
					blob: new Blob(["abcde"], { type: "text/plain" }),
					fileName: "a.txt",
				},
				{
					blob: new Blob(["123"], { type: "text/plain" }),
					fileName: "b.txt",
				},
			],
			output: outputDir,
			chunkSize: 2,
		})

		await handle.operationPromise

		expect(store.get(handle.status)).toBe(OperationStatus.SUCCEEDED)

		const state = store.get(handle.state)
		expect(state.totalBytesToWrite).toBe(8)
		expect(state.totalBytesWritten).toBe(8)
		expect(state.processedBlobs).toBe(2)
		expect(state.currentBlobBytesWritten).toBe(0)
		expect(state.currentFileName).toBeNull()

		const fileA = await outputDir.openFile(Path.parse("a.txt"))
		expect(await Blobs.blobToText(await fileA.getFile())).toBe("abcde")
		const fileB = await outputDir.openFile(Path.parse("b.txt"))
		expect(await Blobs.blobToText(await fileB.getFile())).toBe("123")
	})

	test("creates empty files and keeps counters consistent", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new UploadBlobsOperationRunner(store)

		const outputDir = await (
			await fs.getRootDir()
		).openDir(Path.parse("empty"), { create: true })

		const handle = runner.runOperation({
			input: [
				{
					blob: new Blob([], { type: "text/plain" }),
					fileName: "zero.txt",
				},
			],
			output: outputDir,
		})

		await handle.operationPromise

		expect(store.get(handle.status)).toBe(OperationStatus.SUCCEEDED)

		const state = store.get(handle.state)
		expect(state.totalBytesToWrite).toBe(0)
		expect(state.totalBytesWritten).toBe(0)
		expect(state.processedBlobs).toBe(1)
		expect(state.currentFileName).toBeNull()

		const uploaded = await outputDir.openFile(Path.parse("zero.txt"))
		expect(await Blobs.blobToText(await uploaded.getFile())).toBe("")
	})

	test("rejects promise when interrupted", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new UploadBlobsOperationRunner(store)

		const outputDir = await (
			await fs.getRootDir()
		).openDir(Path.parse("interrupt"), { create: true })

		const handle = runner.runOperation({
			input: [
				{
					blob: new Blob(["should-not-write"], {
						type: "text/plain",
					}),
					fileName: "skip.txt",
				},
			],
			output: outputDir,
			chunkSize: 1,
		})

		store.set(handle.interrupt)

		await expect(handle.operationPromise).rejects.toBeInstanceOf(
			FileManagerUploadOperationError,
		)

		expect(store.get(handle.status)).toBe(OperationStatus.INTERRUPTED)

		const state = store.get(handle.state)
		expect(state.processedBlobs).toBe(0)
		expect(state.totalBytesWritten).toBe(0)
	})

	test("rejects non-positive chunk sizes", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new UploadBlobsOperationRunner(store)

		const outputDir = await (
			await fs.getRootDir()
		).openDir(Path.parse("invalid"), { create: true })

		expect(() =>
			runner.runOperation({
				input: [
					{
						blob: new Blob(["data"], { type: "text/plain" }),
						fileName: "a.txt",
					},
				],
				output: outputDir,
				chunkSize: 0,
			}),
		).toThrow(FileManagerUploadOperationError)
	})

	test("handles empty input gracefully", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new UploadBlobsOperationRunner(store)

		const outputDir = await (
			await fs.getRootDir()
		).openDir(Path.parse("none"), { create: true })

		const handle = runner.runOperation({ input: [], output: outputDir })

		await handle.operationPromise

		expect(store.get(handle.status)).toBe(OperationStatus.SUCCEEDED)
		const state = store.get(handle.state)
		expect(state.totalBytesToWrite).toBe(0)
		expect(state.totalBytesWritten).toBe(0)
		expect(state.processedBlobs).toBe(0)
		expect(state.currentFileName).toBeNull()
	})

	test("rejects promise on invalid file name", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new UploadBlobsOperationRunner(store)

		const outputDir = await (
			await fs.getRootDir()
		).openDir(Path.parse("invalid-name"), { create: true })

		const handle = runner.runOperation({
			input: [
				{ blob: new Blob(["x"], { type: "text/plain" }), fileName: "" },
			],
			output: outputDir,
		})

		await expect(handle.operationPromise).rejects.toBeInstanceOf(
			FileManagerUploadOperationError,
		)
		expect(store.get(handle.status)).toBe(OperationStatus.ERRORED)
		expect(store.get(handle.error)).toBeInstanceOf(
			FileManagerUploadOperationError,
		)
	})
})
