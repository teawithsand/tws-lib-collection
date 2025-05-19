import { beforeEach, describe, expect, test, vi } from "vitest"
import { PlayerEntry, PlayerEntryType } from "../player"
import { MultiDurationLoaderImpl } from "./multiLoader"

// Helper to collect emitted states from a StickySubscribable (using addSubscriber)
function collectStates<T>(subscribable: {
	addSubscriber: (subscriber: (v: T) => void) => () => void
}): {
	states: T[]
	unsubscribe: () => void
} {
	const states: T[] = []
	const cancel = subscribable.addSubscriber((state) => {
		states.push(state)
	})
	return {
		states,
		unsubscribe: cancel,
	}
}

describe("MultiDurationLoaderImpl", () => {
	// Mock AudioDurationLoader with controllable async behavior
	class MockLoader {
		loadDuration = vi.fn((entry: PlayerEntry): Promise<number> => {
			if (entry.type === PlayerEntryType.URL && entry.url === "bad")
				return Promise.reject(new Error("fail"))
			if (entry.type === PlayerEntryType.URL && entry.url === "slow")
				return new Promise((r) => setTimeout(() => r(5), 50))
			// For blob or URL entries with other URLs, return 3 as dummy duration
			return Promise.resolve(3)
		})
	}

	let loader: MockLoader
	let multiLoader: MultiDurationLoaderImpl

	beforeEach(() => {
		loader = new MockLoader()
		multiLoader = new MultiDurationLoaderImpl(loader)
	})

	test("initial state emits empty metadataBag with no loading", () => {
		const { states, unsubscribe } = collectStates(
			multiLoader.metadataLoadState,
		)
		multiLoader.setEntries([])
		expect(states.length).toBeGreaterThanOrEqual(1)
		const lastState = states[states.length - 1]!
		expect(lastState.metadataBag.length).toBe(0)
		expect(lastState.isLoading).toBe(false)
		unsubscribe()
	})

	test("setEntries queues loading and updates metadataBag with OK results", async () => {
		const entries: PlayerEntry[] = [
			{ type: PlayerEntryType.URL, url: "good1" },
			{ type: PlayerEntryType.URL, url: "good2" },
		]

		const { states, unsubscribe } = collectStates(
			multiLoader.metadataLoadState,
		)

		multiLoader.setEntries(entries)

		expect(states.some((s) => s.isLoading)).toBe(true)

		await multiLoader.idlePromise()

		const lastState = states[states.length - 1]!
		expect(lastState.isLoading).toBe(false)
		expect(lastState.metadataBag.length).toBe(2)

		expect(lastState.metadataBag.getDuration(0)).toEqual(3)
		expect(lastState.metadataBag.getDuration(1)).toEqual(3)

		expect(loader.loadDuration).toHaveBeenCalledTimes(2)

		unsubscribe()
	})

	test("handles loading errors and sets ERROR result type", async () => {
		const entries: PlayerEntry[] = [
			{ type: PlayerEntryType.URL, url: "good" },
			{ type: PlayerEntryType.URL, url: "bad" },
		]
		const { states, unsubscribe } = collectStates(
			multiLoader.metadataLoadState,
		)
		multiLoader.setEntries(entries)
		await multiLoader.idlePromise()

		const lastState = states[states.length - 1]!
		expect(lastState.metadataBag.length).toBe(2)

		// Duration for first entry should be a number (OK)
		expect(lastState.metadataBag.getDuration(0)).toEqual(3)

		// For the error entry, duration should be null (error or not loaded)
		expect(lastState.metadataBag.getDuration(1)).toBeNull()

		unsubscribe()
	})

	test("reloadEntry reloads and updates result at given index", async () => {
		const entries: PlayerEntry[] = [
			{ type: PlayerEntryType.URL, url: "good" },
			{ type: PlayerEntryType.URL, url: "good2" },
		]
		const { states, unsubscribe } = collectStates(
			multiLoader.metadataLoadState,
		)
		multiLoader.setEntries(entries)
		await multiLoader.idlePromise()

		loader.loadDuration.mockImplementationOnce(() => Promise.resolve(42))

		multiLoader.reloadEntry(1)
		await multiLoader.idlePromise()

		const lastState = states[states.length - 1]!

		// First entry duration unchanged
		expect(lastState.metadataBag.getDuration(0)).toEqual(3)

		// Second entry duration updated to 42 (from mocked reload)
		expect(lastState.metadataBag.getDuration(1)).toEqual(42)

		unsubscribe()
	})

	test("reloadEntry does nothing for invalid indices", () => {
		const entries: PlayerEntry[] = [
			{ type: PlayerEntryType.URL, url: "good" },
		]
		multiLoader.setEntries(entries)
		multiLoader.reloadEntry(-1)
		multiLoader.reloadEntry(10)
	})

	test("setEntries cancels previous loading; only latest entries loaded", async () => {
		const slowEntries: PlayerEntry[] = [
			{ type: PlayerEntryType.URL, url: "slow" },
			{ type: PlayerEntryType.URL, url: "slow" },
		]
		const { unsubscribe: unsubSlow } = collectStates(
			multiLoader.metadataLoadState,
		)
		multiLoader.setEntries(slowEntries)

		const fastEntries: PlayerEntry[] = [
			{ type: PlayerEntryType.URL, url: "fast1" },
			{ type: PlayerEntryType.URL, url: "fast2" },
		]
		const { states: fastStates, unsubscribe: unsubFast } = collectStates(
			multiLoader.metadataLoadState,
		)
		multiLoader.setEntries(fastEntries)

		await multiLoader.idlePromise()

		const lastState = fastStates[fastStates.length - 1]!

		expect(lastState.metadataBag.length).toBe(2)

		expect(lastState.metadataBag.getDuration(0)).toEqual(3)
		expect(lastState.metadataBag.getDuration(1)).toEqual(3)

		unsubSlow()
		unsubFast()
	})

	test("idlePromise resolves once all tasks are done", async () => {
		const entries: PlayerEntry[] = [
			{ type: PlayerEntryType.URL, url: "slow" },
		]
		multiLoader.setEntries(entries)

		let loadingStatesObserved = false
		const { states, unsubscribe } = collectStates(
			multiLoader.metadataLoadState,
		)

		multiLoader.setEntries(entries)

		states.some((s) => {
			if (s.isLoading) {
				loadingStatesObserved = true
			}
			return loadingStatesObserved
		})

		expect(loadingStatesObserved).toBe(true)

		await multiLoader.idlePromise()

		const lastState = states[states.length - 1]!
		expect(lastState.isLoading).toBe(false)

		unsubscribe()
	})
})
