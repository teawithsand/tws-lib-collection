import { eq } from "drizzle-orm"
import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest"
import { MintayDrizzleDB } from "../db/db"
import { getTestingDb } from "../db/dbTest.test"
import { cardsTable } from "../db/schema"
import {
	MintayAnswer,
	MintayCardDataUtil,
	MintayCardEventType,
	MintayCardQueue,
	MintayCardStateExtractor,
	MintayCollectionDataUtil,
} from "../defines/card"
import { CardId, CardIdUtil } from "../defines/typings/cardId"
import { FsrsParameters } from "../fsrs"
import { Mintay } from "./defines"
import { DrizzleMintay } from "./drizzle"
import { InMemoryMintay } from "./inMemory"

const testParameters: FsrsParameters = {
	requestRetention: 0.9,
	maximumInterval: 36500,
	w: [
		0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18,
		0.05, 0.34, 1.26, 0.29, 2.61, 0.29, 2.61,
	],
	enableFuzz: false,
	enableShortTerm: true,
}

describe.each<{
	name: string
	getMintay: () => Promise<{ mintay: Mintay; cleanup?: () => Promise<void> }>
}>([
	{
		name: "InMemoryMintay",
		getMintay: async () => ({ mintay: new InMemoryMintay() }),
	},
	{
		name: "DrizzleMintay",
		getMintay: async () => {
			const { drizzle, close } = await getTestingDb()
			return {
				mintay: new DrizzleMintay({ db: drizzle as MintayDrizzleDB }),
				cleanup: close,
			}
		},
	},
])("Mintay E2E Tests - $name", ({ getMintay }) => {
	let mintay: Mintay
	let cleanup: (() => Promise<void>) | undefined

	beforeAll(async () => {
		const res = await getMintay()
		mintay = res.mintay
		cleanup = res.cleanup
	})

	afterAll(async () => {
		if (cleanup) {
			await cleanup()
		}
	})

	describe("CollectionStore", () => {
		test("should create a new collection and read its header", async () => {
			const collectionHandle = await mintay.collectionStore.create()
			expect(collectionHandle).toBeDefined()
			const header = await collectionHandle.read()
			expect(header).toEqual(MintayCollectionDataUtil.getDefaultData())
		})

		test("should get an existing collection", async () => {
			const newCollection = await mintay.collectionStore.create()
			const gottenCollection = mintay.collectionStore.get(
				newCollection.id,
			)
			expect(gottenCollection).toBeDefined()
			expect(gottenCollection.id).toBe(newCollection.id)
			const header = await gottenCollection.read()
			expect(header).toEqual(MintayCollectionDataUtil.getDefaultData())
		})

		test("should save and read collection header", async () => {
			const collectionHandle = await mintay.collectionStore.create()
			const newHeader = {
				...MintayCollectionDataUtil.getDefaultData(),
				title: "My Test Collection",
			}
			await collectionHandle.save(newHeader)
			const readHeader = await collectionHandle.read()
			expect(readHeader.title).toBe("My Test Collection")
		})

		test("should create a card in a collection and read its data", async () => {
			const collectionHandle = await mintay.collectionStore.create()
			const cardHandle = await collectionHandle.createCard()
			expect(cardHandle).toBeDefined()
			const cardData = await cardHandle.read()
			expect(cardData).toEqual(MintayCardDataUtil.getDefaultData())
		})

		test("should save and read card data", async () => {
			const collectionHandle = await mintay.collectionStore.create()
			const cardHandle = await collectionHandle.createCard()
			const newCardData = {
				...MintayCardDataUtil.getDefaultData(),
				content: "Test Card Content",
			}
			await cardHandle.save(newCardData)
			const readData = await cardHandle.read()
			expect(readData.content).toBe("Test Card Content")
		})

		test("should get cards from a collection", async () => {
			const collectionHandle = await mintay.collectionStore.create()
			const card1 = await collectionHandle.createCard()
			const card2 = await collectionHandle.createCard()
			const cards = await collectionHandle.getCards()
			expect(cards.length).toBe(2)
			expect(cards.map((c) => c.id).sort()).toEqual(
				[card1.id, card2.id].sort(),
			)
		})

		test("should get card count from a collection", async () => {
			const collectionHandle = await mintay.collectionStore.create()
			await collectionHandle.createCard()
			await collectionHandle.createCard()
			const count = await collectionHandle.getCardCount()
			expect(count).toBe(2)
		})

		test("should delete a card", async () => {
			const collectionHandle = await mintay.collectionStore.create()
			const cardHandle = await collectionHandle.createCard()
			const cardId = cardHandle.id
			await cardHandle.delete()
			const exists = await cardHandle.exists()
			expect(exists).toBe(false)
			await expect(collectionHandle.getCard(cardId)).rejects.toThrow()
		})

		test("should delete a collection", async () => {
			const collectionHandle = await mintay.collectionStore.create()
			const collectionId = collectionHandle.id
			await collectionHandle.delete()
			const exists = await collectionHandle.exists()
			expect(exists).toBe(false)
			const newHandle = mintay.collectionStore.get(collectionId)
			const newExists = await newHandle.exists()
			expect(newExists).toBe(false)
		})
	})

	describe("EngineStore", () => {
		let collectionId: CardId
		let cardId: CardId

		beforeEach(async () => {
			const collection = await mintay.collectionStore.create()
			collectionId = collection.id
			const card = await collection.createCard()
			cardId = card.id
		})

		test("should get an engine store", () => {
			const engineStore = mintay.getEngineStore(
				collectionId,
				testParameters,
			)
			expect(engineStore).toBeDefined()
		})

		test("should push an event and update card state", async () => {
			const engineStore = mintay.getEngineStore(
				collectionId,
				testParameters,
			)
			const initialCardData = await engineStore.getCardData(cardId)
			expect(initialCardData.fsrs.reps).toBe(0)

			await engineStore.push(cardId, {
				type: MintayCardEventType.ANSWER,
				answer: MintayAnswer.GOOD,
				timestamp: Date.now(),
			})

			const updatedCardData = await engineStore.getCardData(cardId)
			expect(updatedCardData.fsrs.reps).toBe(1)
		})

		test("should get top card", async () => {
			const engineStore = mintay.getEngineStore(
				collectionId,
				testParameters,
			)
			const collection = mintay.collectionStore.get(collectionId)
			const card2 = await collection.createCard()

			// Push events to make card2 have higher priority (earlier due date)
			// For a new card, any answer will schedule it.
			// We'll make cardId "Good" and card2 "Again" to ensure card2 is due sooner.
			const now = Date.now()
			await engineStore.push(cardId, {
				type: MintayCardEventType.ANSWER,
				answer: MintayAnswer.GOOD,
				timestamp: now,
			})
			await engineStore.push(card2.id, {
				type: MintayCardEventType.ANSWER,
				answer: MintayAnswer.AGAIN,
				timestamp: now,
			})

			const topCardId = await engineStore.getTopCard(undefined)
			expect(topCardId).toBe(card2.id)
		})

		test("should pop an event and revert card state", async () => {
			const engineStore = mintay.getEngineStore(
				collectionId,
				testParameters,
			)

			await engineStore.push(cardId, {
				type: MintayCardEventType.ANSWER,
				answer: MintayAnswer.GOOD,
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
			const engineStoreA = mintay.getEngineStore(
				collectionId,
				testParameters,
			)
			const collectionA = mintay.collectionStore.get(collectionId) // collectionA is collectionId
			const cardA2 = await collectionA.createCard() // cardA2 in collectionA

			// Create a second collection, engine store, and card
			const collectionBHandle = await mintay.collectionStore.create()
			const collectionBId = collectionBHandle.id
			const engineStoreB = mintay.getEngineStore(
				collectionBId,
				testParameters,
			)
			const cardB1 = await collectionBHandle.createCard() // cardB1 in collectionB

			const now = Date.now()
			// Event for cardA1 (cardId) in collectionA
			await engineStoreA.push(cardId, {
				type: MintayCardEventType.ANSWER,
				answer: MintayAnswer.GOOD,
				timestamp: now,
			})
			// Event for cardB1 in collectionB - this event is chronologically between cardA1's and cardA2's events
			await engineStoreB.push(cardB1.id, {
				type: MintayCardEventType.ANSWER,
				answer: MintayAnswer.EASY,
				timestamp: now + 1000,
			})
			// Event for cardA2 in collectionA - this is the latest event pushed via engineStoreA
			await engineStoreA.push(cardA2.id, {
				type: MintayCardEventType.ANSWER,
				answer: MintayAnswer.HARD,
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
			const engineStore = mintay.getEngineStore(
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
			expect(cardData.fsrs.dueTimestamp).toBe(0)
		})

		test("getTopCard should return the card with the earliest dueTimestamp when multiple cards are due", async () => {
			const engineStore = mintay.getEngineStore(
				collectionId,
				testParameters,
			)
			const collection = mintay.collectionStore.get(collectionId)
			const card2 = await collection.createCard()
			const card3 = await collection.createCard()
			const now = 1000000

			await engineStore.push(cardId, {
				type: MintayCardEventType.ANSWER,
				answer: MintayAnswer.EASY,
				timestamp: now + 1000,
			})

			await engineStore.push(card2.id, {
				type: MintayCardEventType.ANSWER,
				answer: MintayAnswer.EASY,
				timestamp: now + 10000,
			})

			await engineStore.push(card3.id, {
				type: MintayCardEventType.ANSWER,
				answer: MintayAnswer.EASY,
				timestamp: now + 100000,
			})

			const poppedCardIds: CardId[] = []
			let timeFlow = now

			for (let i = 0; i < 3; i++) {
				const topCardId = await engineStore.getTopCard(undefined)

				if (null === topCardId) break

				poppedCardIds.push(topCardId)

				timeFlow += 1000 * 3600 * 2

				await engineStore.push(topCardId, {
					type: MintayCardEventType.ANSWER,
					answer: MintayAnswer.EASY,
					timestamp: timeFlow,
				})
			}
			expect(poppedCardIds).toEqual([cardId, card2.id, card3.id])
		})

		test("popCard should correctly revert the state of a specific card, not necessarily the last one pushed to engine", async () => {
			const engineStore = mintay.getEngineStore(
				collectionId,
				testParameters,
			)
			const collection = mintay.collectionStore.get(collectionId)
			const card2 = await collection.createCard()
			const now = 10000000

			// Event 1 for cardId
			await engineStore.push(cardId, {
				type: MintayCardEventType.ANSWER,
				answer: MintayAnswer.AGAIN,
				timestamp: now,
			})
			const stateCard1AfterPush1 = await engineStore.getCardData(cardId)
			expect(stateCard1AfterPush1.fsrs.reps).toBe(1)
			expect(stateCard1AfterPush1.fsrs.lapses).toBe(0) // New card + AGAIN = 0 lapses

			// Event for card2
			await engineStore.push(card2.id, {
				type: MintayCardEventType.ANSWER,
				answer: MintayAnswer.GOOD,
				timestamp: now + 1000,
			})
			const stateCard2AfterPush = await engineStore.getCardData(card2.id)
			expect(stateCard2AfterPush.fsrs.reps).toBe(1)

			// Event 2 for cardId
			await engineStore.push(cardId, {
				type: MintayCardEventType.ANSWER,
				answer: MintayAnswer.GOOD, // From Lapsed (AGAIN) to Good
				timestamp: now + 2000,
			})
			const stateCard1AfterPush2 = await engineStore.getCardData(cardId)
			expect(stateCard1AfterPush2.fsrs.reps).toBe(2) // Reps increase
			expect(stateCard1AfterPush2.fsrs.lapses).toBe(0) // Lapses remain 0 as card hasn't been "learned" then "lapsed"

			// Act: Pop the last event for cardId (which is Event 2 for cardId)
			await engineStore.popCard(cardId)

			const stateCard1AfterPop = await engineStore.getCardData(cardId)
			const stateCard2AfterPop = await engineStore.getCardData(card2.id)

			// Assertions:
			// cardId should revert to its state after its first push
			expect(stateCard1AfterPop.fsrs.reps).toBe(
				stateCard1AfterPush1.fsrs.reps,
			)
			expect(stateCard1AfterPop.fsrs.lapses).toBe(
				stateCard1AfterPush1.fsrs.lapses,
			)
			expect(stateCard1AfterPop.fsrs.dueTimestamp).toBe(
				stateCard1AfterPush1.fsrs.dueTimestamp,
			)
			// card2's state should remain unaffected
			expect(stateCard2AfterPop.fsrs.reps).toBe(
				stateCard2AfterPush.fsrs.reps,
			)
		})

		test("pop on an empty engine store (no events for any card) should not throw an error", async () => {
			const newCollection = await mintay.collectionStore.create()
			// card in this collection, but no events pushed for it
			await newCollection.createCard()
			const engineStore = mintay.getEngineStore(
				newCollection.id,
				testParameters,
			)

			await expect(engineStore.pop()).resolves.not.toThrow()
		})

		test("popCard on a card with no events should not throw an error and state remains default", async () => {
			const engineStore = mintay.getEngineStore(
				collectionId,
				testParameters,
			)
			// cardId was created in beforeEach, but has no events yet in this specific test context
			const initialState = await engineStore.getCardData(cardId)

			await engineStore.popCard(cardId)

			const stateAfterPop = await engineStore.getCardData(cardId)
			expect(stateAfterPop).toEqual(initialState) // State should be the default initial state
			expect(stateAfterPop.fsrs.reps).toBe(0)
			expect(stateAfterPop.fsrs.lapses).toBe(0)
		})

		test("REGRESSION: DrizzleMintay push method should update card stats in database table", async () => {
			// This test specifically targets the bug where stats were not updated in the database
			// Skip for InMemoryMintay since it doesn't use a database
			if (!(mintay instanceof DrizzleMintay)) {
				return
			}

			const engineStore = mintay.getEngineStore(
				collectionId,
				testParameters,
			)

			// Get the database instance to directly query the cards table
			const db = (mintay as any).db as MintayDrizzleDB

			// Verify initial database state
			const initialDbRecord = await db
				.select()
				.from(cardsTable)
				.where(eq(cardsTable.id, CardIdUtil.toNumber(cardId)))
				.get()

			expect(initialDbRecord).toBeDefined()
			expect(initialDbRecord!.repeats).toBe(0)
			expect(initialDbRecord!.lapses).toBe(0)

			// Push a GOOD answer event
			await engineStore.push(cardId, {
				type: MintayCardEventType.ANSWER,
				answer: MintayAnswer.GOOD,
				timestamp: Date.now(),
			})

			// Verify the engine store state is correct
			const engineState = await engineStore.getCardData(cardId)
			expect(engineState.fsrs.reps).toBe(1)
			expect(engineState.fsrs.lapses).toBe(0)

			// CRITICAL: Verify the database table was actually updated
			// This is the check that would have failed before the bug fix
			const updatedDbRecord = await db
				.select()
				.from(cardsTable)
				.where(eq(cardsTable.id, CardIdUtil.toNumber(cardId)))
				.get()

			expect(updatedDbRecord).toBeDefined()
			expect(updatedDbRecord!.repeats).toBe(1) // This would fail without the fix
			expect(updatedDbRecord!.lapses).toBe(0) // This would fail without the fix

			// Push another event to further test the synchronization
			await engineStore.push(cardId, {
				type: MintayCardEventType.ANSWER,
				answer: MintayAnswer.GOOD,
				timestamp: Date.now() + 1000,
			})

			const finalEngineState = await engineStore.getCardData(cardId)
			const finalDbRecord = await db
				.select()
				.from(cardsTable)
				.where(eq(cardsTable.id, CardIdUtil.toNumber(cardId)))
				.get()

			expect(finalDbRecord).toBeDefined()
			expect(finalDbRecord!.repeats).toBe(finalEngineState.fsrs.reps)
			expect(finalDbRecord!.lapses).toBe(finalEngineState.fsrs.lapses)
		})

		test("getTopCard should not return cards with no events", async () => {
			const engineStore = mintay.getEngineStore(
				collectionId,
				testParameters,
			)
			const collection = mintay.collectionStore.get(collectionId)

			// Create additional cards
			const card2 = await collection.createCard()
			const card3 = await collection.createCard()

			// Initially, no cards have events, so getTopCard should return null
			let topCard = await engineStore.getTopCard(undefined)
			expect(topCard).toBeNull()

			// Push events to some cards but not all
			await engineStore.push(cardId, {
				type: MintayCardEventType.ANSWER,
				answer: MintayAnswer.GOOD,
				timestamp: Date.now(),
			})
			await engineStore.push(card3.id, {
				type: MintayCardEventType.ANSWER,
				answer: MintayAnswer.AGAIN,
				timestamp: Date.now() + 1000,
			})
			// card2 has no events

			// Should return one of the cards with events
			topCard = await engineStore.getTopCard(undefined)
			expect([cardId, card3.id]).toContain(topCard)
			expect(topCard).not.toBe(card2.id) // card2 has no events

			// Pop all events from cardId and card3
			await engineStore.popCard(cardId)
			await engineStore.popCard(card3.id)

			// Now no cards should be returned
			topCard = await engineStore.getTopCard(undefined)
			expect(topCard).toBeNull()
		})
	})
})
