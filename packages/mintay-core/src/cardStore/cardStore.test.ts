import { afterEach, beforeEach, describe, expect, test } from "vitest"
import { MintayDrizzleDB } from "../db/db"
import { getTestingDb } from "../db/dbTest.test"
import {
	MintayCardDataUtil,
	MintayCollectionDataUtil,
	MintayTypeSpec,
	MintayTypeSpecSerializer,
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
		cardStore: CardStore<MintayTypeSpec>
		collectionStore: CollectionStore<MintayTypeSpec> // To create test data
		cleanup?: () => Promise<void>
	}>
}>([
	{
		name: "InMemoryCardStore",
		storeFactory: async () => {
			const db = new InMemoryDb<MintayTypeSpec>()
			const collectionStore = new InMemoryCollectionStore<MintayTypeSpec>(
				{
					db,
					defaultCollectionHeader:
						MintayCollectionDataUtil.getDefaultData(),
					defaultCardData: MintayCardDataUtil.getDefaultData(),
				},
			)
			const cardStore = new InMemoryCardStore<MintayTypeSpec>({ db })
			return { cardStore, collectionStore }
		},
	},
	{
		name: "DrizzleCardStore",
		storeFactory: async () => {
			const { drizzle, close } = await getTestingDb()
			const collectionStore = new DrizzleCollectionStore<MintayTypeSpec>({
				db: drizzle as MintayDrizzleDB,
				defaultCollectionHeader:
					MintayCollectionDataUtil.getDefaultData(),
				defaultCardData: MintayCardDataUtil.getDefaultData(),
				serializer: MintayTypeSpecSerializer,
			})
			const cardStore = new DrizzleCardStore<MintayTypeSpec>({
				db: drizzle as MintayDrizzleDB,
				serializer: MintayTypeSpecSerializer,
			})
			return { cardStore, collectionStore, cleanup: close }
		},
	},
])("CardStore Implementation - $name", ({ storeFactory }) => {
	let cardStore: CardStore<MintayTypeSpec>
	let collectionStore: CollectionStore<MintayTypeSpec>
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
		expect(cardData).toEqual(MintayCardDataUtil.getDefaultData())
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
