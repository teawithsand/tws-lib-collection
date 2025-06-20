import { BackendCollectionData } from "@/domain/backend/backendCollectionData"
import { AppCardData, AppCollectionData, AppMintayTypeSpec } from "@/mintay"
import { generateUuid } from "@teawithsand/lngext"
import { CollectionStore, MintayId } from "@teawithsand/mintay-core"

/**
 * Service responsible for importing and exporting collections between the application
 * and backend formats. Handles conversion between internal app data structures
 * and the standardized backend collection data format.
 */
export class CollectionImportExport {
	private readonly collectionStore: CollectionStore<AppMintayTypeSpec>

	constructor({
		collectionStore,
	}: {
		collectionStore: CollectionStore<AppMintayTypeSpec>
	}) {
		this.collectionStore = collectionStore
	}

	/**
	 * Exports a collection from the application format to backend format.
	 * Retrieves collection data and all associated cards, converting them
	 * to the backend's expected data structure.
	 */
	public readonly exportCollection = async (
		collectionId: MintayId,
	): Promise<BackendCollectionData> => {
		const collection = this.collectionStore.get(collectionId)
		const collectionData = await collection.mustRead()
		const cardHandles = await collection.getCards()

		const cards: BackendCollectionData["cards"] = []

		for (const cardHandle of cardHandles) {
			const cardData = await cardHandle.read()
			if (cardData) {
				cards.push({
					globalId: cardData.globalId,
					questionContent: cardData.questionContent,
					answerContent: cardData.answerContent,
				})
			}
		}

		return {
			collection: {
				globalId: collectionData.globalId,
				title: collectionData.title,
				description: collectionData.description,
			},
			cards,
		}
	}

	/**
	 * Imports a collection from backend format to application format.
	 * Creates a new collection with regenerated IDs for both the collection
	 * and all cards to ensure uniqueness in the local system.
	 */
	public readonly importCollection = async (
		backendData: BackendCollectionData,
	): Promise<MintayId> => {
		const now = Date.now()

		// First create collection to get auto-assigned ID
		const collection = await this.collectionStore.create()
		const collectionId = collection.id

		const collectionData: AppCollectionData = {
			globalId: generateUuid(),
			title: backendData.collection.title,
			description: backendData.collection.description || "",
			createdAt: now,
			updatedAt: now,
		}

		await collection.save(collectionData)

		for (const backendCard of backendData.cards) {
			const cardData: AppCardData = {
				globalId: generateUuid(),
				questionContent: backendCard.questionContent,
				answerContent: backendCard.answerContent,
				discoveryPriority: 0,
				createdAt: now,
				updatedAt: now,
			}

			const cardHandle = await collection.createCard()
			await cardHandle.save(cardData)
		}

		return collectionId
	}
}
