import {
	AbookEntry,
	AbookEntryData,
	AbookEntryDisposition,
	AbookEntryNotFoundError,
	AbookEntrySourceType,
	WithId,
} from "@teawithsand/booklibr"
import { atom, createStore } from "@teawithsand/fstate"
import { Timestamp } from "@teawithsand/lngext"
import { beforeEach, describe, expect, test } from "vitest"
import {
	AbookEntryListBehavior,
	AbookEntryListBehaviorDuplicateEntryIdError,
	AbookEntryListSortKey,
} from "./AbookEntryListBehavior"

const createMockAbookEntry = (id: string): WithId<AbookEntry> => {
	const data: AbookEntryData = {
		createdAt: Timestamp.fromDate(new Date()),
		disposition: AbookEntryDisposition.PLAYABLE_AUDIO,
		source: {
			type: AbookEntrySourceType.UPLOAD,
			uploadedAt: Date.now(),
			uploadFileName: `${id}.mp3`,
			uploadFileMime: "audio/mpeg",
		},
	}

	const entry = new AbookEntry({
		data,
		aggregate: {
			metadata: null,
			blobSize: 1024,
		},
	})

	return {
		id,
		data: entry,
	}
}

describe("AbookEntryListBehavior", () => {
	let behavior: AbookEntryListBehavior
	let store: ReturnType<typeof createStore>
	let mockEntries: WithId<AbookEntry>[]

	beforeEach(() => {
		store = createStore()
		mockEntries = [
			createMockAbookEntry("1"),
			createMockAbookEntry("2"),
			createMockAbookEntry("3"),
		]

		const entriesAtom = atom(Promise.resolve(mockEntries))
		behavior = new AbookEntryListBehavior(entriesAtom)
	})

	describe("originalEntriesMap", () => {
		test("should throw DuplicateEntryIdError when duplicate IDs are found", async () => {
			const duplicateEntries = [
				createMockAbookEntry("1"),
				createMockAbookEntry("1"),
			]

			const entriesAtom = atom(Promise.resolve(duplicateEntries))
			const behaviorWithDuplicates = new AbookEntryListBehavior(
				entriesAtom,
			)

			await expect(
				store.get(behaviorWithDuplicates.originalEntriesMap),
			).rejects.toThrow(AbookEntryListBehaviorDuplicateEntryIdError)
		})
	})

	describe("entriesMap", () => {
		test("should include modified entries", async () => {
			const newEntry = createMockAbookEntry("4").data
			const modifiedMap = new Map([["4", newEntry]])
			store.set(behavior.modifiedEntries, modifiedMap)

			const entriesMap = await store.get(behavior.entriesMap)

			expect(entriesMap.size).toBe(4)
			expect(entriesMap.get("4")).toBe(newEntry)
		})

		test("should remove entries when modified to null", async () => {
			const modifiedMap = new Map<string, AbookEntry | null>([
				["1", null],
			])
			store.set(behavior.modifiedEntries, modifiedMap)

			const entriesMap = await store.get(behavior.entriesMap)

			expect(entriesMap.size).toBe(2)
			expect(entriesMap.has("1")).toBe(false)
		})
	})

	describe("isPristine", () => {
		test("should be false when there are modifications", () => {
			const newEntry = createMockAbookEntry("4").data
			const modifiedMap = new Map([["4", newEntry]])
			store.set(behavior.modifiedEntries, modifiedMap)

			const isPristine = store.get(behavior.isPristine)
			expect(isPristine).toBe(false)
		})
	})

	describe("entriesList", () => {
		test("should exclude deleted entries from list", async () => {
			const modifiedMap = new Map<string, AbookEntry | null>([
				["2", null],
			])
			store.set(behavior.modifiedEntries, modifiedMap)

			const entriesList = await store.get(behavior.entriesList)

			expect(entriesList).toHaveLength(2)
			expect(
				entriesList.find((entry) => entry.id === "2"),
			).toBeUndefined()
		})

		test("should sort entries by id using natural string comparator", async () => {
			const mockEntriesUnsorted = [
				createMockAbookEntry("entry-10"),
				createMockAbookEntry("entry-2"),
				createMockAbookEntry("entry-1"),
			]

			const entriesAtom = atom(Promise.resolve(mockEntriesUnsorted))
			const newBehavior = new AbookEntryListBehavior(entriesAtom)

			const entriesList = await store.get(newBehavior.entriesList)

			expect(entriesList[0].id).toBe("entry-1")
			expect(entriesList[1].id).toBe("entry-2")
			expect(entriesList[2].id).toBe("entry-10")
		})
	})

	describe("filter", () => {
		test("should filter by name query", async () => {
			store.set(behavior.filter, { nameQuery: "1.mp3" })

			const entriesMap = await store.get(behavior.entriesMap)
			expect(entriesMap.size).toBe(1)
			expect(entriesMap.has("1")).toBe(true)
		})

		test("should filter by disposition", async () => {
			store.set(behavior.filter, {
				disposition: AbookEntryDisposition.COVER_IMAGE,
			})

			const entriesMap = await store.get(behavior.entriesMap)
			expect(entriesMap.size).toBe(0)
		})
	})

	describe("sort", () => {
		test("should have default sort ascending by ID", async () => {
			const entriesList = await store.get(behavior.entriesList)
			expect(entriesList[0].id).toBe("1")
			expect(entriesList[1].id).toBe("2")
			expect(entriesList[2].id).toBe("3")
		})

		test("should sort descending", async () => {
			store.set(behavior.sort, {
				key: AbookEntryListSortKey.ID,
				asc: false,
			})

			const entriesList = await store.get(behavior.entriesList)
			expect(entriesList[0].id).toBe("3")
			expect(entriesList[2].id).toBe("1")
		})
	})

	describe("editEntry", () => {
		test("should edit an existing entry", async () => {
			const result = await store.set(
				behavior.editEntry,
				"1",
				async (originalEntry, currentEntry) => {
					expect(originalEntry).toBe(mockEntries[0].data)
					expect(currentEntry).toBe(null)

					const newData: AbookEntryData = {
						...originalEntry.data,
						disposition: AbookEntryDisposition.COVER_IMAGE,
					}

					return new AbookEntry({
						data: newData,
						aggregate: originalEntry.aggregate,
					})
				},
			)

			expect(result!.data.disposition).toBe(
				AbookEntryDisposition.COVER_IMAGE,
			)
		})

		test("should delete an entry when mutator returns null", async () => {
			const result = await store.set(
				behavior.editEntry,
				"1",
				async () => null,
			)

			expect(result).toBe(null)

			const entriesList = await store.get(behavior.entriesList)
			expect(entriesList).toHaveLength(2)
		})

		test("should throw AbookEntryNotFoundError for non-existent entry", async () => {
			await expect(
				store.set(behavior.editEntry, "non-existent", async () => null),
			).rejects.toThrow(AbookEntryNotFoundError)
		})
	})
})
