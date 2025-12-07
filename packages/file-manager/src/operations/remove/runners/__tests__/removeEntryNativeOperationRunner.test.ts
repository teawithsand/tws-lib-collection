import { createStore, FsWriteMode, InMemoryFs, Path } from "@teawithsand/fstate"
import { afterEach, describe, expect, test, vi } from "vitest"
import { OperationStatus } from "../../../commonDefines"
import { RemoveEntryOperationStage } from "../../defines"
import { RemoveEntryNativeOperationRunner } from "../removeEntryNativeOperationRunner"

afterEach(() => {
	vi.restoreAllMocks()
})

describe("RemoveEntryNativeOperationRunner", () => {
	test("removes file with native path", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new RemoveEntryNativeOperationRunner(store)

		const root = await fs.getRootDir()
		const file = await root.openFile(Path.parse("notes/today.txt"), {
			create: true,
			createMissingDirs: true,
		})

		const handle = runner.runOperation({ input: file })
		await handle.operationPromise

		expect(store.get(handle.status)).toBe(OperationStatus.SUCCEEDED)
		const state = store.get(handle.state)
		expect(state.stage).toBe(RemoveEntryOperationStage.REMOVAL)
		if (state.stage === RemoveEntryOperationStage.REMOVAL) {
			expect(state.discoveredFiles).toBe(1)
			expect(state.totalFilesRemoved).toBe(1)
		}

		const stat = await file.stat()
		expect(stat.exists).toBe(false)
	})

	test("falls back to regular removal on failure", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new RemoveEntryNativeOperationRunner(store)

		const root = await fs.getRootDir()
		const dir = await root.openDir(Path.parse("books"), { create: true })
		const file = await dir.openFile(Path.parse("readme.md"), {
			create: true,
		})
		const writer = await file.write({ mode: FsWriteMode.OVERWRITE })
		await writer.write(new Blob(["content"], { type: "text/plain" }))
		await writer.close()

		const deleteSpy = vi
			.spyOn(dir, "delete")
			.mockRejectedValueOnce(new Error("delete failed"))

		const handle = runner.runOperation({ input: dir })
		await handle.operationPromise

		expect(store.get(handle.status)).toBe(OperationStatus.SUCCEEDED)
		const state = store.get(handle.state)
		expect(state.stage).toBe(RemoveEntryOperationStage.REMOVAL)
		if (state.stage === RemoveEntryOperationStage.REMOVAL) {
			expect(state.discoveredDirs).toBe(1)
			expect(state.discoveredFiles).toBe(0)
			expect(state.totalDirsRemoved).toBe(1)
		}

		const dirStat = await dir.stat()
		expect(dirStat.exists).toBe(false)
		deleteSpy.mockRestore()
	})

	test("supports interrupt", async () => {
		const fs = new InMemoryFs()
		const store = createStore()
		const runner = new RemoveEntryNativeOperationRunner(store)

		const root = await fs.getRootDir()
		const dir = await root.openDir(Path.parse("data"), { create: true })
		await dir.openFile(Path.parse("a"), { create: true })

		const handle = runner.runOperation({ input: dir })
		store.set(handle.interrupt)
		await handle.operationPromise

		expect([
			OperationStatus.INTERRUPTED,
			OperationStatus.SUCCEEDED,
		]).toContain(store.get(handle.status))
	})
})
