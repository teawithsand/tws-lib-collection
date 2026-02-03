import {
	AbookEntry,
	AbookEntryDisposition,
	Id,
	WithId,
} from "@teawithsand/booklibr"
import { atom, Atom, loadable, produce } from "@teawithsand/fstate"
import { ReactContextUtil } from "@teawithsand/mlui"
import { AbookEntrySortOption } from "./common"

export class AbookEntryListBehavior {
	public readonly sortMode
	public readonly filterText
	public readonly selectedDispositions

	public readonly shownEntries
	public readonly shownEntriesLoadable

	public readonly selectedEntries
	public readonly selectedEntriesLoadable
	public readonly shownSelectedEntries
	public readonly setEntrySelection
	public readonly toggleEntrySelection
	public readonly clearSelection
	public readonly selectAllShownEntries
	public readonly isEntrySelected
	public readonly deleteSelectedEntries
	public readonly isAtLeastOneEntrySelected
	public readonly isAtLeastOneEntrySelectedLoadable

	public constructor(
		public readonly allEntries: Atom<Promise<WithId<AbookEntry>[]>>,
		public readonly refresh: () => void,
		public readonly onEntryClick: (entry: WithId<AbookEntry>) => void,
		public readonly onDeleteSelectedEntries?: (
			entries: WithId<AbookEntry>[],
		) => void | Promise<void>,
	) {
		this.sortMode = atom<AbookEntrySortOption>(
			AbookEntrySortOption.ORDINAL_NUMBER_ASC,
		)
		this.filterText = atom<string>("")

		const sortedEntries = atom(async (get) => {
			const entries = get(allEntries)
			const sorted = [...(await entries)]

			const sortOption = get(this.sortMode)

			if (sortOption === AbookEntrySortOption.ORDINAL_NUMBER_ASC) {
				return sorted.sort(
					(a, b) =>
						a.data.data.ordinalNumber - b.data.data.ordinalNumber,
				)
			}

			if (sortOption === AbookEntrySortOption.ORDINAL_NUMBER_DESC) {
				return sorted.sort(
					(a, b) =>
						b.data.data.ordinalNumber - a.data.data.ordinalNumber,
				)
			}

			if (sortOption === AbookEntrySortOption.NAME_ASC) {
				return sorted.sort((a, b) =>
					(a.data.data.name || "").localeCompare(
						b.data.data.name || "",
					),
				)
			}

			if (sortOption === AbookEntrySortOption.NAME_DESC) {
				return sorted.sort((a, b) =>
					(b.data.data.name || "").localeCompare(
						a.data.data.name || "",
					),
				)
			}

			return sorted
		})

		this.selectedDispositions = atom<Set<AbookEntryDisposition>>(
			new Set(Object.values(AbookEntryDisposition)),
		)

		const filteredEntries = atom(async (get) => {
			const query = get(this.filterText).toLowerCase()
			const dispositions = get(this.selectedDispositions)

			return (await get(sortedEntries)).filter((e) => {
				const nameMatches = e.data.data.name
					?.toLowerCase()
					.includes(query.toLowerCase())

				if (!nameMatches) return false

				if (!dispositions.has(e.data.data.disposition)) {
					return false
				}

				return true
			})
		})

		this.shownEntries = filteredEntries
		this.shownEntriesLoadable = loadable(this.shownEntries)

		const selectedEntriesIds = atom(new Set<Id>())
		this.selectedEntries = atom(async (get) => {
			const ids = get(selectedEntriesIds)
			const entries = await get(allEntries)
			return entries.filter((e) => ids.has(e.id))
		})
		this.selectedEntriesLoadable = loadable(this.selectedEntries)
		this.shownSelectedEntries = atom(async (get) => {
			const ids = get(selectedEntriesIds)
			const entries = await get(this.shownEntries)
			return entries.filter((e) => ids.has(e.id))
		})
		this.setEntrySelection = atom(
			null,
			(get, set, entry: WithId<AbookEntry>, selected: boolean) => {
				const ids = get(selectedEntriesIds)
				const newIds = produce(ids, (draft) => {
					if (selected) {
						draft.add(entry.id)
					} else {
						draft.delete(entry.id)
					}
				})

				set(selectedEntriesIds, newIds)
			},
		)
		this.toggleEntrySelection = atom(
			null,
			(get, set, entry: WithId<AbookEntry>) => {
				const ids = get(selectedEntriesIds)
				const newIds = produce(ids, (draft) => {
					if (!draft.has(entry.id)) {
						draft.add(entry.id)
					} else {
						draft.delete(entry.id)
					}
				})

				set(selectedEntriesIds, newIds)
			},
		)
		this.clearSelection = atom(null, (_get, set) => {
			set(selectedEntriesIds, new Set())
		})

		this.selectAllShownEntries = atom(null, async (get, set) => {
			const entries = await get(this.shownEntries)
			const newIds = new Set(entries.map((entry) => entry.id))
			set(selectedEntriesIds, newIds)
		})

		this.deleteSelectedEntries = atom(null, async (get, set) => {
			const entries = await get(this.selectedEntries)
			if (entries.length === 0) return
			if (this.onDeleteSelectedEntries) {
				await this.onDeleteSelectedEntries(entries)
			}
			set(selectedEntriesIds, new Set())
			this.refresh()
		})

		this.isAtLeastOneEntrySelected = atom(async (get) => {
			const entries = await get(this.selectedEntries)
			return entries.length > 0
		})

		this.isAtLeastOneEntrySelectedLoadable = loadable(
			this.isAtLeastOneEntrySelected,
		)

		this.isEntrySelected = atom((get) => {
			const ids = get(selectedEntriesIds)

			return (entry: WithId<AbookEntry>) => {
				return ids.has(entry.id)
			}
		})
	}
}
export const [AbookEntryListBehaviorContext, useAbookEntryListBehavior] =
	ReactContextUtil.simpleContext<AbookEntryListBehavior>(
		"AbookEntryListBehavior",
	)
