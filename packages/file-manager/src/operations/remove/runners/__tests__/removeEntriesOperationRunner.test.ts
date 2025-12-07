import { createStore, InMemoryFs, Path } from "@teawithsand/fstate"
import { afterEach, describe, expect, test, vi } from "vitest"
import { OperationStatus } from "../../../commonDefines"
import { RemoveEntriesOperationStage } from "../../defines"
import { FileManagerRemoveOperationError } from "../../error"
import { RemoveEntriesOperationRunner } from "../removeEntriesOperationRunner"

afterEach(() => {
	vi.restoreAllMocks()
})

describe("RemoveEntriesOperationRunner", () => {
	test("removes empty input", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new RemoveEntriesOperationRunner(store)

		const handle = runner.runOperation({ input: [] })

		await handle.operationPromise

		expect(store.get(handle.status)).toBe(OperationStatus.SUCCEEDED)

		const state = store.get(handle.state)
		expect(state.stage).toBe(RemoveEntriesOperationStage.REMOVAL)
		if (state.stage === RemoveEntriesOperationStage.REMOVAL) {
			expect(state.discoveredFiles).toBe(0)
			expect(state.discoveredDirs).toBe(0)
			expect(state.totalFilesRemoved).toBe(0)
			expect(state.totalDirsRemoved).toBe(0)
		}

		const root = await fs.getRootDir()
		const stat = await root.stat()
		expect(stat.entries.length).toBe(0)
	})

	test("removes single file", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new RemoveEntriesOperationRunner(store)

		const root = await fs.getRootDir()
		const file = await root.openFile(Path.parse("note.txt"), {
			create: true,
		})

		const handle = runner.runOperation({ input: [file] })
		await handle.operationPromise

		expect(store.get(handle.status)).toBe(OperationStatus.SUCCEEDED)
		const state = store.get(handle.state)
		expect(state.stage).toBe(RemoveEntriesOperationStage.REMOVAL)
		if (state.stage === RemoveEntriesOperationStage.REMOVAL) {
			expect(state.discoveredFiles).toBe(1)
			expect(state.discoveredDirs).toBe(0)
			expect(state.totalFilesRemoved).toBe(1)
		}

		const stat = await file.stat()
		expect(stat.exists).toBe(false)
	})

	test("removes nested directory structure", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new RemoveEntriesOperationRunner(store)

		const root = await fs.getRootDir()
		const dir = await root.openDir(Path.parse("folder"), { create: true })
		const child = await dir.openDir(Path.parse("child"), { create: true })
		await child.openFile(Path.parse("data.txt"), { create: true })

		const handle = runner.runOperation({ input: [dir] })
		await handle.operationPromise

		expect(store.get(handle.status)).toBe(OperationStatus.SUCCEEDED)
		const state = store.get(handle.state)
		expect(state.stage).toBe(RemoveEntriesOperationStage.REMOVAL)
		if (state.stage === RemoveEntriesOperationStage.REMOVAL) {
			expect(state.discoveredDirs).toBe(2)
			expect(state.discoveredFiles).toBe(1)
			expect(state.totalDirsRemoved).toBe(2)
			expect(state.totalFilesRemoved).toBe(1)
		}

		const dirStat = await dir.stat()
		expect(dirStat.exists).toBe(false)
	})

	test("skips missing file", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new RemoveEntriesOperationRunner(store)

		const root = await fs.getRootDir()
		const missing = await root.openFile(Path.parse("ghost.txt"), {
			create: true,
		})
		await missing.delete()

		const handle = runner.runOperation({ input: [missing] })
		await handle.operationPromise

		expect(store.get(handle.status)).toBe(OperationStatus.SUCCEEDED)
		const state = store.get(handle.state)
		expect(state.stage).toBe(RemoveEntriesOperationStage.REMOVAL)
		if (state.stage === RemoveEntriesOperationStage.REMOVAL) {
			expect(state.totalFilesRemoved).toBe(0)
			expect(state.totalFilesSkipped).toBe(1)
		}
	})

	test("supports interrupt", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new RemoveEntriesOperationRunner(store)

		const root = await fs.getRootDir()
		const dir = await root.openDir(Path.parse("folder"), { create: true })
		await dir.openFile(Path.parse("file1.txt"), { create: true })
		await dir.openFile(Path.parse("file2.txt"), { create: true })

		const handle = runner.runOperation({ input: [dir] })

		store.set(handle.interrupt)

		await expect(handle.operationPromise).rejects.toBeInstanceOf(
			FileManagerRemoveOperationError,
		)

		const status = store.get(handle.status)
		expect(status).toBe(OperationStatus.INTERRUPTED)
	})
})
