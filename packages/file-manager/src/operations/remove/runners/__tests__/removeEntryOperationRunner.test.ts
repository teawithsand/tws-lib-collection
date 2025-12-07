import { createStore, InMemoryFs, Path } from "@teawithsand/fstate"
import { afterEach, describe, expect, test, vi } from "vitest"
import { OperationStatus } from "../../../commonDefines"
import { RemoveEntryOperationStage } from "../../defines"
import { FileManagerRemoveOperationError } from "../../error"
import { RemoveEntryOperationRunner } from "../removeEntryOperationRunner"

afterEach(() => {
	vi.restoreAllMocks()
})

describe("RemoveEntryOperationRunner", () => {
	test("removes provided file handle", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new RemoveEntryOperationRunner(store)

		const root = await fs.getRootDir()
		const file = await root.openFile(Path.parse("todo.txt"), {
			create: true,
		})

		const handle = runner.runOperation({
			input: file,
			relativePath: Path.parse("nested/todo.txt"),
		})

		await handle.operationPromise

		expect(store.get(handle.status)).toBe(OperationStatus.SUCCEEDED)
		const state = store.get(handle.state)
		expect(state.stage).toBe(RemoveEntryOperationStage.REMOVAL)
		if (state.stage === RemoveEntryOperationStage.REMOVAL) {
			expect(state.discoveredFiles).toBe(1)
			expect(state.discoveredDirs).toBe(0)
			expect(state.totalFilesRemoved).toBe(1)
		}

		const stat = await file.stat()
		expect(stat.exists).toBe(false)
	})

	test("removes directory tree", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new RemoveEntryOperationRunner(store)

		const root = await fs.getRootDir()
		const dir = await root.openDir(Path.parse("books"), { create: true })
		const child = await dir.openDir(Path.parse("2024"), { create: true })
		await child.openFile(Path.parse("readme.md"), { create: true })

		const handle = runner.runOperation({ input: dir })
		await handle.operationPromise

		expect(store.get(handle.status)).toBe(OperationStatus.SUCCEEDED)
		const state = store.get(handle.state)
		expect(state.stage).toBe(RemoveEntryOperationStage.REMOVAL)
		if (state.stage === RemoveEntryOperationStage.REMOVAL) {
			expect(state.discoveredDirs).toBe(2)
			expect(state.discoveredFiles).toBe(1)
			expect(state.totalDirsRemoved).toBe(2)
			expect(state.totalFilesRemoved).toBe(1)
		}

		const dirStat = await dir.stat()
		expect(dirStat.exists).toBe(false)
	})

	test("skips when target is missing", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new RemoveEntryOperationRunner(store)

		const root = await fs.getRootDir()
		const ghost = await root.openFile(Path.parse("ghost.bin"), {
			create: true,
		})
		await ghost.delete()

		const handle = runner.runOperation({ input: ghost })
		await handle.operationPromise

		expect(store.get(handle.status)).toBe(OperationStatus.SUCCEEDED)
		const state = store.get(handle.state)
		expect(state.stage).toBe(RemoveEntryOperationStage.REMOVAL)
		if (state.stage === RemoveEntryOperationStage.REMOVAL) {
			expect(state.totalFilesRemoved).toBe(0)
			expect(state.totalFilesSkipped).toBe(1)
		}
	})

	test("can be interrupted", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new RemoveEntryOperationRunner(store)

		const root = await fs.getRootDir()
		const dir = await root.openDir(Path.parse("dataset"), { create: true })
		await dir.openFile(Path.parse("a"), { create: true })
		await dir.openFile(Path.parse("b"), { create: true })

		const handle = runner.runOperation({ input: dir })
		store.set(handle.interrupt)

		await expect(handle.operationPromise).rejects.toBeInstanceOf(
			FileManagerRemoveOperationError,
		)

		const status = store.get(handle.status)
		expect(status).toBe(OperationStatus.INTERRUPTED)
	})
})
