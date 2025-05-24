import { afterEach, beforeEach, describe, expect, test } from "vitest"
import { DrizzleDB } from "../db/db"
import { getTestingDb } from "../db/dbTest.test"
import {
	SdelkaCardDataUtil,
	SdelkaCollectionDataUtil,
	SdelkaTypeSpec,
	SdelkaTypeSpecSerializer,
} from "../defines"
import { CardId } from "../defines/typings/cardId"
import { InMemoryDb } from "../inMemoryDb/db"
import { CollectionStore } from "./defines" // Assuming CollectionStore is in ./defines
import { CardStore } from "./defines/card"
import { DrizzleCardStore } from "./drizzle/cardStore"
import { DrizzleCollectionStore } from "./drizzle/collectionStore"
import { InMemoryCardStore } from "./inMemory/cardStore"
import { InMemoryCollectionStore } from "./inMemory/collectionStore"

describe.each<{
	name: string
	storeFactory: () => Promise<{
		cardStore: CardStore<SdelkaTypeSpec>
		collectionStore: CollectionStore<SdelkaTypeSpec> // To create test data
		cleanup?: () => Promise<void>
	}>
}>([
	{
		name: "InMemoryCardStore",
		storeFactory: async () => {
			const db = new InMemoryDb<SdelkaTypeSpec>()
			const collectionStore = new InMemoryCollectionStore<SdelkaTypeSpec>(
				{
					db,
					defaultCollectionHeader:
						SdelkaCollectionDataUtil.getDefaultData(),
					defaultCardData: SdelkaCardDataUtil.getDefaultData(),
				},
			)
			const cardStore = new InMemoryCardStore<SdelkaTypeSpec>({ db })
			return { cardStore, collectionStore }
		},
	},
	{
		name: "DrizzleCardStore",
		storeFactory: async () => {
			const { drizzle, close } = await getTestingDb()
			const collectionStore = new DrizzleCollectionStore<SdelkaTypeSpec>({
				db: drizzle as DrizzleDB,
				defaultCollectionHeader:
					SdelkaCollectionDataUtil.getDefaultData(),
				defaultCardData: SdelkaCardDataUtil.getDefaultData(),
				serializer: SdelkaTypeSpecSerializer,
			})
			const cardStore = new DrizzleCardStore<SdelkaTypeSpec>({
				db: drizzle as DrizzleDB,
				serializer: SdelkaTypeSpecSerializer,
			})
			return { cardStore, collectionStore, cleanup: close }
		},
	},
])("CardStore Implementation - $name", ({ storeFactory }) => {
	let cardStore: CardStore<SdelkaTypeSpec>
	let collectionStore: CollectionStore<SdelkaTypeSpec>
	let cleanup: (() => Promise<void>) | undefined

	beforeEach(async () => {
		const result = await storeFactory()
		cardStore = result.cardStore
		collectionStore = result.collectionStore
		cleanup = result.cleanup
	})

	afterEach(async () => {
		if (cleanup) {
			await cleanup()
		}
	})

	test("should get an existing card by ID and read its data", async () => {
		const collectionHandle = await collectionStore.create()
		const cardHandle = await collectionHandle.createCard()
		const cardId = cardHandle.id

		const retrievedCardHandle = await cardStore.getCardById(cardId)
		expect(retrievedCardHandle).not.toBeNull()
		expect(retrievedCardHandle!.id).toEqual(cardId)

		const cardData = await retrievedCardHandle!.read()
		expect(cardData).toEqual(SdelkaCardDataUtil.getDefaultData())
	})

	test("should return null when getting a non-existent card by ID", async () => {
		const nonExistentCardId = 99999 as CardId // A sufficiently random ID
		const retrievedCardHandle =
			await cardStore.getCardById(nonExistentCardId)
		expect(retrievedCardHandle).toBeNull()
	})

	test("should allow updating and reading data through the retrieved card handle", async () => {
		const collectionHandle = await collectionStore.create()
		const originalCardHandle = await collectionHandle.createCard()
		const cardId = originalCardHandle.id

		const retrievedCardHandle = await cardStore.getCardById(cardId)
		expect(retrievedCardHandle).not.toBeNull()

		const updatedContent = "Updated card content via CardStore handle"
		await retrievedCardHandle!.update({ content: updatedContent })

		const cardDataFromRetrievedHandle = await retrievedCardHandle!.read()
		expect(cardDataFromRetrievedHandle.content).toEqual(updatedContent)

		// Verify that the update is reflected if read through the original handle as well
		const cardDataFromOriginalHandle = await originalCardHandle.read()
		expect(cardDataFromOriginalHandle.content).toEqual(updatedContent)
	})
})
