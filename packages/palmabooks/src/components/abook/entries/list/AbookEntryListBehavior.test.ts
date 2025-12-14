import {
	AbookEntry,
	AbookEntryDisposition,
	AbookEntrySourceType,
} from "@teawithsand/booklibr"
import { atom, createStore } from "@teawithsand/fstate"
import { Timestamp } from "@teawithsand/lngext"
import { beforeEach, describe, expect, test } from "vitest"
import { AbookEntryListBehavior } from "./AbookEntryListBehavior"
import { AbookEntrySortOption } from "./common"

const makeEntry = (opts: {
	id: string
	name: string
	ordinal: number
	disposition: AbookEntryDisposition
}) => {
	const { id, name, ordinal, disposition } = opts
	const entry = new AbookEntry({
		data: {
			createdAt: Timestamp.fromNumber(Date.now()),
			name,
			disposition,
			source: {
				type: AbookEntrySourceType.UPLOAD,
				uploadedAt: Timestamp.fromNumber(Date.now()),
				uploadFileName: "file",
				uploadFileMime: "application/octet-stream",
			},
			ordinalNumber: ordinal,
		},
		aggregate: {
			metadata: null,
			blobSize: null,
		},
	})

	return { id, data: entry }
}

describe("AbookEntryListBehavior", () => {
	let store: ReturnType<typeof createStore>

	beforeEach(() => {
		store = createStore()
	})

	test("sorts and filters entries and handles selection", async () => {
		const e1 = makeEntry({
			id: "1",
			name: "B",
			ordinal: 2,
			disposition: AbookEntryDisposition.PLAYABLE_AUDIO,
		})
		const e2 = makeEntry({
			id: "2",
			name: "A",
			ordinal: 1,
			disposition: AbookEntryDisposition.COVER_IMAGE,
		})

		const entriesAtom = atom(Promise.resolve([e1, e2]))

		const behavior = new AbookEntryListBehavior(
			entriesAtom,
			() => {},
			() => {},
		)

		// default sort is ordinal asc -> e2 then e1
		const shownDefault = await store.get(behavior.shownEntries)
		expect(shownDefault.map((e) => e.id)).toEqual(["2", "1"])

		// sort by name asc
		store.set(behavior.sortMode, AbookEntrySortOption.NAME_ASC)
		const shownNameAsc = await store.get(behavior.shownEntries)
		expect(shownNameAsc.map((e) => e.id)).toEqual(["2", "1"])

		// sort by name desc
		store.set(behavior.sortMode, AbookEntrySortOption.NAME_DESC)
		const shownNameDesc = await store.get(behavior.shownEntries)
		expect(shownNameDesc.map((e) => e.id)).toEqual(["1", "2"])

		// filter text
		store.set(behavior.filterText, "B")
		const filtered = await store.get(behavior.shownEntries)
		expect(filtered.map((e) => e.id)).toEqual(["1"])

		// dispositions
		store.set(
			behavior.selectedDispositions,
			new Set([AbookEntryDisposition.PLAYABLE_AUDIO]),
		)
		const filteredByDisposition = await store.get(behavior.shownEntries)
		expect(filteredByDisposition.map((e) => e.id)).toEqual(["1"])

		// selection via toggle
		await store.set(behavior.toggleEntrySelection, e1)
		const selected = await store.get(behavior.selectedEntries)
		expect(selected.map((e) => e.id)).toEqual(["1"])

		// isEntrySelected fn
		const isSelectedFn = store.get(behavior.isEntrySelected)
		expect(isSelectedFn(e1)).toBe(true)

		// shownSelectedEntries reflects filter + selection
		store.set(behavior.filterText, "")
		const shownSelected = await store.get(behavior.shownSelectedEntries)
		expect(shownSelected.map((e) => e.id)).toEqual(["1"])

		// clear selection
		store.set(behavior.clearSelection)
		const afterClear = await store.get(behavior.selectedEntries)
		expect(afterClear).toHaveLength(0)
	})

	test("setEntrySelection via tuple/object and ordinal desc sort", async () => {
		const e1 = makeEntry({
			id: "1",
			name: "B",
			ordinal: 2,
			disposition: AbookEntryDisposition.PLAYABLE_AUDIO,
		})
		const e2 = makeEntry({
			id: "2",
			name: "A",
			ordinal: 1,
			disposition: AbookEntryDisposition.COVER_IMAGE,
		})

		const entriesAtom = atom(Promise.resolve([e1, e2]))
		const behavior = new AbookEntryListBehavior(
			entriesAtom,
			() => {},
			() => {},
		)

		// ordinal desc
		store.set(behavior.sortMode, AbookEntrySortOption.ORDINAL_NUMBER_DESC)
		const shownDesc = await store.get(behavior.shownEntries)
		expect(shownDesc.map((e) => e.id)).toEqual(["1", "2"])

		// set selection via tuple (3-arg style)
		await store.set(behavior.setEntrySelection, e1, true)
		let selected = await store.get(behavior.selectedEntries)
		expect(selected.map((e) => e.id)).toEqual(["1"])

		// unset via object (3-arg style)
		await store.set(behavior.setEntrySelection, e1, false)
		selected = await store.get(behavior.selectedEntries)
		expect(selected).toHaveLength(0)
	})
})
