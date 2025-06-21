import { BackendCollectionData } from "@/domain/backend/backendCollectionData"
import {
	AppCardDataExtractor,
	AppCardDataVersionedType,
	AppCollectionDataExtractor,
	AppCollectionDataVersionedType,
	AppMintayTypeSpecParams,
	defaultCardDataFactory,
	defaultCollectionDataFactory,
} from "@/mintay"
import { InMemoryMintay, LockingMintay } from "@teawithsand/mintay-core"
import { describe, expect, test } from "vitest"
import { CollectionImportExport } from "./collectionImportExport"

/**
 * Helper function to create test MintayParams for InMemoryMintay
 */
const createTestMintayParams = () => ({
	collectionDataExtractor: new AppCollectionDataExtractor(),
	cardDataExtractor: new AppCardDataExtractor(),
	collectionDataSerializer: AppCollectionDataVersionedType,
	cardDataSerializer: AppCardDataVersionedType,
	defaultCardDataFactory,
	defaultCollectionDataFactory,
})

/**
 * Helper function to create a test mintay instance
 */
const createTestMintay = () => {
	return LockingMintay.wrapSafe<AppMintayTypeSpecParams>(
		new InMemoryMintay({ params: createTestMintayParams() }),
	)
}

/**
 * Sample backend collection data for testing
 */
const createSampleBackendData = (): BackendCollectionData => ({
	collection: {
		globalId: "backend-collection-1",
		title: "Test Collection",
		description: "A collection for testing purposes",
	},
	cards: [
		{
			globalId: "backend-card-1",
			questionContent: "What is the capital of France?",
			answerContent: "Paris",
		},
		{
			globalId: "backend-card-2",
			questionContent: "Define photosynthesis",
			answerContent:
				"The process by which plants convert light energy into chemical energy",
		},
		{
			globalId: "backend-card-3",
			questionContent: "How do you say 'hello' in Spanish?",
			answerContent: "Hola",
		},
	],
})

describe("CollectionImportExport", () => {
	test("should import collection from backend data with regenerated IDs", async () => {
		// Arrange
		const mintay = createTestMintay()
		const importExport = new CollectionImportExport({
			collectionStore: mintay.collectionStore,
		})
		const backendData = createSampleBackendData()

		// Act
		const importedCollectionId =
			await importExport.importCollection(backendData)

		// Assert
		expect(importedCollectionId).toBeDefined()
		expect(typeof importedCollectionId).toBe("string")

		// Verify collection was created
		const collection = mintay.collectionStore.get(importedCollectionId)
		const collectionData = await collection.mustRead()

		expect(collectionData.title).toBe(backendData.collection.title)
		expect(collectionData.description).toBe(
			backendData.collection.description,
		)
		expect(collectionData.globalId).not.toBe(
			backendData.collection.globalId,
		) // Should be regenerated
		expect(collectionData.createdAt).toBeGreaterThan(0)
		expect(collectionData.updatedAt).toBeGreaterThan(0)

		// Verify cards were imported
		const cardHandles = await collection.getCards()
		expect(cardHandles).toHaveLength(backendData.cards.length)

		for (let i = 0; i < cardHandles.length; i++) {
			const cardData = await cardHandles[i]!.mustRead()
			const originalCard = backendData.cards[i]!

			expect(cardData.questionContent).toBe(originalCard.questionContent)
			expect(cardData.answerContent).toBe(originalCard.answerContent)
			expect(cardData.globalId).not.toBe(originalCard.globalId) // Should be regenerated
			expect(cardData.discoveryPriority).toBe(0) // Default value
			expect(cardData.createdAt).toBeGreaterThan(0)
			expect(cardData.updatedAt).toBeGreaterThan(0)
		}
	})

	test("should export collection to backend data format", async () => {
		// Arrange
		const mintay = createTestMintay()
		const importExport = new CollectionImportExport({
			collectionStore: mintay.collectionStore,
		})

		// First import a collection
		const originalBackendData = createSampleBackendData()
		const collectionId =
			await importExport.importCollection(originalBackendData)

		// Act
		const exportedData = await importExport.exportCollection(collectionId)

		// Assert
		expect(exportedData.collection.title).toBe(
			originalBackendData.collection.title,
		)
		expect(exportedData.collection.description).toBe(
			originalBackendData.collection.description,
		)
		expect(exportedData.collection.globalId).not.toBe(
			originalBackendData.collection.globalId,
		) // Should be different due to regeneration

		expect(exportedData.cards).toHaveLength(
			originalBackendData.cards.length,
		)

		// Verify card content matches (order might be different due to implementation)
		for (const originalCard of originalBackendData.cards) {
			const matchingExportedCard = exportedData.cards.find(
				(card) => card.questionContent === originalCard.questionContent,
			)
			expect(matchingExportedCard).toBeDefined()
			expect(matchingExportedCard!.answerContent).toBe(
				originalCard.answerContent,
			)
			expect(matchingExportedCard!.globalId).not.toBe(
				originalCard.globalId,
			) // Should be different due to regeneration
		}
	})

	test("should handle collection with no description", async () => {
		// Arrange
		const mintay = createTestMintay()
		const importExport = new CollectionImportExport({
			collectionStore: mintay.collectionStore,
		})
		const backendData: BackendCollectionData = {
			collection: {
				globalId: "backend-collection-no-desc",
				title: "No Description Collection",
				// description is undefined
			},
			cards: [
				{
					globalId: "backend-card-simple",
					questionContent: "Simple question",
					answerContent: "Simple answer",
				},
			],
		}

		// Act
		const collectionId = await importExport.importCollection(backendData)

		// Assert
		const collection = mintay.collectionStore.get(collectionId)
		const collectionData = await collection.mustRead()
		expect(collectionData.description).toBe("") // Should default to empty string
	})

	test("should handle collection with empty cards array", async () => {
		// Arrange
		const mintay = createTestMintay()
		const importExport = new CollectionImportExport({
			collectionStore: mintay.collectionStore,
		})
		const backendData: BackendCollectionData = {
			collection: {
				globalId: "backend-collection-empty",
				title: "Empty Collection",
				description: "Collection with no cards",
			},
			cards: [],
		}

		// Act
		const collectionId = await importExport.importCollection(backendData)

		// Assert
		const collection = mintay.collectionStore.get(collectionId)
		const collectionData = await collection.mustRead()
		expect(collectionData.title).toBe(backendData.collection.title)

		const cardHandles = await collection.getCards()
		expect(cardHandles).toHaveLength(0)

		// Export should also work with empty collection
		const exportedData = await importExport.exportCollection(collectionId)
		expect(exportedData.cards).toHaveLength(0)
	})

	test("should handle round-trip import/export correctly", async () => {
		// Arrange
		const mintay = createTestMintay()
		const importExport = new CollectionImportExport({
			collectionStore: mintay.collectionStore,
		})
		const originalData = createSampleBackendData()

		// Act - Import then export
		const importedId = await importExport.importCollection(originalData)
		const exportedData = await importExport.exportCollection(importedId)

		// Import the exported data again
		const secondImportId = await importExport.importCollection(exportedData)
		const secondExportedData =
			await importExport.exportCollection(secondImportId)

		// Assert - Content should remain consistent through round-trips
		expect(secondExportedData.collection.title).toBe(
			originalData.collection.title,
		)
		expect(secondExportedData.collection.description).toBe(
			originalData.collection.description,
		)
		expect(secondExportedData.cards).toHaveLength(originalData.cards.length)

		// Verify all card content is preserved
		for (const originalCard of originalData.cards) {
			const matchingCard = secondExportedData.cards.find(
				(card) => card.questionContent === originalCard.questionContent,
			)
			expect(matchingCard).toBeDefined()
			expect(matchingCard!.answerContent).toBe(originalCard.answerContent)
		}

		// But IDs should be different at each step
		expect(exportedData.collection.globalId).not.toBe(
			originalData.collection.globalId,
		)
		expect(secondExportedData.collection.globalId).not.toBe(
			exportedData.collection.globalId,
		)
		expect(secondExportedData.collection.globalId).not.toBe(
			originalData.collection.globalId,
		)
	})
})
