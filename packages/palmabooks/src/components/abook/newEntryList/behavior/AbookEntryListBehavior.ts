import {
	AbookEntry,
	AbookEntryDisposition,
	AbookEntryNotFoundError,
	AbookEntrySourceType,
	WithId,
} from "@teawithsand/booklibr"
import { Atom, atom, atomWithImmer, WritableAtom } from "@teawithsand/fstate"
import {
	BaseError,
	Errors,
	inPlace,
	naturalStringComparator,
} from "@teawithsand/lngext"

export const AbookEntryListBehaviorError = Errors.makeErrorType(
	"AbookEntryListBehaviorError",
	BaseError,
)

/**
 * Custom error type for duplicate entry IDs.
 */
export const AbookEntryListBehaviorDuplicateEntryIdError = Errors.makeErrorType(
	"DuplicateEntryIdError",
	AbookEntryListBehaviorError,
)

/**
 * Filter configuration for abook entry list.
 */
export type AbookEntryListFilter = {
	/** Optional name query for filtering entries by filename */
	nameQuery?: string
	/** Optional disposition filter for filtering entries by type */
	disposition?: AbookEntryDisposition
}

/**
 * Available sort keys for abook entry list.
 */
export enum AbookEntryListSortKey {
	/** Sort by entry ID */
	ID = "id",
	/** Sort by creation date */
	CREATED_AT = "createdAt",
	/** Sort by entry disposition */
	DISPOSITION = "disposition",
	/** Sort by file name */
	FILE_NAME = "fileName",
}

/**
 * Sort configuration for abook entry list.
 */
export type AbookEntryListSort = {
	/** The key to sort by */
	key: AbookEntryListSortKey
	/** Whether to sort in ascending order */
	asc: boolean
}

/**
 * Behavior class for managing abook entry list UI logic.
 * Handles filtering, sorting, and modifications of entry collections.
 */
export class AbookEntryListBehavior {
	/**
	 * Atom containing all original entries, if there are any.
	 */
	public readonly originalEntries: Atom<Promise<WithId<AbookEntry>[]>>

	/**
	 * Atom containing all entries mapped to their ids.
	 */
	public readonly originalEntriesMap: Atom<Promise<Map<string, AbookEntry>>>

	/**
	 * Atom containing current filter settings.
	 */
	public readonly filter: WritableAtom<
		AbookEntryListFilter,
		[AbookEntryListFilter],
		void
	>

	/**
	 * Atom containing current sort settings.
	 */
	public readonly sort: WritableAtom<
		AbookEntryListSort,
		[AbookEntryListSort],
		void
	>

	/**
	 * Atom containing entries for UI; It handles any kind of filtering, but not sorting since this is a map.
	 */
	public readonly entriesMap: Atom<Promise<Map<string, AbookEntry>>>

	/**
	 * Map, which contains only entries that have been modified in some way.
	 * If id to null key exists, that means that this entry should be removed.
	 */
	public readonly modifiedEntries

	/**
	 * Atom containing the final sorted list of entries for display.
	 */
	public readonly entriesList: Atom<Promise<WithId<AbookEntry>[]>>

	/**
	 * Atom indicating whether the entry list has any modifications.
	 */
	public readonly isPristine: Atom<boolean>

	/**
	 * Atom that clears all modifications when set.
	 */
	public readonly clear

	/**
	 * Atom that allows editing an entry using a mutator function.
	 *
	 * @param id - The ID of the entry to edit
	 * @param mutator - Function that receives the original entry and current state,
	 *                  and returns the new entry state or null to delete
	 * @returns Promise that resolves to the new entry state or null if deleted
	 * @throws {AbookEntryNotFoundError} When the entry ID is not found in original entries
	 */
	public readonly editEntry

	/**
	 * Creates a new AbookEntryListBehavior instance.
	 * @param allEntries - Atom containing the promise of all original entries
	 */
	constructor(allEntries: Atom<Promise<WithId<AbookEntry>[]>>) {
		this.originalEntries = allEntries

		this.filter = atom<AbookEntryListFilter>({})
		this.sort = atom<AbookEntryListSort>({
			key: AbookEntryListSortKey.ID,
			asc: true,
		})

		this.modifiedEntries = atomWithImmer(
			new Map<string, AbookEntry | null>(),
		)
		this.originalEntriesMap = atom(async (get) => {
			const entries = await get(this.originalEntries)

			const entriesMap = new Map<string, AbookEntry>()

			for (const entry of entries) {
				if (entriesMap.has(entry.id.toString())) {
					throw new AbookEntryListBehaviorDuplicateEntryIdError(
						`Duplicate entry ID detected: ${entry.id}`,
					)
				}
				entriesMap.set(entry.id.toString(), entry.data)
			}

			return entriesMap
		})

		this.entriesMap = atom(async (get) => {
			const baseMap = new Map(await get(this.originalEntriesMap))
			const currentFilter = get(this.filter)

			const modifications = get(this.modifiedEntries)
			for (const [entryId, entryData] of modifications.entries()) {
				if (entryData === null) {
					baseMap.delete(entryId)
				} else {
					baseMap.set(entryId, entryData)
				}
			}

			const filteredMap = new Map<string, AbookEntry>()
			for (const [entryId, entryData] of baseMap.entries()) {
				if (this.matchesFilter(entryData, currentFilter)) {
					filteredMap.set(entryId, entryData)
				}
			}

			return filteredMap
		})

		this.isPristine = atom((get) => get(this.modifiedEntries).size === 0)

		this.entriesList = atom(async (get) => {
			const entriesMap = await get(this.entriesMap)
			const currentSort = get(this.sort)

			const entriesList: WithId<AbookEntry>[] = []

			for (const [entryId, entryData] of entriesMap.entries()) {
				entriesList.push({
					id: entryId,
					data: entryData,
				})
			}

			entriesList.sort((a, b) => this.compareEntries(a, b, currentSort))

			return entriesList
		})

		this.clear = atom(null, (_get, set) => {
			set(this.modifiedEntries, new Map())
		})

		this.editEntry = atom(
			null,
			async (
				get,
				set,
				id: string,
				mutator: (
					originalEntry: Readonly<AbookEntry>,
					currentEntry: Readonly<AbookEntry | null>,
				) => Promise<AbookEntry | null>,
			) => {
				const originalEntriesMapAtom = await get(
					this.originalEntriesMap,
				)

				const originalEntry = originalEntriesMapAtom.get(id)
				if (!originalEntry) {
					throw new AbookEntryNotFoundError(
						`Entry with ID '${id}' not found in original entries`,
					)
				}

				const modifiedEntriesMap = get(this.modifiedEntries)
				const preMutatedEntry = modifiedEntriesMap.get(id)
				const postMutatedEntry = await mutator(
					originalEntry,
					preMutatedEntry ?? null,
				)

				set(
					this.modifiedEntries,
					inPlace(() => {
						const mapCopy = new Map(modifiedEntriesMap)
						mapCopy.set(id, postMutatedEntry)
						return mapCopy
					}),
				)

				return postMutatedEntry
			},
		)
	}

	/**
	 * Checks if an entry matches the given filter criteria.
	 *
	 * @param entry - The entry to check
	 * @param filter - The filter criteria to apply
	 * @returns True if the entry matches the filter, false otherwise
	 */
	private readonly matchesFilter = (
		entry: AbookEntry,
		filter: AbookEntryListFilter,
	): boolean => {
		if (
			filter.disposition !== undefined &&
			entry.data.disposition !== filter.disposition
		) {
			return false
		}

		if (filter.nameQuery !== undefined && filter.nameQuery.trim() !== "") {
			const query = filter.nameQuery.toLowerCase().trim()

			if (entry.data.source.type === AbookEntrySourceType.UPLOAD) {
				const fileName = entry.data.source.uploadFileName.toLowerCase()
				if (fileName.includes(query)) {
					return true
				}
			}

			return false
		}

		return true
	}

	/**
	 * Compares two entries for sorting based on the given sort criteria.
	 *
	 * @param a - First entry to compare
	 * @param b - Second entry to compare
	 * @param sort - Sort configuration specifying key and direction
	 * @returns Negative number if a < b, positive if a > b, zero if equal
	 */
	private readonly compareEntries = (
		a: WithId<AbookEntry>,
		b: WithId<AbookEntry>,
		sort: AbookEntryListSort,
	): number => {
		let result = 0

		switch (sort.key) {
			case AbookEntryListSortKey.ID:
				result = naturalStringComparator.compare(
					a.id.toString(),
					b.id.toString(),
				)
				break
			case AbookEntryListSortKey.CREATED_AT:
				result =
					a.data.data.createdAt.toNumberMillis() -
					b.data.data.createdAt.toNumberMillis()
				break
			case AbookEntryListSortKey.DISPOSITION:
				result = a.data.data.disposition.localeCompare(
					b.data.data.disposition,
				)
				break
			case AbookEntryListSortKey.FILE_NAME: {
				const fileNameA =
					a.data.data.source.type === AbookEntrySourceType.UPLOAD
						? a.data.data.source.uploadFileName
						: a.id.toString()
				const fileNameB =
					b.data.data.source.type === AbookEntrySourceType.UPLOAD
						? b.data.data.source.uploadFileName
						: b.id.toString()
				result = naturalStringComparator.compare(fileNameA, fileNameB)
				break
			}
		}

		return sort.asc ? result : -result
	}
}
