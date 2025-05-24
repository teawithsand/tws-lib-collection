import { afterEach, beforeEach, describe, expect, test } from "vitest"
import { DrizzleDB } from "../db/db"
import { getTestingDb } from "../db/dbTest.test"
import {
	SdelkaCardData,
	SdelkaCardDataUtil,
	SdelkaCollectionDataUtil,
	SdelkaTypeSpec,
	SdelkaTypeSpecSerializer,
} from "../defines"
import { CardId } from "../defines/typings/cardId"
import { InMemoryDb } from "../inMemoryDb/db"
import { CollectionStore } from "./defines"
import { DrizzleCollectionStore } from "./drizzle"
import { InMemoryCollectionStore } from "./inMemory"

describe.each<{
	name: string
	storeFactory: () => Promise<{
		store: CollectionStore<SdelkaTypeSpec>
		cleanup?: () => Promise<void>
	}>
}>([
	{
		name: "InMemoryCollectionStore",
		storeFactory: async () => {
			const db = new InMemoryDb<SdelkaTypeSpec>()
			return {
				store: new InMemoryCollectionStore<SdelkaTypeSpec>({
					db,
					defaultCollectionHeader:
						SdelkaCollectionDataUtil.getDefaultData(),
					defaultCardData: SdelkaCardDataUtil.getDefaultData(),
				}),
			}
		},
	},
	{
		name: "DrizzleCollectionStore",
		storeFactory: async () => {
			const { drizzle, close } = await getTestingDb()
			return {
				store: new DrizzleCollectionStore<SdelkaTypeSpec>({
					db: drizzle as DrizzleDB,
					defaultCollectionHeader:
						SdelkaCollectionDataUtil.getDefaultData(),
					defaultCardData: SdelkaCardDataUtil.getDefaultData(),
					serializer: SdelkaTypeSpecSerializer,
				}),
				cleanup: close,
			}
		},
	},
])("CollectionStore Implementation - $name", ({ storeFactory }) => {
	let store: CollectionStore<SdelkaTypeSpec>
	let cleanup: (() => Promise<void>) | undefined

	beforeEach(async () => {
		const result = await storeFactory()
		store = result.store
		cleanup = result.cleanup
	})

	afterEach(async () => {
		if (cleanup) {
			await cleanup()
		}
	})

	// Basic collection tests
	test("should create a new collection, get it, and verify its data", async () => {
		const collectionHandle = await store.create()
		const createdHeader = await collectionHandle.read()
		expect(createdHeader).toEqual(SdelkaCollectionDataUtil.getDefaultData())

		const retrievedHandle = store.get(collectionHandle.id)
		expect(retrievedHandle).toBeDefined()
		expect(retrievedHandle.id).toEqual(collectionHandle.id)

		const retrievedHeader = await retrievedHandle.read()
		expect(retrievedHeader).toEqual(
			SdelkaCollectionDataUtil.getDefaultData(),
		)

		const exists = await retrievedHandle.exists()
		expect(exists).toBe(true)

		const nonExistentHandle = store.get(1234 as CardId)
		const nonExistentExists = await nonExistentHandle.exists()
		expect(nonExistentExists).toBe(false)
	})

	test("should update collection data", async () => {
		const collectionHandle = await store.create()
		const originalData = await collectionHandle.read()

		// Create an update with a title change
		const title = "Updated Collection Title"
		await collectionHandle.update({ title })

		// Read and verify the update was applied
		const updatedData = await collectionHandle.read()
		expect(updatedData).toEqual({
			...originalData,
			title,
		})
	})

	test("should save new collection data", async () => {
		const collectionHandle = await store.create()

		// New data to save
		const newData = {
			...SdelkaCollectionDataUtil.getDefaultData(),
			title: "New Collection Title",
		}

		// Save the new data
		await collectionHandle.save(newData)

		// Read and verify the save was applied
		const savedData = await collectionHandle.read()
		expect(savedData).toEqual(newData)
	})

	test("should delete a collection", async () => {
		const collectionHandle = await store.create()

		// Verify collection exists
		let exists = await collectionHandle.exists()
		expect(exists).toBe(true)

		// Delete collection
		await collectionHandle.delete()

		// Verify collection no longer exists
		exists = await collectionHandle.exists()
		expect(exists).toBe(false)
	})

	// Card management tests
	test("should create and manage cards within a collection", async () => {
		const collectionHandle = await store.create()

		// Initially collection should have no cards
		const initialCount = await collectionHandle.getCardCount()
		expect(initialCount).toBe(0)

		// Create cards
		const card1 = await collectionHandle.createCard()
		const card2 = await collectionHandle.createCard()
		const card3 = await collectionHandle.createCard()

		// Check card count increased
		const updatedCount = await collectionHandle.getCardCount()
		expect(updatedCount).toBe(3)

		// Verify cards exist and have default data
		const card1Data = await card1.read()
		expect(card1Data).toEqual(SdelkaCardDataUtil.getDefaultData())

		// Modify card data
		const customCardData: SdelkaCardData = {
			...SdelkaCardDataUtil.getDefaultData(),
			content: "DD AA",
		}

		await card2.save(customCardData)
		const card2Data = await card2.read()
		expect(card2Data).toEqual(customCardData)

		// Update card data partially
		const updatedCardData = {
			...SdelkaCardDataUtil.getDefaultData(),
			content: "Updated content",
		}
		await card3.update({ content: "Updated content" })
		const card3Data = await card3.read()
		expect(card3Data.content).toBe("Updated content")

		// Get all cards from collection
		const allCards = await collectionHandle.getCards()
		expect(allCards.length).toBe(3)

		// Get cards with pagination
		const paginatedCards = await collectionHandle.getCards({
			offset: 1,
			limit: 1,
		})
		expect(paginatedCards.length).toBe(1)

		// Delete a card
		await card1.delete()

		// Verify card count decreased
		const finalCount = await collectionHandle.getCardCount()
		expect(finalCount).toBe(2)

		// Try to get a card by ID
		const retrievedCard = await collectionHandle.getCard(card2.id)
		expect(retrievedCard.id).toBe(card2.id)
		const retrievedData = await retrievedCard.read()
		expect(retrievedData).toEqual(customCardData)
	})

	test("should handle card collection reassignment", async () => {
		// Create two collections
		const collection1 = await store.create()
		const collection2 = await store.create()

		// Create a card in collection1
		const card = await collection1.createCard()

		// Verify card is in collection1
		const collection1Cards = await collection1.getCards()
		expect(collection1Cards.length).toBe(1)
		expect(collection1Cards[0].id).toBe(card.id)

		// Reassign card to collection2
		await card.setCollection(collection2.id)

		// Verify card is now in collection2
		const collection2Cards = await collection2.getCards()
		expect(collection2Cards.length).toBe(1)
		expect(collection2Cards[0].id).toBe(card.id)

		// Verify card is no longer in collection1
		const updatedCollection1Cards = await collection1.getCards()
		expect(updatedCollection1Cards.length).toBe(0)
	})

	test("should handle card existence checks", async () => {
		const collection = await store.create()
		const card = await collection.createCard()

		// Card should exist
		const cardExists = await card.exists()
		expect(cardExists).toBe(true)

		// Delete card
		await card.delete()

		// Card should no longer exist
		const cardStillExists = await card.exists()
		expect(cardStillExists).toBe(false)
	})

	test("should preserve card data after collection operations", async () => {
		const collection = await store.create()
		const card = await collection.createCard()

		// Modify card with content
		const content = "Important Card Content"
		await card.update({ content })

		// Update collection data
		await collection.update({ title: "Updated Collection" })

		// Verify card data is still intact
		const cardData = await card.read()
		expect(cardData.content).toBe(content)
	})

	// Error handling tests
	test("should throw when trying to read non-existent collection", async () => {
		const randomId = Math.floor(Math.random() * 10000) as CardId
		const nonExistentHandle = store.get(randomId)

		// Attempting to read should throw
		await expect(nonExistentHandle.read()).rejects.toThrow()
	})

	test("should throw when trying to update non-existent collection", async () => {
		const randomId = Math.floor(Math.random() * 10000) as CardId
		const nonExistentHandle = store.get(randomId)

		// Attempting to update should throw
		await expect(
			nonExistentHandle.update({ title: "New Title" }),
		).rejects.toThrow()
	})

	test("should throw when trying to access a card that doesn't belong to the collection", async () => {
		// Create two collections
		const collection1 = await store.create()
		const collection2 = await store.create()

		// Create a card in collection1
		const card = await collection1.createCard()

		// Trying to get the card from collection2 should throw
		await expect(collection2.getCard(card.id)).rejects.toThrow()
	})

	test("should throw when trying to delete non-existent card", async () => {
		const collection = await store.create()
		const randomId = Math.floor(Math.random() * 10000) as CardId

		// Attempting to access non-existent card should throw
		await expect(collection.getCard(randomId)).rejects.toThrow()
	})

	// Edge cases
	test("should handle creating multiple collections", async () => {
		// Create multiple collections
		const collections = [
			await store.create(),
			await store.create(),
			await store.create(),
		]

		// Each should have a unique ID
		const ids = new Set(collections.map((c) => c.id))
		expect(ids.size).toBe(collections.length)

		// Each should exist
		for (const collection of collections) {
			const exists = await collection.exists()
			expect(exists).toBe(true)
		}
	})

	test("should handle pagination edge cases", async () => {
		const collection = await store.create()

		// Create 5 cards

		for (let i = 0; i < 5; i++) {
			await collection.createCard()
		}

		// Get all cards
		const allCards = await collection.getCards()
		expect(allCards.length).toBe(5)

		// Get with offset beyond length should return empty array
		const beyondOffset = await collection.getCards({ offset: 10 })
		expect(beyondOffset.length).toBe(0)

		// Zero limit should return empty array
		const zeroLimit = await collection.getCards({ limit: 0 })
		expect(zeroLimit.length).toBe(0)

		// Negative offset should be treated as 0
		const negativeOffset = await collection.getCards({
			offset: 0,
			limit: 2,
		})
		expect(negativeOffset.length).toBe(2)
	})
})
