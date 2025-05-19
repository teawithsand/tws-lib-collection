import { afterAll, beforeEach, describe, expect, test } from "vitest"
import { DrizzleDB } from "../db/db"
import { getTestingDb } from "../db/dbTest.test"
import { CardId } from "../defines/typings/cardId"
import {
	DrizzleCardHandle,
	DrizzleCollectionHandle,
	DrizzleCollectionStore,
} from "./drizzle"

// Mock TypeSpec
interface MockTypeSpec {
	collectionData: { title: string }
	cardData: { content: string }
	cardState: {}
	cardEvent: {}
}

// Mock serializer
const mockSerializer = {
	deserializeCardData: (data: unknown) => data as MockTypeSpec["cardData"],
	deserializeCollectionHeader: (data: unknown) =>
		data as MockTypeSpec["collectionData"],
	serializeCardData: (data: MockTypeSpec["cardData"]) => data,
	serializeCollectionHeader: (data: MockTypeSpec["collectionData"]) => data,
	serializeEvent: (event: MockTypeSpec["cardEvent"]) => event,
	deserializeEvent: (data: unknown) => data as MockTypeSpec["cardEvent"],
	serializeState: (state: MockTypeSpec["cardState"]) => state,
	deserializeState: (data: unknown) => data as MockTypeSpec["cardState"],
}

describe("DrizzleCollectionStore", () => {
	let db: DrizzleDB
	let close: () => Promise<void>
	let store: DrizzleCollectionStore<MockTypeSpec>

	beforeEach(async () => {
		const res = await getTestingDb()
		db = res.drizzle
		close = res.close
		store = new DrizzleCollectionStore<MockTypeSpec>({
			db: db as unknown as DrizzleDB,
			serializer: mockSerializer,
			defaultCollectionHeader: { title: "default" },
			defaultCardData: { content: "default content" },
		})
	})

	afterAll(async () => {
		await close()
	})

	test("create collection", async () => {
		const collection = await store.create()
		expect(collection).toBeInstanceOf(DrizzleCollectionHandle)
		const header = await collection.read()
		expect(header.title).toBe("default")
	})

	test("get collection", () => {
		const id = 1 as CardId
		const collection = store.get(id)
		expect(collection).toBeInstanceOf(DrizzleCollectionHandle)
		expect(collection.id).toBe(id)
	})

	test("create collection and read header", async () => {
		const collection = await store.create()
		const header = await collection.read()
		expect(header).toEqual({ title: "default" })
		await collection.save({ title: "My Collection" })
		const updatedHeader = await collection.read()
		expect(updatedHeader.title).toBe("My Collection")
	})

	test("update collection header partially", async () => {
		const collection = await store.create()
		await collection.save({ title: "Initial" })
		await collection.update({ title: "Updated" })
		const header = await collection.read()
		expect(header.title).toBe("Updated")
	})

	test("exists returns true for existing collection", async () => {
		const collection = await store.create()
		const exists = await collection.exists()
		expect(exists).toBe(true)
	})

	test("exists returns false for non-existing collection", async () => {
		const collection = store.get(9999 as CardId)
		const exists = await collection.exists()
		expect(exists).toBe(false)
	})

	test("delete collection", async () => {
		const collection = await store.create()
		const id = collection.id
		await collection.delete()
		const exists = await collection.exists()
		expect(exists).toBe(false)
		const newCollection = store.get(id)
		const newExists = await newCollection.exists()
		expect(newExists).toBe(false)
	})

	test("create card in collection and read card data", async () => {
		const collection = await store.create()
		const card = await collection.createCard()
		const data = await card.read()
		expect(data).toEqual({ content: "default content" })
		await card.save({ content: "Hello" })
		const updatedData = await card.read()
		expect(updatedData.content).toBe("Hello")
	})

	test("update card data partially", async () => {
		const collection = await store.create()
		const card = await collection.createCard()
		await card.save({ content: "Initial" })
		await card.update({ content: "Updated" })
		const data = await card.read()
		expect(data.content).toBe("Updated")
	})

	test("card exists returns true and false", async () => {
		const collection = await store.create()
		const card = await collection.createCard()
		const exists = await card.exists()
		expect(exists).toBe(true)

		await card.delete()
		const existsAfterDelete = await card.exists()
		expect(existsAfterDelete).toBe(false)
	})

	test("delete card", async () => {
		const collection = await store.create()
		const card = await collection.createCard()
		const id = card.id
		await card.delete()
		const newCard = collection.getCard(id).catch(() => null)
		expect(await newCard).toBeNull()
	})

	test("getCardCount returns correct count", async () => {
		const collection = await store.create()
		await collection.createCard()
		await collection.createCard()
		const count = await collection.getCardCount()
		expect(count).toBe(2)
	})

	test("getCards returns correct cards with pagination", async () => {
		const collection = await store.create()
		const card1 = await collection.createCard()
		const card2 = await collection.createCard()
		const card3 = await collection.createCard()
		const cardsAll = await collection.getCards()
		expect(cardsAll.length).toBe(3)
		const cardsOffsetLimit = await collection.getCards({
			offset: 1,
			limit: 1,
		})
		expect(cardsOffsetLimit.length).toBe(1)
		expect(cardsOffsetLimit[0].id).toBe(card2.id)
	})

	test("getCard returns card if belongs to collection", async () => {
		const collection = await store.create()
		const card = await collection.createCard()
		const fetchedCard = await collection.getCard(card.id)
		expect(fetchedCard.id).toBe(card.id)
	})

	test("getCard throws if card does not belong to collection", async () => {
		const collection1 = await store.create()
		const collection2 = await store.create()
		const card = await collection1.createCard()
		await card.setCollection(collection2.id)
		await expect(collection1.getCard(card.id)).rejects.toThrow(
			"Card does not belong to this collection",
		)
	})

	test("getCard throws if card does not exist", async () => {
		const collection = await store.create()
		await expect(collection.getCard(9999 as CardId)).rejects.toThrow(
			"Card not found",
		)
	})

	test("setCollection changes card's collection", async () => {
		const collection1 = await store.create()
		const collection2 = await store.create()
		const card = await collection1.createCard()
		await card.setCollection(collection2.id)
		const cardInNewCollection = await collection2.getCard(card.id)
		expect(cardInNewCollection.id).toBe(card.id)
	})

	test("update throws if collection not found", async () => {
		const collection = store.get(9999 as CardId)
		await expect(collection.update({ title: "test" })).rejects.toThrow(
			"Collection not found",
		)
	})

	test("update throws if card not found", async () => {
		const collection = await store.create()
		const card = collection.getCard(9999 as CardId).catch(() => null)
		await expect(card).resolves.toBeNull()
	})

	test("save creates collection if it does not exist", async () => {
		const collection = store.get(999999 as CardId) // replaced string id with numeric CardId
		await collection.save({ title: "Created on save" })
		const exists = await collection.exists()
		expect(exists).toBe(true)
		const header = await collection.read()
		expect(header.title).toBe("Created on save")
	})

	test("saving card fails if collection it points to is deleted", async () => {
		const collection = await store.create()
		const card = await collection.createCard()
		await collection.delete()
		await expect(card.save({ content: "test" })).rejects.toThrow()
	})

	test("saving card succeeds if card was deleted but collection still exists", async () => {
		const collection = await store.create()
		const card = await collection.createCard()
		const cardId = card.id
		await card.delete()
		await expect(
			card.save({ content: "new content" }),
		).resolves.toBeUndefined()
		const recreatedCard = await collection.getCard(cardId)
		const data = await recreatedCard.read()
		expect(data.content).toBe("new content")
	})

	test("collection.read throws if collection does not exist", async () => {
		const collection = store.get(999998 as CardId) // replaced string id with numeric CardId
		await expect(async () => await collection.read()).rejects.toThrow(
			"Collection not found",
		)
	})

	test("two handles to the same card calling setCollection and save with different collection IDs", async () => {
		const collection1 = await store.create()
		const collection2 = await store.create()
		const card = await collection1.createCard()

		const cardHandle1 = await collection1.getCard(card.id)
		const cardHandle2 = await collection1.getCard(card.id)

		expect(cardHandle1).toBeDefined()
		expect(cardHandle2).toBeDefined()

		await cardHandle1.setCollection(collection2.id)
		await cardHandle1.save({ content: "from handle1" })

		await cardHandle2.setCollection(collection1.id)
		await cardHandle2.save({ content: "from handle2" })

		const cardInCollection1 = await collection1.getCard(card.id)
		const data1 = await cardInCollection1.read()
		expect(data1.content).toBe("from handle2")

		await expect(collection2.getCard(card.id)).rejects.toThrow(
			"Card does not belong to this collection",
		)

		const cardHandle3 = await collection1.getCard(card.id)
		const cardHandle4 = await collection1.getCard(card.id)
		await cardHandle3
			.setCollection(collection2.id)
			.then(() => cardHandle3.save({ content: "handle3" }))
		await cardHandle4
			.setCollection(collection1.id)
			.then(() => cardHandle4.save({ content: "handle4" }))
		const inCollection1 = await collection1
			.getCard(card.id)
			.then((c) => c.read())
			.catch(() => null)
		const inCollection2 = await collection2
			.getCard(card.id)
			.then((c) => c.read())
			.catch(() => null)

		expect(inCollection1 === null || inCollection2 === null).toBe(true)
		expect(inCollection1 !== null || inCollection2 !== null).toBe(true)

		const finalContent = inCollection1?.content ?? inCollection2?.content
		expect(["handle3", "handle4"]).toContain(finalContent)
	})

	test("update throws if card was deleted", async () => {
		const collection = await store.create()
		const card = await collection.createCard()
		await card.delete()
		await expect(card.update({ content: "test" })).rejects.toThrow(
			"Card not found",
		)
	})

	test("read throws if card was deleted", async () => {
		const collection = await store.create()
		const card = await collection.createCard()
		await card.delete()
		await expect(card.read()).rejects.toThrow("Card not found")
	})

	test("setCollection throws if card was deleted", async () => {
		const collection1 = await store.create()
		const collection2 = await store.create()
		const card = await collection1.createCard()
		await card.delete()
		await expect(card.setCollection(collection2.id)).rejects.toThrow(
			"Card not found",
		)
	})

	test("after setCollection and deleting card, save saves card to proper collection", async () => {
		const collection1 = await store.create()
		const collection2 = await store.create()
		const card = await collection1.createCard()

		await card.setCollection(collection2.id)
		await card.delete()

		await card.save({ content: "saved after delete" })

		await expect(collection1.getCard(card.id)).rejects.toThrow(
			"Card does not belong to this collection",
		)

		const cardInCollection2 = await collection2.getCard(card.id)
		const data = await cardInCollection2.read()
		expect(data.content).toBe("saved after delete")
	})

	test("card appears only in new collection's getCards after collection change", async () => {
		const collection1 = await store.create()
		const collection2 = await store.create()
		const card = await collection1.createCard()

		let cardsInCollection1 = await collection1.getCards()
		expect(cardsInCollection1.map((c) => c.id)).toContain(card.id)

		let cardsInCollection2 = await collection2.getCards()
		expect(cardsInCollection2.map((c) => c.id)).not.toContain(card.id)

		await card.setCollection(collection2.id)

		cardsInCollection2 = await collection2.getCards()
		expect(cardsInCollection2.map((c) => c.id)).toContain(card.id)

		cardsInCollection1 = await collection1.getCards()
		expect(cardsInCollection1.map((c) => c.id)).not.toContain(card.id)
	})

	test("getCardCount returns count only for cards belonging to the collection", async () => {
		const collection1 = await store.create()
		const collection2 = await store.create()

		await collection1.createCard()
		await collection1.createCard()
		const cardInOtherCollection = await collection2.createCard()

		await cardInOtherCollection.setCollection(collection1.id)
		await cardInOtherCollection.setCollection(collection2.id)

		const count1 = await collection1.getCardCount()
		const count2 = await collection2.getCardCount()

		expect(count1).toBe(2)
		expect(count2).toBe(1)
	})

	test("getCardCount is congruent with length of getCards with no parameters", async () => {
		const collection = await store.create()
		await collection.createCard()
		await collection.createCard()
		await collection.createCard()

		const count = await collection.getCardCount()
		const cards = await collection.getCards()

		expect(count).toBe(cards.length)
	})
})
