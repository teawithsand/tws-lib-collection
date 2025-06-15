import { atom, atomWithRefresh, loadable } from "@teawithsand/fstate"
import {
	CardId,
	CollectionStore,
	MintayCollectionData,
	MintayTypeSpec,
} from "@teawithsand/mintay-core"

export class CollectionService {
	public readonly collectionStore: CollectionStore<MintayTypeSpec>

	constructor({
		collectionStore,
	}: {
		collectionStore: CollectionStore<MintayTypeSpec>
	}) {
		this.collectionStore = collectionStore
	}

	private readonly _collectionsDataList = atomWithRefresh(async () => {
		const ids = await this.collectionStore.list()

		const collections: MintayCollectionData[] = []

		for (const id of ids) {
			const handle = this.collectionStore.get(id)
			collections.push(await handle.mustRead())
		}

		return collections
	})

	public readonly collectionsDataList = atom((get) =>
		get(this._collectionsDataList),
	)

	public readonly collectionDataListLoadable = loadable(
		this.collectionsDataList,
	)

	public readonly refreshCollectionsList = atom(null, (_get, set) => {
		set(this._collectionsDataList)
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
				set(this._collectionsDataList)
			},
		)

		const deleteCollection = atom(null, async (_get, set) => {
			const collection = this.collectionStore.get(collectionId)
			await collection.delete()
			set(this._collectionsDataList)
		})

		const createCollection = atom(
			null,
			async (_get, set, data: MintayCollectionData) => {
				const collection = this.collectionStore.get(collectionId)
				await collection.save(data)
				set(collectionDataAtom)
				set(this._collectionsDataList)
			},
		)

		return {
			data: atom((get) => get(collectionDataAtom)),
			dataLoadable: collectionDataLoadable,
			update: updateCollection,
			delete: deleteCollection,
			create: createCollection,
			refresh: atom(null, (_get, set) => {
				set(collectionDataAtom)
			}),
		}
	}
}
