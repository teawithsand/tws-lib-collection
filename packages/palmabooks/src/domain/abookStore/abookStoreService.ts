import {
	Abook,
	AbookEntry,
	AbookHeaderData,
	AbookNotFoundError,
	AbookStore,
	Id,
	WithId,
} from "@teawithsand/booklibr"
import { atom, atomWithRefresh, loadable } from "@teawithsand/fstate"

/**
 * Miscellaneous atoms used to operate on a ABook.
 */
export type AbookStoreServiceAbookAtoms = ReturnType<
	AbookStoreService["getAbook"]
>

/**
 * Service for managing audiobook operations with reactive state management.
 * Wraps AbookStore from booklibr and provides atom-based reactive interfaces.
 */
export class AbookStoreService {
	public readonly abookStore: AbookStore

	constructor({ abookStore }: { abookStore: AbookStore }) {
		this.abookStore = abookStore
	}

	/**
	 * Atom that loads all audiobooks from the store.
	 */
	private readonly _abooksList = atomWithRefresh(async () => {
		const handles = await this.abookStore.listAbooks()
		const abooks: WithId<Abook>[] = []

		for (const handle of handles) {
			const abook = await handle.read()
			if (abook) {
				abooks.push({
					data: abook,
					id: handle.id,
				})
			}
		}

		return abooks
	})

	/**
	 * Loadable atom for all audiobooks list.
	 */
	public readonly abooksListLoadable = loadable(this._abooksList)

	/**
	 * Atom to get all audiobooks.
	 */
	public readonly abooksList = atom((get) => get(this._abooksList))

	/**
	 * Atom to refresh the audiobooks list.
	 */
	public readonly refreshAbooksList = atom(null, (_get, set) => {
		set(this._abooksList)
	})

	/**
	 * Atom to create a new audiobook.
	 */
	public readonly createAbook = atom(
		null,
		async (_get, set, headerData: AbookHeaderData) => {
			await this.abookStore.createAbook(headerData)
			set(this._abooksList)
		},
	)

	/**
	 * Gets an audiobook handle with reactive operations for a specific audiobook ID.
	 * Returns atoms for data access, updates, deletion, and entry management.
	 */
	public readonly getAbook = (abookId: Id) => {
		const abookDataAtom = atomWithRefresh(async () => {
			const handle = await this.abookStore.get(abookId)
			return await handle.read()
		})

		const abookDataLoadable = loadable(abookDataAtom)

		const abookEntriesAtom = atomWithRefresh(async () => {
			try {
				const handle = await this.abookStore.get(abookId)
				const entryHandles = await handle.listEntries()
				const entries: WithId<AbookEntry>[] = []

				for (const entryHandle of entryHandles) {
					const entry = await entryHandle.read()
					if (entry) {
						entries.push({
							data: entry,
							id: entryHandle.id,
						})
					}
				}

				return entries
			} catch (e) {
				if (e instanceof AbookNotFoundError) {
					return []
				}
				throw e
			}
		})

		const updateAbook = atom(
			null,
			async (_get, set, options: { data?: AbookHeaderData }) => {
				const handle = await this.abookStore.get(abookId)
				await handle.write(options)
				set(abookDataAtom)
				set(this._abooksList)
			},
		)

		const deleteAbook = atom(null, async (_get, set) => {
			const handle = await this.abookStore.get(abookId)
			await handle.delete()
			set(this._abooksList)
		})

		const computeAggregate = atom(null, async (_get, set) => {
			const handle = await this.abookStore.get(abookId)
			await handle.computeAggregate()
			set(abookDataAtom)
			set(this._abooksList)
		})

		return {
			data: atom((get) => get(abookDataAtom)),
			dataWithId: atom(
				async (get) =>
					({
						data: await get(abookDataAtom),
						id: abookId,
					}) satisfies WithId<Abook | null>,
			),
			dataLoadable: abookDataLoadable,
			entries: atom((get) => get(abookEntriesAtom)),
			entriesLoadable: loadable(abookEntriesAtom),
			update: updateAbook,
			delete: deleteAbook,
			computeAggregate,
			refresh: atom(null, (_get, set) => {
				set(abookDataAtom)
				set(abookEntriesAtom)
			}),
		}
	}
}
