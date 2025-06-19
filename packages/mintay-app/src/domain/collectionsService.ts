import {
	AppCardData,
	AppCollectionData,
	AppMintayTypeSpec,
	WithMintayId,
} from "@/mintay"
import { atom, atomWithRefresh, loadable } from "@teawithsand/fstate"
import { CollectionStore, MintayId } from "@teawithsand/mintay-core"

export class CollectionService {
	public readonly collectionStore: CollectionStore<AppMintayTypeSpec>

	constructor({
		collectionStore,
	}: {
		collectionStore: CollectionStore<AppMintayTypeSpec>
	}) {
		this.collectionStore = collectionStore
	}

	public readonly refreshCollectionsList = atom(null, (_get, set) => {
		set(this._collectionsList)
	})

	public readonly getCollection = (collectionId: MintayId) => {
		const collectionDataAtom = atomWithRefresh(async () => {
			const collection = this.collectionStore.get(collectionId)
			return await collection.read()
		})

		const collectionDataLoadable = loadable(collectionDataAtom)

		const cardCountAtom = atomWithRefresh(async () => {
			const collection = this.collectionStore.get(collectionId)
			return await collection.getCardCount()
		})

		const updateCollection = atom(
			null,
			async (_get, set, data: AppCollectionData) => {
				const collection = this.collectionStore.get(collectionId)
				await collection.save(data)
				set(collectionDataAtom)
				set(cardCountAtom)
				set(this._collectionsList)
			},
		)

		const deleteCollection = atom(null, async () => {
			const collection = this.collectionStore.get(collectionId)
			await collection.delete()
		})

		const createCollection = atom(
			null,
			async (_get, set, data: AppCollectionData) => {
				const collection = this.collectionStore.get(collectionId)
				await collection.save(data)
				set(collectionDataAtom)
				set(cardCountAtom)
			},
		)

		return {
			data: atom((get) => get(collectionDataAtom)),
			dataWithId: atom(
				async (get) =>
					({
						id: collectionId,
						data: await get(collectionDataAtom),
					}) satisfies WithMintayId<AppCollectionData | null>,
			),
			dataLoadable: collectionDataLoadable,
			cardCount: atom((get) => get(cardCountAtom)),
			update: updateCollection,
			delete: deleteCollection,
			create: createCollection,
			refresh: atom(null, (_get, set) => {
				set(collectionDataAtom)
				set(cardCountAtom)
			}),
		}
	}

	/**
	 * Gets cards for a specific collection with reactive operations.
	 * Returns atoms for card data access and refresh functionality.
	 */
	public readonly getCollectionCards = (collectionId: MintayId) => {
		const cardsDataAtom = atomWithRefresh(async () => {
			const collection = this.collectionStore.get(collectionId)
			const cardHandles = await collection.getCards()

			const cardsWithIds: Array<WithMintayId<AppCardData>> = []

			for (const handle of cardHandles) {
				const data = await handle.read()
				if (data) {
					cardsWithIds.push({ id: handle.id, data })
				}
			}

			return cardsWithIds
		})

		const cardsDataLoadable = loadable(cardsDataAtom)

		return {
			data: atom((get) => get(cardsDataAtom)),
			dataLoadable: cardsDataLoadable,
			refresh: atom(null, (_get, set) => {
				set(cardsDataAtom)
			}),
		}
	}

	private readonly _collectionsList = atomWithRefresh(async () => {
		const ids = await this.collectionStore.list()

		const collections: Array<WithMintayId<AppCollectionData>> = []

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
