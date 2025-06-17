import { atom, atomWithRefresh, loadable } from "@teawithsand/fstate"
import {
	CardId,
	CollectionStore,
	MintayCollectionData,
	MintayTypeSpec,
} from "@teawithsand/mintay-core"
import { WithMintayId } from "./mintay"

export class CollectionService {
	public readonly collectionStore: CollectionStore<MintayTypeSpec>

	constructor({
		collectionStore,
	}: {
		collectionStore: CollectionStore<MintayTypeSpec>
	}) {
		this.collectionStore = collectionStore
	}

	public readonly refreshCollectionsList = atom(null, (_get, set) => {
		set(this._collectionsList)
	})

	public readonly getCollection = (collectionId: CardId) => {
		const collectionDataAtom = atomWithRefresh(async () => {
			const collection = this.collectionStore.get(collectionId)
			return await collection.read()
		})

		const collectionDataLoadable = loadable(collectionDataAtom)

		const updateCollection = atom(
			null,
			async (_get, set, data: MintayCollectionData) => {
				const collection = this.collectionStore.get(collectionId)
				await collection.save(data)
				set(collectionDataAtom)
				set(this._collectionsList)
			},
		)

		const deleteCollection = atom(null, async () => {
			const collection = this.collectionStore.get(collectionId)
			await collection.delete()
		})

		const createCollection = atom(
			null,
			async (_get, set, data: MintayCollectionData) => {
				const collection = this.collectionStore.get(collectionId)
				await collection.save(data)
				set(collectionDataAtom)
			},
		)

		return {
			data: atom((get) => get(collectionDataAtom)),
			dataWithId: atom(
				async (get) =>
					({
						id: collectionId,
						data: await get(collectionDataAtom),
					}) satisfies WithMintayId<MintayCollectionData | null>,
			),
			dataLoadable: collectionDataLoadable,
			update: updateCollection,
			delete: deleteCollection,
			create: createCollection,
			refresh: atom(null, (_get, set) => {
				set(collectionDataAtom)
			}),
		}
	}

	private readonly _collectionsList = atomWithRefresh(async () => {
		const ids = await this.collectionStore.list()

		const collections: Array<WithMintayId<MintayCollectionData>> = []

		for (const id of ids) {
			const handle = this.collectionStore.get(id)
			const data = await handle.mustRead()
			collections.push({ id, data })
		}

		return collections
	})

	public readonly collectionsList = atom((get) => get(this._collectionsList))

	public readonly collectionListLoadable = loadable(this.collectionsList)
}
