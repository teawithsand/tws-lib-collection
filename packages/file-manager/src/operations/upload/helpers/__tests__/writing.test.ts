import { InMemoryFs, Path } from "@teawithsand/fstate"
import { Blobs } from "@teawithsand/lngext"
import { describe, expect, test } from "vitest"
import { FileManagerUploadOperationError } from "../../error"
import { writeBlobToDirectoryChunked } from "../writing"

const createOutputDir = async () => {
	const fs = new InMemoryFs()
	const root = await fs.getRootDir()
	return root.openDir(Path.parse("out"), { create: true })
}

describe("writeBlobToDirectoryChunked", () => {
	test("writes in chunks and reports progress", async () => {
		const outputDir = await createOutputDir()
		const progress: number[] = []

		await writeBlobToDirectoryChunked(
			await outputDir,
			"file.txt",
			new Blob(["abcde"], { type: "text/plain" }),
			2,
			(bytes) => progress.push(bytes),
			() => {},
		)

		const file = await (await outputDir).openFile(Path.parse("file.txt"))
		const content = await Blobs.blobToText(await file.getFile())
		expect(content).toBe("abcde")
		expect(progress).toEqual([2, 2, 1])
	})

	test("creates file for empty blob", async () => {
		const outputDir = await createOutputDir()
		const progress: number[] = []

		await writeBlobToDirectoryChunked(
			await outputDir,
			"empty.txt",
			new Blob([], { type: "text/plain" }),
			4,
			(bytes) => progress.push(bytes),
			() => {},
		)

		const file = await (await outputDir).openFile(Path.parse("empty.txt"))
		const content = await Blobs.blobToText(await file.getFile())
		expect(content).toBe("")
		expect(progress).toEqual([0])
	})

	test("throws on interruption between chunks", async () => {
		const outputDir = await createOutputDir()
		let interrupted = false

		const checkInterruption = () => {
			if (interrupted) {
				throw new FileManagerUploadOperationError("interrupted")
			}
		}

		const onChunkWritten = () => {
			interrupted = true
		}

		await expect(
			writeBlobToDirectoryChunked(
				await outputDir,
				"partial.txt",
				new Blob(["abcdef"], { type: "text/plain" }),
				3,
				onChunkWritten,
				checkInterruption,
			),
		).rejects.toBeInstanceOf(FileManagerUploadOperationError)

		const file = await (await outputDir).openFile(Path.parse("partial.txt"))
		const saved = await Blobs.blobToText(await file.getFile())
		expect(saved).toBe("abc")
	})

	test("rejects non-positive chunk size", async () => {
		const outputDir = await createOutputDir()

		await expect(
			writeBlobToDirectoryChunked(
				await outputDir,
				"invalid.txt",
				new Blob(["data"], { type: "text/plain" }),
				0,
				() => {},
				() => {},
			),
		).rejects.toBeInstanceOf(FileManagerUploadOperationError)
	})

	test("rejects empty file name", async () => {
		const outputDir = await createOutputDir()

		await expect(
			writeBlobToDirectoryChunked(
				await outputDir,
				"",
				new Blob(["data"], { type: "text/plain" }),
				4,
				() => {},
				() => {},
			),
		).rejects.toBeInstanceOf(FileManagerUploadOperationError)
	})

	test("handles chunk larger than blob", async () => {
		const outputDir = await createOutputDir()
		const progress: number[] = []

		await writeBlobToDirectoryChunked(
			await outputDir,
			"single.txt",
			new Blob(["short"], { type: "text/plain" }),
			64,
			(bytes) => progress.push(bytes),
			() => {},
		)

		expect(progress).toEqual([5])
		const file = await (await outputDir).openFile(Path.parse("single.txt"))
		expect(await Blobs.blobToText(await file.getFile())).toBe("short")
	})
})
