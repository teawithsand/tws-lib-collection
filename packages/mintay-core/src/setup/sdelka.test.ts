import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest"
import { DrizzleDB } from "../db/db"
import { getTestingDb } from "../db/dbTest.test"
import {
	SdelkaAnswer,
	SdelkaCardDataUtil,
	SdelkaCardEventType,
	SdelkaCollectionDataUtil,
} from "../defines/card"
import { CardId } from "../defines/typings/cardId"
import { FsrsParameters } from "../fsrs"
import { Sdelka } from "./defines"
import { DrizzleSdelka } from "./drizzle"
import { InMemorySdelka } from "./inMemory"

const testParameters: FsrsParameters = {
	requestRetention: 0.9,
	maximumInterval: 36500,
	w: [
		0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18,
		0.05, 0.34, 1.26, 0.29, 2.61,
	],
	enableFuzz: false,
	enableShortTerm: true,
}

describe.each<{
	name: string
	getSdelka: () => Promise<{ sdelka: Sdelka; cleanup?: () => Promise<void> }>
}>([
	{
		name: "InMemorySdelka",
		getSdelka: async () => ({ sdelka: new InMemorySdelka() }),
	},
	{
		name: "DrizzleSdelka",
		getSdelka: async () => {
			const { drizzle, close } = await getTestingDb()
			return {
				sdelka: new DrizzleSdelka({ db: drizzle as DrizzleDB }),
				cleanup: close,
			}
		},
	},
])("Sdelka E2E Tests - $name", ({ getSdelka }) => {
	let sdelka: Sdelka
	let cleanup: (() => Promise<void>) | undefined

	beforeAll(async () => {
		const res = await getSdelka()
		sdelka = res.sdelka
		cleanup = res.cleanup
	})

	afterAll(async () => {
		if (cleanup) {
			await cleanup()
		}
	})

	describe("CollectionStore", () => {
		test("should create a new collection and read its header", async () => {
			const collectionHandle = await sdelka.collectionStore.create()
			expect(collectionHandle).toBeDefined()
			const header = await collectionHandle.read()
			expect(header).toEqual(SdelkaCollectionDataUtil.getDefaultData())
		})

		test("should get an existing collection", async () => {
			const newCollection = await sdelka.collectionStore.create()
			const gottenCollection = sdelka.collectionStore.get(
				newCollection.id,
			)
			expect(gottenCollection).toBeDefined()
			expect(gottenCollection.id).toBe(newCollection.id)
			const header = await gottenCollection.read()
			expect(header).toEqual(SdelkaCollectionDataUtil.getDefaultData())
		})

		test("should save and read collection header", async () => {
			const collectionHandle = await sdelka.collectionStore.create()
			const newHeader = {
				...SdelkaCollectionDataUtil.getDefaultData(),
				title: "My Test Collection",
			}
			await collectionHandle.save(newHeader)
			const readHeader = await collectionHandle.read()
			expect(readHeader.title).toBe("My Test Collection")
		})

		test("should create a card in a collection and read its data", async () => {
			const collectionHandle = await sdelka.collectionStore.create()
			const cardHandle = await collectionHandle.createCard()
			expect(cardHandle).toBeDefined()
			const cardData = await cardHandle.read()
			expect(cardData).toEqual(SdelkaCardDataUtil.getDefaultData())
		})

		test("should save and read card data", async () => {
			const collectionHandle = await sdelka.collectionStore.create()
			const cardHandle = await collectionHandle.createCard()
			const newCardData = {
				...SdelkaCardDataUtil.getDefaultData(),
				content: "Test Card Content",
			}
			await cardHandle.save(newCardData)
			const readData = await cardHandle.read()
			expect(readData.content).toBe("Test Card Content")
		})

		test("should get cards from a collection", async () => {
			const collectionHandle = await sdelka.collectionStore.create()
			const card1 = await collectionHandle.createCard()
			const card2 = await collectionHandle.createCard()
			const cards = await collectionHandle.getCards()
			expect(cards.length).toBe(2)
			expect(cards.map((c) => c.id).sort()).toEqual(
				[card1.id, card2.id].sort(),
			)
		})

		test("should get card count from a collection", async () => {
			const collectionHandle = await sdelka.collectionStore.create()
			await collectionHandle.createCard()
			await collectionHandle.createCard()
			const count = await collectionHandle.getCardCount()
			expect(count).toBe(2)
		})

		test("should delete a card", async () => {
			const collectionHandle = await sdelka.collectionStore.create()
			const cardHandle = await collectionHandle.createCard()
			const cardId = cardHandle.id
			await cardHandle.delete()
			const exists = await cardHandle.exists()
			expect(exists).toBe(false)
			await expect(collectionHandle.getCard(cardId)).rejects.toThrow()
		})

		test("should delete a collection", async () => {
			const collectionHandle = await sdelka.collectionStore.create()
			const collectionId = collectionHandle.id
			await collectionHandle.delete()
			const exists = await collectionHandle.exists()
			expect(exists).toBe(false)
			const newHandle = sdelka.collectionStore.get(collectionId)
			const newExists = await newHandle.exists()
			expect(newExists).toBe(false)
		})
	})

	describe("EngineStore", () => {
		let collectionId: CardId
		let cardId: CardId

		beforeEach(async () => {
			const collection = await sdelka.collectionStore.create()
			collectionId = collection.id
			const card = await collection.createCard()
			cardId = card.id
		})

		test("should get an engine store", () => {
			const engineStore = sdelka.getEngineStore(
				collectionId,
				testParameters,
			)
			expect(engineStore).toBeDefined()
		})

		test("should push an event and update card state", async () => {
			const engineStore = sdelka.getEngineStore(
				collectionId,
				testParameters,
			)
			const initialCardData = await engineStore.getCardData(cardId)
			expect(initialCardData.fsrs.reps).toBe(0)

			await engineStore.push(cardId, {
				type: SdelkaCardEventType.ANSWER,
				answer: SdelkaAnswer.GOOD,
				timestamp: Date.now(),
			})

			const updatedCardData = await engineStore.getCardData(cardId)
			expect(updatedCardData.fsrs.reps).toBe(1)
		})

		test("should get top card", async () => {
			const engineStore = sdelka.getEngineStore(
				collectionId,
				testParameters,
			)
			const collection = sdelka.collectionStore.get(collectionId)
			const card2 = await collection.createCard()

			// Push events to make card2 have higher priority (earlier due date)
			// For a new card, any answer will schedule it.
			// We'll make cardId "Good" and card2 "Again" to ensure card2 is due sooner.
			const now = Date.now()
			await engineStore.push(cardId, {
				type: SdelkaCardEventType.ANSWER,
				answer: SdelkaAnswer.GOOD,
				timestamp: now,
			})
			await engineStore.push(card2.id, {
				type: SdelkaCardEventType.ANSWER,
				answer: SdelkaAnswer.AGAIN,
				timestamp: now,
			})

			const topCardId = await engineStore.getTopCard(undefined)
			expect(topCardId).toBe(card2.id)
		})

		test("getTopCard should return null if no cards are due or in the collection", async () => {
			const newCollection = await sdelka.collectionStore.create()
			const engineStore = sdelka.getEngineStore(
				newCollection.id,
				testParameters,
			)
			const topCardId = await engineStore.getTopCard(undefined)
			expect(topCardId).toBeNull()
		})

		test("should pop an event and revert card state", async () => {
			const engineStore = sdelka.getEngineStore(
				collectionId,
				testParameters,
			)

			await engineStore.push(cardId, {
				type: SdelkaCardEventType.ANSWER,
				answer: SdelkaAnswer.GOOD,
				timestamp: Date.now(),
			})
			const stateAfterPush = await engineStore.getCardData(cardId)
			expect(stateAfterPush.fsrs.reps).toBe(1)

			await engineStore.popCard(cardId)
			const stateAfterPop = await engineStore.getCardData(cardId)
			expect(stateAfterPop.fsrs.reps).toBe(0) // Assuming default state has 0 reps
		})

		test("pop on EngineStore should remove the last event within its collection and not affect other collections", async () => {
			// collectionId is collectionAId, cardId is cardA1Id from beforeEach
			const engineStoreA = sdelka.getEngineStore(
				collectionId,
				testParameters,
			)
			const collectionA = sdelka.collectionStore.get(collectionId) // collectionA is collectionId
			const cardA2 = await collectionA.createCard() // cardA2 in collectionA

			// Create a second collection, engine store, and card
			const collectionBHandle = await sdelka.collectionStore.create()
			const collectionBId = collectionBHandle.id
			const engineStoreB = sdelka.getEngineStore(
				collectionBId,
				testParameters,
			)
			const cardB1 = await collectionBHandle.createCard() // cardB1 in collectionB

			const now = Date.now()
			// Event for cardA1 (cardId) in collectionA
			await engineStoreA.push(cardId, {
				type: SdelkaCardEventType.ANSWER,
				answer: SdelkaAnswer.GOOD,
				timestamp: now,
			})
			// Event for cardB1 in collectionB - this event is chronologically between cardA1's and cardA2's events
			await engineStoreB.push(cardB1.id, {
				type: SdelkaCardEventType.ANSWER,
				answer: SdelkaAnswer.EASY,
				timestamp: now + 1000,
			})
			// Event for cardA2 in collectionA - this is the latest event pushed via engineStoreA
			await engineStoreA.push(cardA2.id, {
				type: SdelkaCardEventType.ANSWER,
				answer: SdelkaAnswer.HARD,
				timestamp: now + 2000,
			})

			const stateCardA1BeforePop = await engineStoreA.getCardData(cardId)
			const stateCardA2BeforePop = await engineStoreA.getCardData(
				cardA2.id,
			)
			const stateCardB1BeforePop = await engineStoreB.getCardData(
				cardB1.id,
			)

			expect(stateCardA1BeforePop.fsrs.reps).toBe(1)
			expect(stateCardA2BeforePop.fsrs.reps).toBe(1)
			expect(stateCardB1BeforePop.fsrs.reps).toBe(1)

			// Act: Pop from engineStoreA
			await engineStoreA.pop()

			const stateCardA1AfterPop = await engineStoreA.getCardData(cardId)
			const stateCardA2AfterPop = await engineStoreA.getCardData(
				cardA2.id,
			)
			const stateCardB1AfterPop = await engineStoreB.getCardData(
				cardB1.id,
			)

			// Assertions:
			// cardA1 (in collectionA) state should remain, as its event was not the last one for engineStoreA
			expect(stateCardA1AfterPop.fsrs.reps).toBe(1)
			// cardA2 (in collectionA) state should revert, as its event was the last one for engineStoreA
			expect(stateCardA2AfterPop.fsrs.reps).toBe(0)
			// cardB1 (in collectionB) state should remain, as pop was called on engineStoreA
			expect(stateCardB1AfterPop.fsrs.reps).toBe(1)
		})

		test("getCardData returns default state for a card with no events", async () => {
			const engineStore = sdelka.getEngineStore(
				collectionId,
				testParameters,
			)
			const cardData = await engineStore.getCardData(cardId)
			// Check against the default FSRS state properties
			expect(cardData.fsrs.stability).toBe(0)
			expect(cardData.fsrs.difficulty).toBe(0)
			expect(cardData.fsrs.elapsedDays).toBe(0)
			expect(cardData.fsrs.scheduledDays).toBe(0)
			expect(cardData.fsrs.reps).toBe(0)
			expect(cardData.fsrs.lapses).toBe(0)
			// Due date is set for new cards, so we check it's a number
			expect(typeof cardData.fsrs.dueTimestamp).toBe("number")
			expect(cardData.fsrs.dueTimestamp).toBeGreaterThan(0)
		})
	})
})
