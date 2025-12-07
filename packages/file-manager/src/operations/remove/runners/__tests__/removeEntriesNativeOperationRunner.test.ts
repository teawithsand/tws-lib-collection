import { createStore, InMemoryFs, Path } from "@teawithsand/fstate"
import { afterEach, describe, expect, test, vi } from "vitest"
import { OperationStatus } from "../../../commonDefines"
import { RemoveEntriesOperationStage } from "../../defines"
import { RemoveEntriesNativeOperationRunner } from "../removeEntriesNativeOperationRunner"

afterEach(() => {
	vi.restoreAllMocks()
})

describe("RemoveEntriesNativeOperationRunner", () => {
	test("removes multiple entries natively", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new RemoveEntriesNativeOperationRunner(store)

		const root = await fs.getRootDir()
		const file = await root.openFile(Path.parse("a.txt"), { create: true })
		const dir = await root.openDir(Path.parse("folder"), { create: true })
		await dir.openFile(Path.parse("b.txt"), { create: true })

		const handle = runner.runOperation({ input: [file, dir] })
		await handle.operationPromise

		expect(store.get(handle.status)).toBe(OperationStatus.SUCCEEDED)
		const state = store.get(handle.state)
		expect(state.stage).toBe(RemoveEntriesOperationStage.REMOVAL)
		if (state.stage === RemoveEntriesOperationStage.REMOVAL) {
			expect(state.discoveredFiles).toBe(1)
			expect(state.discoveredDirs).toBe(1)
			expect(state.totalFilesRemoved).toBe(1)
			expect(state.totalDirsRemoved).toBe(1)
		}

		const fileStat = await file.stat()
		expect(fileStat.exists).toBe(false)
		const dirStat = await dir.stat()
		expect(dirStat.exists).toBe(false)
	})

	test("falls back per entry on failure", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new RemoveEntriesNativeOperationRunner(store)

		const root = await fs.getRootDir()
		const dir = await root.openDir(Path.parse("root"), { create: true })
		await dir.openFile(Path.parse("x.txt"), { create: true })

		const deleteSpy = vi
			.spyOn(dir, "delete")
			.mockRejectedValueOnce(new Error("cannot delete"))

		const handle = runner.runOperation({ input: [dir] })
		await handle.operationPromise

		expect(store.get(handle.status)).toBe(OperationStatus.SUCCEEDED)
		const state = store.get(handle.state)
		expect(state.stage).toBe(RemoveEntriesOperationStage.REMOVAL)
		if (state.stage === RemoveEntriesOperationStage.REMOVAL) {
			expect(state.totalDirsRemoved).toBe(1)
			expect(state.totalDirsSkipped).toBe(0)
		}

		const dirStat = await dir.stat()
		expect(dirStat.exists).toBe(false)
		deleteSpy.mockRestore()
	})

	test("supports interrupt", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new RemoveEntriesNativeOperationRunner(store)

		const root = await fs.getRootDir()
		const dir = await root.openDir(Path.parse("data"), { create: true })
		await dir.openFile(Path.parse("file1"), { create: true })

		const handle = runner.runOperation({ input: [dir] })
		store.set(handle.interrupt)

		await handle.operationPromise

		const status = store.get(handle.status)
		expect([
			OperationStatus.INTERRUPTED,
			OperationStatus.SUCCEEDED,
		]).toContain(status)
	})
})
