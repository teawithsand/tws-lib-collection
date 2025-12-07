import { createStore, FsWriteMode, InMemoryFs, Path } from "@teawithsand/fstate"
import { describe, expect, test } from "vitest"
import { OperationStatus } from "../../commonDefines"
import { CopyToDirOperationRunner } from "../../copy/impl"
import { RemoveEntriesNativeOperationRunner } from "../impl"

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

describe("copy then remove flow", () => {
	test("copies a directory then removes original and copy", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const copyRunner = new CopyToDirOperationRunner(store)
		const removeRunner = new RemoveEntriesNativeOperationRunner(store)

		await writeTextFile(fs, "src/books/title.txt", "readme")

		const root = await fs.getRootDir()
		const sourceDir = await root.openDir(Path.parse("src"))
		const targetDir = await root.openDir(Path.parse("dist"), {
			create: true,
		})

		const copyHandle = copyRunner.runOperation({
			input: [sourceDir],
			output: targetDir,
		})
		await copyHandle.operationPromise
		expect(store.get(copyHandle.status)).toBe(OperationStatus.SUCCEEDED)

		const copiedFile = await targetDir.openFile(
			Path.parse("src/books/title.txt"),
		)
		const copiedStat = await copiedFile.stat()
		expect(copiedStat.exists).toBe(true)

		const removeHandle = removeRunner.runOperation({
			input: [sourceDir, targetDir],
		})
		await removeHandle.operationPromise
		expect(store.get(removeHandle.status)).toBe(OperationStatus.SUCCEEDED)

		const sourceStat = await sourceDir.stat()
		expect(sourceStat.exists).toBe(false)

		const targetStat = await targetDir.stat()
		expect(targetStat.exists).toBe(false)
	})
})
