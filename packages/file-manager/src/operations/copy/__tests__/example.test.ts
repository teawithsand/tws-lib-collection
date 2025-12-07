import { createStore, FsWriteMode, InMemoryFs, Path } from "@teawithsand/fstate"
import { describe, expect, test } from "vitest"
import { OperationStatus } from "../../commonDefines"
import { RemoveEntryOperationRunner } from "../../remove/impl"
import { CopyToDirOperationRunner } from "../impl"

const writeTextFile = async (
	fs: InMemoryFs,
	path: string,
	content: string,
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

describe("copy and remove integration", () => {
	test("copies a file then removes the copy", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const copyRunner = new CopyToDirOperationRunner(store)
		const removeRunner = new RemoveEntryOperationRunner(store)

		await writeTextFile(fs, "input/note.txt", "hello")

		const root = await fs.getRootDir()
		const inputFile = await root.openFile(Path.parse("input/note.txt"))
		const outputDir = await root.openDir(Path.parse("output"), {
			create: true,
		})

		const copyHandle = copyRunner.runOperation({
			input: [inputFile],
			output: outputDir,
		})
		await copyHandle.operationPromise
		expect(store.get(copyHandle.status)).toBe(OperationStatus.SUCCEEDED)

		const copiedFile = await outputDir.openFile(Path.parse("note.txt"))
		const copiedStat = await copiedFile.stat()
		expect(copiedStat.exists).toBe(true)

		const removeHandle = removeRunner.runOperation({ input: copiedFile })
		await removeHandle.operationPromise
		expect(store.get(removeHandle.status)).toBe(OperationStatus.SUCCEEDED)

		const removedStat = await copiedFile.stat()
		expect(removedStat.exists).toBe(false)

		const originalStat = await inputFile.stat()
		expect(originalStat.exists).toBe(true)
	})
})
