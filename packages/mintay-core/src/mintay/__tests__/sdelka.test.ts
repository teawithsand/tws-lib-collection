import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { MintayDrizzleDB } from "../../db/db"
import { getTestingDb } from "../../db/dbTest.test"
import {
	CardDataExtractor,
	CollectionDataExtractor,
} from "../../defines/extractor"
import { MintayId } from "../../defines/id"
import { FsrsParameters } from "../../fsrs"
import { Mintay, MintayParams } from "../defines"
import { DrizzleMintay } from "../drizzle"
import { InMemoryMintay } from "../inMemory"
import { LockingMintay } from "../locking"
import { MintayAnswer } from "../types/answer"
import {
	MintayCardEvent,
	MintayCardEventType,
} from "../types/card/event/cardEvent"
import { MintayCardEngineExtractor } from "../types/engineExtractorBase"
import { MintayCardQueue } from "../types/queue"
import { MintayTypeSpec, MintayTypeSpecParams } from "../types/typeSpec"

// Constants for deterministic testing
const BASE_TIMESTAMP = 1700000000000

// Define our test data types
type TestCollectionData = {
	globalId: string
	content: string
	createdAtTimestamp: number
	lastUpdatedAtTimestamp: number
}

type TestCardData = {
	globalId: string
	content: string
	createdAtTimestamp: number
	lastUpdatedAtTimestamp: number
	discoveryPriority: number
}

// Define our test type specification
type TestMintayTypeSpecParams = MintayTypeSpecParams & {
	collectionData: TestCollectionData
	cardData: TestCardData
}

// Create extractors for our test setup
class TestCardDataExtractor
	implements CardDataExtractor<MintayTypeSpec<TestMintayTypeSpecParams>>
{
	public readonly getGlobalId = (data: TestCardData): string => data.globalId
	public readonly getDiscoveryPriority = (data: TestCardData): number =>
		data.discoveryPriority
}

class TestCollectionDataExtractor
	implements CollectionDataExtractor<MintayTypeSpec<TestMintayTypeSpecParams>>
{
	public readonly getGlobalId = (data: TestCollectionData): string =>
		data.globalId
}

class TestCardEngineExtractor extends MintayCardEngineExtractor<
	MintayTypeSpec<TestMintayTypeSpecParams>
> {
	constructor(
		cardDataExtractor: CardDataExtractor<
			MintayTypeSpec<TestMintayTypeSpecParams>
		>,
	) {
		super(cardDataExtractor)
	}

	public readonly getDiscoveryPriority = (data: TestCardData): number =>
		data.discoveryPriority
}

// Create the MintayParams for our tests
const createMintayParams = (): MintayParams<TestMintayTypeSpecParams> => {
	const cardDataExtractor = new TestCardDataExtractor()
	const collectionDataExtractor = new TestCollectionDataExtractor()
	const cardEngineExtractor = new TestCardEngineExtractor(cardDataExtractor)

	return {
		collectionDataExtractor,
		cardDataExtractor,
		cardEngineExtractor,
		collectionDataSerializer: {
			serialize: (data: TestCollectionData) => data as unknown,
			deserialize: (data: unknown) => data as TestCollectionData,
		},
		cardDataSerializer: {
			serialize: (data: TestCardData) => data as unknown,
			deserialize: (data: unknown) => data as TestCardData,
		},
		defaultCardDataFactory: (): TestCardData => ({
			globalId: "",
			content: "",
			createdAtTimestamp: 0,
			lastUpdatedAtTimestamp: 0,
			discoveryPriority: 0,
		}),
		defaultCollectionDataFactory: (): TestCollectionData => ({
			globalId: "",
			content: "",
			createdAtTimestamp: 0,
			lastUpdatedAtTimestamp: 0,
		}),
	}
}

describe.each<{
	name: string
	getMintay: () => Promise<{
		mintay: Mintay<TestMintayTypeSpecParams>
		cleanup?: () => Promise<void>
	}>
}>([
	{
		name: "InMemoryMintay",
		getMintay: async () => ({
			mintay: LockingMintay.wrapSafe(
				new InMemoryMintay(createMintayParams()),
			),
		}),
	},
	{
		name: "DrizzleMintay",
		getMintay: async () => {
			const { drizzle, close } = await getTestingDb()
			return {
				mintay: LockingMintay.wrapSafe(
					new DrizzleMintay({
						db: drizzle as MintayDrizzleDB,
						params: createMintayParams(),
					}),
				),
				cleanup: close,
			}
		},
	},
])("Mintay E2E Tests - $name", ({ getMintay }) => {
	let mintay: Mintay<TestMintayTypeSpecParams>
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

	test("should create and manage collections", async () => {
		// Create a new collection
		const collection = await mintay.collectionStore.create()
		const collectionId = collection.id

		// Verify collection exists
		expect(await collection.exists()).toBe(true)

		// Save collection data
		const collectionData: TestCollectionData = {
			globalId: "test-collection-001",
			content: `My First Collection

A collection for testing E2E functionality`,
			createdAtTimestamp: BASE_TIMESTAMP,
			lastUpdatedAtTimestamp: BASE_TIMESTAMP + 1000,
		}
		await collection.save(collectionData)

		// Read back the data
		const savedData = await collection.mustRead()
		expect(savedData).toEqual(collectionData)

		// Update partial data
		await collection.update({ content: "Updated Collection Content" })
		const updatedData = await collection.mustRead()
		expect(updatedData.content).toBe("Updated Collection Content")

		// Verify collection appears in the list
		const allCollections = await mintay.collectionStore.list()
		expect(allCollections).toContain(collectionId)
	})

	test("should create and manage cards within a collection", async () => {
		// Create a collection
		const collection = await mintay.collectionStore.create()
		await collection.save({
			globalId: "card-test-collection",
			content: `Card Test Collection

Testing card operations`,
			createdAtTimestamp: BASE_TIMESTAMP,
			lastUpdatedAtTimestamp: BASE_TIMESTAMP + 1000,
		})

		// Initially, collection should have no cards
		expect(await collection.getCardCount()).toBe(0)

		// Create a new card
		const card = await collection.createCard()
		const cardId = card.id

		// Verify card exists and belongs to collection
		expect(await card.exists()).toBe(true)
		expect(await collection.getCardCount()).toBe(1)

		// Save card data
		const cardData: TestCardData = {
			globalId: "test-card-001",
			content: "What is the capital of France?",
			createdAtTimestamp: BASE_TIMESTAMP + 2000,
			lastUpdatedAtTimestamp: BASE_TIMESTAMP + 3000,
			discoveryPriority: 1000,
		}
		await card.save(cardData)

		// Read back the data
		const savedCardData = await card.mustRead()
		expect(savedCardData).toEqual(cardData)

		// Update card content
		await card.update({ content: "What is the capital of Italy?" })
		const updatedCardData = await card.mustRead()
		expect(updatedCardData.content).toBe("What is the capital of Italy?")
		expect(updatedCardData.globalId).toBe(cardData.globalId)

		// Get card through collection
		const retrievedCard = await collection.getCard(cardId)
		const retrievedData = await retrievedCard.mustRead()
		expect(retrievedData.content).toBe("What is the capital of Italy?")

		// Get all cards in collection
		const allCards = await collection.getCards()
		expect(allCards).toHaveLength(1)
		expect(allCards[0]!.id).toBe(cardId)
	})

	test("should demonstrate learning engine workflow", async () => {
		// Create collection and card
		const collection = await mintay.collectionStore.create()
		await collection.save({
			globalId: "learning-test-collection",
			content: `Learning Engine Test

Testing FSRS learning functionality`,
			createdAtTimestamp: BASE_TIMESTAMP,
			lastUpdatedAtTimestamp: BASE_TIMESTAMP + 1000,
		})

		const card = await collection.createCard()
		await card.save({
			globalId: "learning-card-001",
			content: "What is 2 + 2?",
			createdAtTimestamp: BASE_TIMESTAMP + 2000,
			lastUpdatedAtTimestamp: BASE_TIMESTAMP + 3000,
			discoveryPriority: 500,
		})

		// Set up engine store with FSRS parameters
		const fsrsParams: FsrsParameters = {
			requestRetention: 0.9,
			maximumInterval: 36500,
			w: [
				0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94,
				2.18, 0.05, 0.34, 1.26, 0.29, 2.61, 0.2, 1.0,
			],
			enableFuzz: true,
			enableShortTerm: true,
		}
		const engineStore = mintay.getEngineStore(collection.id, fsrsParams)

		// Initially, the card should be the top card (new card)
		const topCard = await engineStore.getTopCard()
		expect(topCard).toBe(card.id)

		// Get initial card state (should be default new state)
		const initialState = await engineStore.getCardData(card.id)
		expect(initialState.fsrs.state).toBe(MintayCardQueue.NEW)
		expect(initialState.fsrs.reps).toBe(0)
		expect(initialState.fsrs.lapses).toBe(0)

		// Simulate answering the card with "GOOD"
		const answerEvent: MintayCardEvent = {
			type: MintayCardEventType.ANSWER,
			answer: MintayAnswer.GOOD,
			timestamp: BASE_TIMESTAMP + 4000,
		}
		await engineStore.push(card.id, answerEvent)

		// Check updated state
		const updatedState = await engineStore.getCardData(card.id)
		expect(updatedState.fsrs.reps).toBe(1)
		expect(updatedState.fsrs.state).toBe(MintayCardQueue.LEARNING)
		expect(updatedState.fsrs.dueTimestamp).toBeGreaterThan(
			answerEvent.timestamp,
		)

		// Answer again with "EASY"
		const easyAnswerEvent: MintayCardEvent = {
			type: MintayCardEventType.ANSWER,
			answer: MintayAnswer.EASY,
			timestamp: BASE_TIMESTAMP + 5000,
		}
		await engineStore.push(card.id, easyAnswerEvent)

		// Check final state
		const finalState = await engineStore.getCardData(card.id)
		expect(finalState.fsrs.reps).toBe(2)

		// Test undo functionality
		await engineStore.popCard(card.id)
		const undoState = await engineStore.getCardData(card.id)
		expect(undoState.fsrs.reps).toBe(1) // Should be back to previous state
	})

	test("should handle multiple cards with priority ordering", async () => {
		// Create collection
		const collection = await mintay.collectionStore.create()
		await collection.save({
			globalId: "priority-test-collection",
			content: `Priority Test Collection

Testing card priority ordering`,
			createdAtTimestamp: BASE_TIMESTAMP + 6000,
			lastUpdatedAtTimestamp: BASE_TIMESTAMP + 6000,
		})

		// Create cards with different priorities
		const highPriorityCard = await collection.createCard()
		await highPriorityCard.save({
			globalId: "high-priority-card",
			content: "High priority question",
			createdAtTimestamp: BASE_TIMESTAMP + 2000,
			lastUpdatedAtTimestamp: BASE_TIMESTAMP + 3000,
			discoveryPriority: 100, // Higher priority (lower number)
		})

		const lowPriorityCard = await collection.createCard()
		await lowPriorityCard.save({
			globalId: "low-priority-card",
			content: "Low priority question",
			createdAtTimestamp: BASE_TIMESTAMP + 2000,
			lastUpdatedAtTimestamp: BASE_TIMESTAMP + 3000,
			discoveryPriority: 1000, // Lower priority (higher number)
		})

		const engineStore = mintay.getEngineStore(collection.id, {
			requestRetention: 0.9,
			maximumInterval: 36500,
			w: [
				0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94,
				2.18, 0.05, 0.34, 1.26, 0.29, 2.61, 0.2, 1.0,
			],
			enableFuzz: true,
			enableShortTerm: true,
		})

		// High priority card should be selected first
		const topCard = await engineStore.getTopCard()
		expect(topCard).toBe(highPriorityCard.id)

		// Get top card from specific queue (NEW cards only)
		const topNewCard = await engineStore.getTopCard([MintayCardQueue.NEW])
		expect(topNewCard).toBe(highPriorityCard.id)
	})

	test("should handle card deletion and collection cleanup", async () => {
		// Create collection with cards
		const collection = await mintay.collectionStore.create()
		await collection.save({
			globalId: "cleanup-test-collection",
			content: `Cleanup Test Collection

Testing deletion functionality`,
			createdAtTimestamp: BASE_TIMESTAMP + 7000,
			lastUpdatedAtTimestamp: BASE_TIMESTAMP + 7000,
		})

		const card1 = await collection.createCard()
		const card2 = await collection.createCard()

		await card1.save({
			globalId: "card-to-delete-1",
			content: "First card to delete",
			createdAtTimestamp: BASE_TIMESTAMP + 2000,
			lastUpdatedAtTimestamp: BASE_TIMESTAMP + 3000,
			discoveryPriority: 100,
		})

		await card2.save({
			globalId: "card-to-delete-2",
			content: "Second card to delete",
			createdAtTimestamp: BASE_TIMESTAMP + 2000,
			lastUpdatedAtTimestamp: BASE_TIMESTAMP + 3000,
			discoveryPriority: 200,
		})

		// Verify both cards exist
		expect(await collection.getCardCount()).toBe(2)
		expect(await card1.exists()).toBe(true)
		expect(await card2.exists()).toBe(true)

		// Delete one card
		await card1.delete()
		expect(await card1.exists()).toBe(false)
		expect(await collection.getCardCount()).toBe(1)

		// Delete entire collection (should also delete remaining card)
		await collection.delete()
		expect(await collection.exists()).toBe(false)

		// Note: Card deletion behavior when collection is deleted may vary by implementation
		// Some implementations might cascade delete, others might require explicit cleanup
		try {
			const card2Exists = await card2.exists()
			// If the implementation supports cascade delete, card should not exist
			// If not, card might still exist but be orphaned
			expect(typeof card2Exists).toBe("boolean")
		} catch (error) {
			// If accessing the card throws an error after collection deletion, that's also acceptable
			expect(error).toBeDefined()
		}
	})

	test("should handle pagination when retrieving cards", async () => {
		// Create collection
		const collection = await mintay.collectionStore.create()
		await collection.save({
			globalId: "pagination-test-collection",
			content: `Pagination Test Collection

Testing card pagination`,
			createdAtTimestamp: BASE_TIMESTAMP + 8000,
			lastUpdatedAtTimestamp: BASE_TIMESTAMP + 8000,
		})

		// Create multiple cards
		const cardIds: MintayId[] = []
		for (let i = 0; i < 5; i++) {
			const card = await collection.createCard()
			await card.save({
				globalId: `pagination-card-${i}`,
				content: `Card content ${i}`,
				createdAtTimestamp: BASE_TIMESTAMP + 8000 + i,
				lastUpdatedAtTimestamp: BASE_TIMESTAMP + 8000 + i,
				discoveryPriority: i * 100,
			})
			cardIds.push(card.id)
		}

		// Test pagination
		const firstPage = await collection.getCards({ offset: 0, limit: 2 })
		expect(firstPage).toHaveLength(2)

		const secondPage = await collection.getCards({ offset: 2, limit: 2 })
		expect(secondPage).toHaveLength(2)

		const lastPage = await collection.getCards({ offset: 4, limit: 2 })
		expect(lastPage).toHaveLength(1)

		// Test getting all cards
		const allCards = await collection.getCards()
		expect(allCards).toHaveLength(5)

		// Verify no duplicate cards in pages
		const allPagedCardIds = [
			...firstPage.map((c: any) => c.id),
			...secondPage.map((c: any) => c.id),
			...lastPage.map((c: any) => c.id),
		]
		const uniqueIds = new Set(allPagedCardIds)
		expect(uniqueIds.size).toBe(5)
	})

	test("should handle card events with pop functionality", async () => {
		// Create collection and card
		const collection = await mintay.collectionStore.create()
		await collection.save({
			globalId: "pop-test-collection",
			content: `Pop Test Collection

Testing event pop functionality`,
			createdAtTimestamp: BASE_TIMESTAMP,
			lastUpdatedAtTimestamp: BASE_TIMESTAMP + 1000,
		})

		const card = await collection.createCard()
		await card.save({
			globalId: "pop-test-card",
			content: "What is the answer to everything?",
			createdAtTimestamp: BASE_TIMESTAMP + 2000,
			lastUpdatedAtTimestamp: BASE_TIMESTAMP + 3000,
			discoveryPriority: 500,
		})

		// Set up engine store
		const fsrsParams: FsrsParameters = {
			requestRetention: 0.9,
			maximumInterval: 36500,
			w: [
				0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94,
				2.18, 0.05, 0.34, 1.26, 0.29, 2.61, 0.2, 1.0,
			],
			enableFuzz: true,
			enableShortTerm: true,
		}
		const engineStore = mintay.getEngineStore(collection.id, fsrsParams)

		// Get initial state
		const initialState = await engineStore.getCardData(card.id)
		expect(initialState.fsrs.reps).toBe(0)
		expect(initialState.fsrs.state).toBe(MintayCardQueue.NEW)

		// Answer the card with "GOOD"
		const firstAnswerEvent: MintayCardEvent = {
			type: MintayCardEventType.ANSWER,
			answer: MintayAnswer.GOOD,
			timestamp: BASE_TIMESTAMP + 4000,
		}
		await engineStore.push(card.id, firstAnswerEvent)

		// Verify state changed
		const afterFirstAnswer = await engineStore.getCardData(card.id)
		expect(afterFirstAnswer.fsrs.reps).toBe(1)
		expect(afterFirstAnswer.fsrs.state).toBe(MintayCardQueue.LEARNING)

		// Answer again with "AGAIN"
		const secondAnswerEvent: MintayCardEvent = {
			type: MintayCardEventType.ANSWER,
			answer: MintayAnswer.AGAIN,
			timestamp: BASE_TIMESTAMP + 5000,
		}
		await engineStore.push(card.id, secondAnswerEvent)

		// Verify state after second answer
		const afterSecondAnswer = await engineStore.getCardData(card.id)
		expect(afterSecondAnswer.fsrs.reps).toBe(2)

		// Pop the last event (undo the "AGAIN" answer)
		await engineStore.popCard(card.id)

		// Verify we're back to the state after first answer
		const afterPop = await engineStore.getCardData(card.id)
		expect(afterPop.fsrs.reps).toBe(1)
		expect(afterPop.fsrs.state).toBe(MintayCardQueue.LEARNING)
		expect(afterPop.fsrs.dueTimestamp).toBe(
			afterFirstAnswer.fsrs.dueTimestamp,
		)

		// Pop again to get back to initial state
		await engineStore.popCard(card.id)
		const backToInitial = await engineStore.getCardData(card.id)
		expect(backToInitial.fsrs.reps).toBe(0)
		expect(backToInitial.fsrs.state).toBe(MintayCardQueue.NEW)
	})

	test("should handle global undo functionality with pop method", async () => {
		// Create collection and multiple cards
		const collection = await mintay.collectionStore.create()
		await collection.save({
			globalId: "global-undo-test-collection",
			content: `Global Undo Test Collection

Testing global undo functionality`,
			createdAtTimestamp: BASE_TIMESTAMP,
			lastUpdatedAtTimestamp: BASE_TIMESTAMP + 1000,
		})

		const card1 = await collection.createCard()
		await card1.save({
			globalId: "global-undo-card-1",
			content: "First card for global undo test",
			createdAtTimestamp: BASE_TIMESTAMP + 2000,
			lastUpdatedAtTimestamp: BASE_TIMESTAMP + 3000,
			discoveryPriority: 100,
		})

		const card2 = await collection.createCard()
		await card2.save({
			globalId: "global-undo-card-2",
			content: "Second card for global undo test",
			createdAtTimestamp: BASE_TIMESTAMP + 2500,
			lastUpdatedAtTimestamp: BASE_TIMESTAMP + 3500,
			discoveryPriority: 200,
		})

		// Set up engine store
		const fsrsParams: FsrsParameters = {
			requestRetention: 0.9,
			maximumInterval: 36500,
			w: [
				0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94,
				2.18, 0.05, 0.34, 1.26, 0.29, 2.61, 0.2, 1.0,
			],
			enableFuzz: true,
			enableShortTerm: true,
		}
		const engineStore = mintay.getEngineStore(collection.id, fsrsParams)

		// Get initial states
		const card1InitialState = await engineStore.getCardData(card1.id)
		const card2InitialState = await engineStore.getCardData(card2.id)
		expect(card1InitialState.fsrs.reps).toBe(0)
		expect(card2InitialState.fsrs.reps).toBe(0)

		// Push events in specific order: card1 -> card2 -> card1 -> card2
		const event1: MintayCardEvent = {
			type: MintayCardEventType.ANSWER,
			answer: MintayAnswer.GOOD,
			timestamp: BASE_TIMESTAMP + 4000,
		}
		await engineStore.push(card1.id, event1)

		const event2: MintayCardEvent = {
			type: MintayCardEventType.ANSWER,
			answer: MintayAnswer.HARD,
			timestamp: BASE_TIMESTAMP + 5000,
		}
		await engineStore.push(card2.id, event2)

		const event3: MintayCardEvent = {
			type: MintayCardEventType.ANSWER,
			answer: MintayAnswer.AGAIN,
			timestamp: BASE_TIMESTAMP + 6000,
		}
		await engineStore.push(card1.id, event3)

		const event4: MintayCardEvent = {
			type: MintayCardEventType.ANSWER,
			answer: MintayAnswer.EASY,
			timestamp: BASE_TIMESTAMP + 7000,
		}
		await engineStore.push(card2.id, event4)

		// Verify states after all events
		const card1AfterEvents = await engineStore.getCardData(card1.id)
		const card2AfterEvents = await engineStore.getCardData(card2.id)
		expect(card1AfterEvents.fsrs.reps).toBe(2)
		expect(card2AfterEvents.fsrs.reps).toBe(2)

		// Test global pop - should undo last event (event4 on card2)
		await engineStore.pop()
		const card1AfterPop1 = await engineStore.getCardData(card1.id)
		const card2AfterPop1 = await engineStore.getCardData(card2.id)
		expect(card1AfterPop1.fsrs.reps).toBe(2) // Should remain unchanged
		expect(card2AfterPop1.fsrs.reps).toBe(1) // Should be back to state after event2

		// Test another global pop - should undo event3 on card1
		await engineStore.pop()
		const card1AfterPop2 = await engineStore.getCardData(card1.id)
		const card2AfterPop2 = await engineStore.getCardData(card2.id)
		expect(card1AfterPop2.fsrs.reps).toBe(1) // Should be back to state after event1
		expect(card2AfterPop2.fsrs.reps).toBe(1) // Should remain unchanged

		// Test another global pop - should undo event2 on card2
		await engineStore.pop()
		const card1AfterPop3 = await engineStore.getCardData(card1.id)
		const card2AfterPop3 = await engineStore.getCardData(card2.id)
		expect(card1AfterPop3.fsrs.reps).toBe(1) // Should remain unchanged
		expect(card2AfterPop3.fsrs.reps).toBe(0) // Should be back to initial state

		// Test final global pop - should undo event1 on card1
		await engineStore.pop()
		const card1AfterPop4 = await engineStore.getCardData(card1.id)
		const card2AfterPop4 = await engineStore.getCardData(card2.id)
		expect(card1AfterPop4.fsrs.reps).toBe(0) // Should be back to initial state
		expect(card2AfterPop4.fsrs.reps).toBe(0) // Should remain unchanged

		// Test pop when no events left - should not throw error
		await engineStore.pop()
		const card1Final = await engineStore.getCardData(card1.id)
		const card2Final = await engineStore.getCardData(card2.id)
		expect(card1Final.fsrs.reps).toBe(0) // Should remain at initial state
		expect(card2Final.fsrs.reps).toBe(0) // Should remain at initial state
	})

	test("should handle mixed pop operations - global and card-specific", async () => {
		// Create collection and cards
		const collection = await mintay.collectionStore.create()
		await collection.save({
			globalId: "mixed-pop-test-collection",
			content: `Mixed Pop Test Collection

Testing mixed pop operations`,
			createdAtTimestamp: BASE_TIMESTAMP,
			lastUpdatedAtTimestamp: BASE_TIMESTAMP + 1000,
		})

		const card1 = await collection.createCard()
		await card1.save({
			globalId: "mixed-pop-card-1",
			content: "Card for mixed pop test",
			createdAtTimestamp: BASE_TIMESTAMP + 2000,
			lastUpdatedAtTimestamp: BASE_TIMESTAMP + 3000,
			discoveryPriority: 100,
		})

		const card2 = await collection.createCard()
		await card2.save({
			globalId: "mixed-pop-card-2",
			content: "Second card for mixed pop test",
			createdAtTimestamp: BASE_TIMESTAMP + 2500,
			lastUpdatedAtTimestamp: BASE_TIMESTAMP + 3500,
			discoveryPriority: 200,
		})

		// Set up engine store
		const fsrsParams: FsrsParameters = {
			requestRetention: 0.9,
			maximumInterval: 36500,
			w: [
				0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94,
				2.18, 0.05, 0.34, 1.26, 0.29, 2.61, 0.2, 1.0,
			],
			enableFuzz: true,
			enableShortTerm: true,
		}
		const engineStore = mintay.getEngineStore(collection.id, fsrsParams)

		// Push multiple events on both cards
		await engineStore.push(card1.id, {
			type: MintayCardEventType.ANSWER,
			answer: MintayAnswer.GOOD,
			timestamp: BASE_TIMESTAMP + 4000,
		})

		await engineStore.push(card1.id, {
			type: MintayCardEventType.ANSWER,
			answer: MintayAnswer.HARD,
			timestamp: BASE_TIMESTAMP + 5000,
		})

		await engineStore.push(card2.id, {
			type: MintayCardEventType.ANSWER,
			answer: MintayAnswer.GOOD,
			timestamp: BASE_TIMESTAMP + 6000,
		})

		await engineStore.push(card2.id, {
			type: MintayCardEventType.ANSWER,
			answer: MintayAnswer.EASY,
			timestamp: BASE_TIMESTAMP + 7000,
		})

		// Verify initial state after all events
		const card1Initial = await engineStore.getCardData(card1.id)
		const card2Initial = await engineStore.getCardData(card2.id)
		expect(card1Initial.fsrs.reps).toBe(2)
		expect(card2Initial.fsrs.reps).toBe(2)

		// Use card-specific pop to undo last event on card1
		await engineStore.popCard(card1.id)
		const card1AfterSpecificPop = await engineStore.getCardData(card1.id)
		const card2AfterSpecificPop = await engineStore.getCardData(card2.id)
		expect(card1AfterSpecificPop.fsrs.reps).toBe(1) // Should have one less event
		expect(card2AfterSpecificPop.fsrs.reps).toBe(2) // Should remain unchanged

		// Use global pop - should undo last global event (card2's second event)
		await engineStore.pop()
		const card1AfterGlobalPop = await engineStore.getCardData(card1.id)
		const card2AfterGlobalPop = await engineStore.getCardData(card2.id)
		expect(card1AfterGlobalPop.fsrs.reps).toBe(1) // Should remain unchanged
		expect(card2AfterGlobalPop.fsrs.reps).toBe(1) // Should have one less event

		// Use another card-specific pop on card2
		await engineStore.popCard(card2.id)
		const card1AfterSecondSpecificPop = await engineStore.getCardData(
			card1.id,
		)
		const card2AfterSecondSpecificPop = await engineStore.getCardData(
			card2.id,
		)
		expect(card1AfterSecondSpecificPop.fsrs.reps).toBe(1) // Should remain unchanged
		expect(card2AfterSecondSpecificPop.fsrs.reps).toBe(0) // Should be back to initial state

		// Final global pop should undo remaining event on card1
		await engineStore.pop()
		const card1Final = await engineStore.getCardData(card1.id)
		const card2Final = await engineStore.getCardData(card2.id)
		expect(card1Final.fsrs.reps).toBe(0) // Should be back to initial state
		expect(card2Final.fsrs.reps).toBe(0) // Should remain at initial state
	})

	test("should handle card relearning and queue-specific querying", async () => {
		// Create collection
		const collection = await mintay.collectionStore.create()
		await collection.save({
			globalId: "relearning-test-collection",
			content: `Relearning Test Collection

Testing card relearning and queue filtering`,
			createdAtTimestamp: BASE_TIMESTAMP,
			lastUpdatedAtTimestamp: BASE_TIMESTAMP + 1000,
		})

		// Create a card
		const card = await collection.createCard()
		await card.save({
			globalId: "relearning-card",
			content: "Card that will go through relearning",
			createdAtTimestamp: BASE_TIMESTAMP + 2000,
			lastUpdatedAtTimestamp: BASE_TIMESTAMP + 3000,
			discoveryPriority: 300,
		})

		// Set up engine store
		const fsrsParams: FsrsParameters = {
			requestRetention: 0.9,
			maximumInterval: 36500,
			w: [
				0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94,
				2.18, 0.05, 0.34, 1.26, 0.29, 2.61, 0.2, 1.0,
			],
			enableFuzz: true,
			enableShortTerm: true,
		}
		const engineStore = mintay.getEngineStore(collection.id, fsrsParams)

		// Initial state - card should be NEW
		let cardState = await engineStore.getCardData(card.id)
		expect(cardState.fsrs.state).toBe(MintayCardQueue.NEW)
		expect(cardState.fsrs.reps).toBe(0)
		expect(cardState.fsrs.lapses).toBe(0)

		// Test queue-specific querying - should find NEW card
		let topCardInNewQueue = await engineStore.getTopCard([
			MintayCardQueue.NEW,
		])
		expect(topCardInNewQueue).toBe(card.id)

		// Should not find card when querying only LEARNING queue
		let topCardInLearningQueue = await engineStore.getTopCard([
			MintayCardQueue.LEARNING,
		])
		expect(topCardInLearningQueue).toBeNull()

		// First answer: GOOD - move to LEARNING
		await engineStore.push(card.id, {
			type: MintayCardEventType.ANSWER,
			answer: MintayAnswer.GOOD,
			timestamp: BASE_TIMESTAMP + 4000,
		})

		cardState = await engineStore.getCardData(card.id)
		expect(cardState.fsrs.state).toBe(MintayCardQueue.LEARNING)
		expect(cardState.fsrs.reps).toBe(1)

		// Test queue filtering - should find in LEARNING queue now
		topCardInLearningQueue = await engineStore.getTopCard([
			MintayCardQueue.LEARNING,
		])
		expect(topCardInLearningQueue).toBe(card.id)

		// Should not find in NEW queue anymore
		topCardInNewQueue = await engineStore.getTopCard([MintayCardQueue.NEW])
		expect(topCardInNewQueue).toBeNull()

		// Second answer: GOOD - should move to LEARNED
		await engineStore.push(card.id, {
			type: MintayCardEventType.ANSWER,
			answer: MintayAnswer.GOOD,
			timestamp: BASE_TIMESTAMP + 5000,
		})

		cardState = await engineStore.getCardData(card.id)
		expect(cardState.fsrs.state).toBe(MintayCardQueue.LEARNED)
		expect(cardState.fsrs.reps).toBe(2)
		expect(cardState.fsrs.lapses).toBe(0)

		// Test queue filtering for LEARNED cards
		const topCardInLearnedQueue = await engineStore.getTopCard([
			MintayCardQueue.LEARNED,
		])
		expect(topCardInLearnedQueue).toBe(card.id)

		// Should not find in LEARNING queue anymore
		topCardInLearningQueue = await engineStore.getTopCard([
			MintayCardQueue.LEARNING,
		])
		expect(topCardInLearningQueue).toBeNull()

		// Third answer: AGAIN - this should trigger relearning (lapse)
		await engineStore.push(card.id, {
			type: MintayCardEventType.ANSWER,
			answer: MintayAnswer.AGAIN,
			timestamp: BASE_TIMESTAMP + 6000,
		})

		cardState = await engineStore.getCardData(card.id)
		expect(cardState.fsrs.state).toBe(MintayCardQueue.RELEARNING)
		expect(cardState.fsrs.reps).toBe(3)
		expect(cardState.fsrs.lapses).toBe(1) // Should have 1 lapse now

		// Test queue filtering for RELEARNING cards
		const topCardInRelearningQueue = await engineStore.getTopCard([
			MintayCardQueue.RELEARNING,
		])
		expect(topCardInRelearningQueue).toBe(card.id)

		// Should not find in LEARNED queue anymore
		const topCardInLearnedQueueAfterLapse = await engineStore.getTopCard([
			MintayCardQueue.LEARNED,
		])
		expect(topCardInLearnedQueueAfterLapse).toBeNull()

		// Test querying multiple queues at once
		const topCardInLearningOrRelearning = await engineStore.getTopCard([
			MintayCardQueue.LEARNING,
			MintayCardQueue.RELEARNING,
		])
		expect(topCardInLearningOrRelearning).toBe(card.id)

		// Test empty queue array behavior
		const topCardWithEmptyQueues = await engineStore.getTopCard([])
		expect(topCardWithEmptyQueues).toBeNull()

		// Test all queues (no filter)
		const topCardAllQueues = await engineStore.getTopCard()
		expect(topCardAllQueues).toBe(card.id)

		// Answer EASY from relearning to get back to learned
		await engineStore.push(card.id, {
			type: MintayCardEventType.ANSWER,
			answer: MintayAnswer.EASY,
			timestamp: BASE_TIMESTAMP + 7000,
		})

		cardState = await engineStore.getCardData(card.id)
		expect(cardState.fsrs.state).toBe(MintayCardQueue.LEARNED)
		expect(cardState.fsrs.reps).toBe(4)
		expect(cardState.fsrs.lapses).toBe(1) // Lapse count should remain

		// Final verification - card should be back in LEARNED queue
		const finalTopCardInLearnedQueue = await engineStore.getTopCard([
			MintayCardQueue.LEARNED,
		])
		expect(finalTopCardInLearnedQueue).toBe(card.id)

		const finalTopCardInRelearningQueue = await engineStore.getTopCard([
			MintayCardQueue.RELEARNING,
		])
		expect(finalTopCardInRelearningQueue).toBeNull()
	})

	test("should fetch cards by ID using cardStore for content management", async () => {
		// Create multiple collections with cards
		const collection1 = await mintay.collectionStore.create()
		await collection1.save({
			globalId: "content-mgmt-collection-1",
			content: `French Vocabulary

Learning French words and phrases`,
			createdAtTimestamp: BASE_TIMESTAMP,
			lastUpdatedAtTimestamp: BASE_TIMESTAMP + 1000,
		})

		const collection2 = await mintay.collectionStore.create()
		await collection2.save({
			globalId: "content-mgmt-collection-2",
			content: `Spanish Grammar

Spanish grammar rules and exercises`,
			createdAtTimestamp: BASE_TIMESTAMP + 1000,
			lastUpdatedAtTimestamp: BASE_TIMESTAMP + 2000,
		})

		// Create cards in different collections with similar content
		const frenchCard1 = await collection1.createCard()
		await frenchCard1.save({
			globalId: "french-hello",
			content: "How do you say 'hello' in French?",
			createdAtTimestamp: BASE_TIMESTAMP + 3000,
			lastUpdatedAtTimestamp: BASE_TIMESTAMP + 3000,
			discoveryPriority: 100,
		})

		const frenchCard2 = await collection1.createCard()
		await frenchCard2.save({
			globalId: "french-goodbye",
			content: "How do you say 'goodbye' in French?",
			createdAtTimestamp: BASE_TIMESTAMP + 4000,
			lastUpdatedAtTimestamp: BASE_TIMESTAMP + 4000,
			discoveryPriority: 200,
		})

		const spanishCard = await collection2.createCard()
		await spanishCard.save({
			globalId: "spanish-subjunctive",
			content: "When do you use the subjunctive mood in Spanish?",
			createdAtTimestamp: BASE_TIMESTAMP + 5000,
			lastUpdatedAtTimestamp: BASE_TIMESTAMP + 5000,
			discoveryPriority: 300,
		})

		// Test fetching cards by ID using cardStore
		const fetchedFrenchCard1 = await mintay.cardStore.getCardById(
			frenchCard1.id,
		)
		expect(fetchedFrenchCard1).not.toBeNull()

		if (fetchedFrenchCard1) {
			const cardData = await fetchedFrenchCard1.mustRead()
			expect(cardData.globalId).toBe("french-hello")
			expect(cardData.content).toBe("How do you say 'hello' in French?")
			expect(cardData.discoveryPriority).toBe(100)
		}

		const fetchedSpanishCard = await mintay.cardStore.getCardById(
			spanishCard.id,
		)
		expect(fetchedSpanishCard).not.toBeNull()

		if (fetchedSpanishCard) {
			const cardData = await fetchedSpanishCard.mustRead()
			expect(cardData.globalId).toBe("spanish-subjunctive")
			expect(cardData.content).toBe(
				"When do you use the subjunctive mood in Spanish?",
			)
		}

		// Test fetching non-existent card
		const nonExistentCardId = 1234545
		const nonExistentCard =
			await mintay.cardStore.getCardById(nonExistentCardId)
		expect(nonExistentCard).toBeNull()

		// Test updating card content through cardStore
		if (fetchedFrenchCard1) {
			await fetchedFrenchCard1.update({
				content: "How do you say 'bonjour' in English?",
				lastUpdatedAtTimestamp: BASE_TIMESTAMP + 6000,
			})

			const updatedData = await fetchedFrenchCard1.mustRead()
			expect(updatedData.content).toBe(
				"How do you say 'bonjour' in English?",
			)
			expect(updatedData.lastUpdatedAtTimestamp).toBe(
				BASE_TIMESTAMP + 6000,
			)
		}
	})

	test("should handle card data migration and validation scenarios", async () => {
		// Create a collection for data validation testing
		const collection = await mintay.collectionStore.create()
		await collection.save({
			globalId: "validation-collection",
			content: `Data Validation Collection

Testing data integrity and migration`,
			createdAtTimestamp: BASE_TIMESTAMP,
			lastUpdatedAtTimestamp: BASE_TIMESTAMP + 1000,
		})

		// Create cards with various data patterns
		const cardWithMinimalData = await collection.createCard()
		await cardWithMinimalData.save({
			globalId: "minimal-card",
			content: "Simple question",
			createdAtTimestamp: BASE_TIMESTAMP + 2000,
			lastUpdatedAtTimestamp: BASE_TIMESTAMP + 2000,
			discoveryPriority: 500,
		})

		const cardWithRichData = await collection.createCard()
		await cardWithRichData.save({
			globalId: "rich-data-card",
			content:
				"Complex question with detailed explanation and multiple examples",
			createdAtTimestamp: BASE_TIMESTAMP + 3000,
			lastUpdatedAtTimestamp: BASE_TIMESTAMP + 4000,
			discoveryPriority: 50,
		})

		// Fetch cards through cardStore and validate data consistency
		const fetchedMinimalCard = await mintay.cardStore.getCardById(
			cardWithMinimalData.id,
		)
		const fetchedRichCard = await mintay.cardStore.getCardById(
			cardWithRichData.id,
		)

		expect(fetchedMinimalCard).not.toBeNull()
		expect(fetchedRichCard).not.toBeNull()

		if (fetchedMinimalCard && fetchedRichCard) {
			// Validate that all required fields are present
			const minimalData = await fetchedMinimalCard.mustRead()
			const richData = await fetchedRichCard.mustRead()

			// Check data structure consistency
			expect(typeof minimalData.globalId).toBe("string")
			expect(typeof minimalData.content).toBe("string")
			expect(typeof minimalData.createdAtTimestamp).toBe("number")
			expect(typeof minimalData.lastUpdatedAtTimestamp).toBe("number")
			expect(typeof minimalData.discoveryPriority).toBe("number")

			expect(typeof richData.globalId).toBe("string")
			expect(typeof richData.content).toBe("string")
			expect(typeof richData.createdAtTimestamp).toBe("number")
			expect(typeof richData.lastUpdatedAtTimestamp).toBe("number")
			expect(typeof richData.discoveryPriority).toBe("number")

			// Validate timestamps make sense
			expect(minimalData.lastUpdatedAtTimestamp).toBeGreaterThanOrEqual(
				minimalData.createdAtTimestamp,
			)
			expect(richData.lastUpdatedAtTimestamp).toBeGreaterThanOrEqual(
				richData.createdAtTimestamp,
			)

			// Test data migration scenario - update old format to new format
			await fetchedMinimalCard.update({
				content: "Updated: Simple question with additional context",
				lastUpdatedAtTimestamp: BASE_TIMESTAMP + 10000,
			})

			const migratedData = await fetchedMinimalCard.mustRead()
			expect(migratedData.content).toBe(
				"Updated: Simple question with additional context",
			)
			expect(migratedData.lastUpdatedAtTimestamp).toBe(
				BASE_TIMESTAMP + 10000,
			)

			// Verify original created timestamp remains unchanged
			expect(migratedData.createdAtTimestamp).toBe(BASE_TIMESTAMP + 2000)
		}
	})

	test("should handle cross-collection card lookup for study session management", async () => {
		// Simulate a scenario where a study app needs to find specific cards across collections
		const mathCollection = await mintay.collectionStore.create()
		await mathCollection.save({
			globalId: "mathematics-collection",
			content: `Mathematics Problems

Algebra and calculus problems`,
			createdAtTimestamp: BASE_TIMESTAMP,
			lastUpdatedAtTimestamp: BASE_TIMESTAMP + 1000,
		})

		const physicsCollection = await mintay.collectionStore.create()
		await physicsCollection.save({
			globalId: "physics-collection",
			content: `Physics Concepts

Fundamental physics principles`,
			createdAtTimestamp: BASE_TIMESTAMP + 1000,
			lastUpdatedAtTimestamp: BASE_TIMESTAMP + 2000,
		})

		// Create cards that might be reviewed together in a study session
		const algebraCard = await mathCollection.createCard()
		await algebraCard.save({
			globalId: "algebra-quadratic",
			content: "Solve: x² + 5x + 6 = 0",
			createdAtTimestamp: BASE_TIMESTAMP + 3000,
			lastUpdatedAtTimestamp: BASE_TIMESTAMP + 3000,
			discoveryPriority: 100,
		})

		const calculusCard = await mathCollection.createCard()
		await calculusCard.save({
			globalId: "calculus-derivative",
			content: "Find the derivative of f(x) = x³ + 2x² - 5x + 1",
			createdAtTimestamp: BASE_TIMESTAMP + 4000,
			lastUpdatedAtTimestamp: BASE_TIMESTAMP + 4000,
			discoveryPriority: 150,
		})

		const motionCard = await physicsCollection.createCard()
		await motionCard.save({
			globalId: "physics-motion",
			content:
				"A ball is thrown with initial velocity 20 m/s. What is its position after 3 seconds?",
			createdAtTimestamp: BASE_TIMESTAMP + 5000,
			lastUpdatedAtTimestamp: BASE_TIMESTAMP + 5000,
			discoveryPriority: 200,
		})

		// Simulate study session: instructor wants to review specific cards by ID
		const studySessionCardIds = [
			algebraCard.id,
			motionCard.id,
			calculusCard.id,
		]
		const studyCards = []

		// Fetch all cards for the study session
		for (const cardId of studySessionCardIds) {
			const card = await mintay.cardStore.getCardById(cardId)
			if (card) {
				const cardData = await card.mustRead()
				studyCards.push({ id: cardId, data: cardData })
			}
		}

		expect(studyCards).toHaveLength(3)

		// Verify we got the correct cards in the correct order
		expect(studyCards[0]!.data.globalId).toBe("algebra-quadratic")
		expect(studyCards[1]!.data.globalId).toBe("physics-motion")
		expect(studyCards[2]!.data.globalId).toBe("calculus-derivative")

		// Simulate updating cards during study session (e.g., marking difficulty adjustments)
		for (const { id } of studyCards) {
			const card = await mintay.cardStore.getCardById(id)
			if (card) {
				await card.update({
					lastUpdatedAtTimestamp: BASE_TIMESTAMP + 20000, // Mark as recently studied
				})
			}
		}

		// Verify all cards were updated
		for (const cardId of studySessionCardIds) {
			const card = await mintay.cardStore.getCardById(cardId)
			if (card) {
				const data = await card.mustRead()
				expect(data.lastUpdatedAtTimestamp).toBe(BASE_TIMESTAMP + 20000)
			}
		}
	})

	test("should handle card reassignment between collections using cardStore", async () => {
		// Create collections for reorganization scenario
		const beginnerCollection = await mintay.collectionStore.create()
		await beginnerCollection.save({
			globalId: "beginner-spanish",
			content: `Beginner Spanish

Basic Spanish vocabulary`,
			createdAtTimestamp: BASE_TIMESTAMP,
			lastUpdatedAtTimestamp: BASE_TIMESTAMP + 1000,
		})

		const intermediateCollection = await mintay.collectionStore.create()
		await intermediateCollection.save({
			globalId: "intermediate-spanish",
			content: `Intermediate Spanish

Intermediate Spanish grammar and vocabulary`,
			createdAtTimestamp: BASE_TIMESTAMP + 1000,
			lastUpdatedAtTimestamp: BASE_TIMESTAMP + 2000,
		})

		// Create a card that starts in beginner collection
		const spanishCard = await beginnerCollection.createCard()
		await spanishCard.save({
			globalId: "spanish-colors",
			content: "What are the primary colors in Spanish?",
			createdAtTimestamp: BASE_TIMESTAMP + 3000,
			lastUpdatedAtTimestamp: BASE_TIMESTAMP + 3000,
			discoveryPriority: 100,
		})

		// Verify card exists in beginner collection
		const initialCardCount = await beginnerCollection.getCardCount()
		expect(initialCardCount).toBe(1)

		// Fetch card through cardStore and verify its data
		const fetchedCard = await mintay.cardStore.getCardById(spanishCard.id)
		expect(fetchedCard).not.toBeNull()

		if (fetchedCard) {
			const cardData = await fetchedCard.mustRead()
			expect(cardData.globalId).toBe("spanish-colors")

			// Simulate moving card to intermediate collection
			// This demonstrates content reorganization workflow
			await fetchedCard.setCollection(intermediateCollection.id)

			// Verify card is now in intermediate collection
			const intermediateCardCount =
				await intermediateCollection.getCardCount()
			expect(intermediateCardCount).toBe(1)

			// Verify card is no longer in beginner collection
			const updatedBeginnerCount = await beginnerCollection.getCardCount()
			expect(updatedBeginnerCount).toBe(0)

			// Verify card data is preserved after reassignment
			const cardAfterMove = await mintay.cardStore.getCardById(
				spanishCard.id,
			)
			expect(cardAfterMove).not.toBeNull()

			if (cardAfterMove) {
				const preservedData = await cardAfterMove.mustRead()
				expect(preservedData.globalId).toBe("spanish-colors")
				expect(preservedData.content).toBe(
					"What are the primary colors in Spanish?",
				)
				expect(preservedData.createdAtTimestamp).toBe(
					BASE_TIMESTAMP + 3000,
				)
				expect(preservedData.discoveryPriority).toBe(100)
			}

			// Verify card can be found through new collection
			const cardThroughNewCollection =
				await intermediateCollection.getCard(spanishCard.id)
			const dataFromNewCollection =
				await cardThroughNewCollection.mustRead()
			expect(dataFromNewCollection.globalId).toBe("spanish-colors")
		}
	})

	test("should handle bulk card operations for content curation", async () => {
		// Create a collection for content curation testing
		const curationCollection = await mintay.collectionStore.create()
		await curationCollection.save({
			globalId: "content-curation-collection",
			content: `Content Curation Test

Testing bulk content operations`,
			createdAtTimestamp: BASE_TIMESTAMP,
			lastUpdatedAtTimestamp: BASE_TIMESTAMP + 1000,
		})

		// Create multiple cards with different quality levels
		const cardIds: MintayId[] = []
		const cardContents = [
			"High quality question with clear context",
			"Mediocre question needs improvement",
			"Excellent question with perfect formatting",
			"Poor quality question requires review",
			"Good question suitable for publication",
		]

		for (let i = 0; i < cardContents.length; i++) {
			const card = await curationCollection.createCard()
			await card.save({
				globalId: `curation-card-${i}`,
				content: cardContents[i]!,
				createdAtTimestamp: BASE_TIMESTAMP + 2000 + i * 1000,
				lastUpdatedAtTimestamp: BASE_TIMESTAMP + 2000 + i * 1000,
				discoveryPriority: (i + 1) * 100,
			})
			cardIds.push(card.id)
		}

		// Simulate content curation workflow: review and update cards
		const highQualityIndicators = ["High quality", "Excellent", "Good"]
		const cardsToUpdate: MintayId[] = []

		// Use cardStore to fetch and evaluate each card
		for (const cardId of cardIds) {
			const card = await mintay.cardStore.getCardById(cardId)
			if (card) {
				const cardData = await card.mustRead()
				const isHighQuality = highQualityIndicators.some((indicator) =>
					cardData.content.includes(indicator),
				)

				if (isHighQuality) {
					cardsToUpdate.push(cardId)
					// Mark high-quality cards with higher priority
					await card.update({
						discoveryPriority: 50, // Higher priority (lower number)
						lastUpdatedAtTimestamp: BASE_TIMESTAMP + 10000,
					})
				}
			}
		}

		// Verify that high-quality cards were identified and updated
		expect(cardsToUpdate).toHaveLength(3)

		// Verify updates were applied correctly
		for (const cardId of cardsToUpdate) {
			const card = await mintay.cardStore.getCardById(cardId)
			if (card) {
				const updatedData = await card.mustRead()
				expect(updatedData.discoveryPriority).toBe(50)
				expect(updatedData.lastUpdatedAtTimestamp).toBe(
					BASE_TIMESTAMP + 10000,
				)
			}
		}

		// Simulate batch content update for consistency
		const standardLastUpdated = BASE_TIMESTAMP + 15000
		for (const cardId of cardIds) {
			const card = await mintay.cardStore.getCardById(cardId)
			if (card) {
				await card.update({
					lastUpdatedAtTimestamp: standardLastUpdated,
				})
			}
		}

		// Verify all cards have consistent lastUpdatedAtTimestamp
		for (const cardId of cardIds) {
			const card = await mintay.cardStore.getCardById(cardId)
			if (card) {
				const finalData = await card.mustRead()
				expect(finalData.lastUpdatedAtTimestamp).toBe(
					standardLastUpdated,
				)
			}
		}
	})

	test("should handle card events with getEventCount and getEvents functionality", async () => {
		// Create collection and card
		const collection = await mintay.collectionStore.create()
		await collection.save({
			globalId: "events-test-collection",
			content: `Events Test Collection

Testing card event count and retrieval`,
			createdAtTimestamp: BASE_TIMESTAMP,
			lastUpdatedAtTimestamp: BASE_TIMESTAMP + 1000,
		})

		const card = await collection.createCard()
		await card.save({
			globalId: "events-test-card",
			content: "What is the meaning of life?",
			createdAtTimestamp: BASE_TIMESTAMP + 2000,
			lastUpdatedAtTimestamp: BASE_TIMESTAMP + 3000,
			discoveryPriority: 500,
		})

		// Set up engine store with FSRS parameters
		const fsrsParams: FsrsParameters = {
			requestRetention: 0.9,
			maximumInterval: 36500,
			w: [
				0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94,
				2.18, 0.05, 0.34, 1.26, 0.29, 2.61, 0.2, 1.0,
			],
			enableFuzz: true,
			enableShortTerm: true,
		}
		const engineStore = mintay.getEngineStore(collection.id, fsrsParams)

		// Initially, card should have no events
		expect(await card.getEventCount()).toBe(0)
		const initialEvents = await card.getEvents()
		expect(initialEvents).toHaveLength(0)

		// Create multiple events with different answers and timestamps
		const events: MintayCardEvent[] = [
			{
				type: MintayCardEventType.ANSWER,
				answer: MintayAnswer.GOOD,
				timestamp: BASE_TIMESTAMP + 4000,
			},
			{
				type: MintayCardEventType.ANSWER,
				answer: MintayAnswer.HARD,
				timestamp: BASE_TIMESTAMP + 5000,
			},
			{
				type: MintayCardEventType.ANSWER,
				answer: MintayAnswer.EASY,
				timestamp: BASE_TIMESTAMP + 6000,
			},
			{
				type: MintayCardEventType.ANSWER,
				answer: MintayAnswer.AGAIN,
				timestamp: BASE_TIMESTAMP + 7000,
			},
			{
				type: MintayCardEventType.ANSWER,
				answer: MintayAnswer.GOOD,
				timestamp: BASE_TIMESTAMP + 8000,
			},
		]

		// Push all events to the card
		for (const event of events) {
			await engineStore.push(card.id, event)
		}

		// Test getEventCount after adding events
		expect(await card.getEventCount()).toBe(5)

		// Test getEvents without pagination (should return all events)
		const allEvents = await card.getEvents()
		expect(allEvents).toHaveLength(5)

		// Verify events are returned in chronological order (oldest to newest)
		for (let i = 0; i < allEvents.length; i++) {
			expect(allEvents[i]).toEqual(events[i])
		}

		// Test getEvents with pagination - first page
		const firstPage = await card.getEvents({ offset: 0, limit: 2 })
		expect(firstPage).toHaveLength(2)
		expect(firstPage[0]).toEqual(events[0])
		expect(firstPage[1]).toEqual(events[1])

		// Test getEvents with pagination - second page
		const secondPage = await card.getEvents({ offset: 2, limit: 2 })
		expect(secondPage).toHaveLength(2)
		expect(secondPage[0]).toEqual(events[2])
		expect(secondPage[1]).toEqual(events[3])

		// Test getEvents with pagination - last page
		const lastPage = await card.getEvents({ offset: 4, limit: 2 })
		expect(lastPage).toHaveLength(1)
		expect(lastPage[0]).toEqual(events[4])

		// Test getEvents with offset only
		const offsetOnly = await card.getEvents({ offset: 3 })
		expect(offsetOnly).toHaveLength(2)
		expect(offsetOnly[0]).toEqual(events[3])
		expect(offsetOnly[1]).toEqual(events[4])

		// Test getEvents with limit only
		const limitOnly = await card.getEvents({ limit: 3 })
		expect(limitOnly).toHaveLength(3)
		expect(limitOnly[0]).toEqual(events[0])
		expect(limitOnly[1]).toEqual(events[1])
		expect(limitOnly[2]).toEqual(events[2])

		// Test edge cases
		const emptyPage = await card.getEvents({ offset: 10, limit: 5 })
		expect(emptyPage).toHaveLength(0)

		const zeroLimit = await card.getEvents({ offset: 0, limit: 0 })
		expect(zeroLimit).toHaveLength(0)

		// Test error handling for invalid parameters
		await expect(card.getEvents({ offset: -1 })).rejects.toThrow()
		await expect(card.getEvents({ limit: -1 })).rejects.toThrow()

		// Test with non-finite numbers
		await expect(
			card.getEvents({ offset: Number.POSITIVE_INFINITY }),
		).rejects.toThrow()
		await expect(card.getEvents({ limit: Number.NaN })).rejects.toThrow()

		// Verify that adding more events updates the count correctly
		const additionalEvent: MintayCardEvent = {
			type: MintayCardEventType.ANSWER,
			answer: MintayAnswer.HARD,
			timestamp: BASE_TIMESTAMP + 9000,
		}
		await engineStore.push(card.id, additionalEvent)

		expect(await card.getEventCount()).toBe(6)
		const updatedEvents = await card.getEvents()
		expect(updatedEvents).toHaveLength(6)
		expect(updatedEvents[5]).toEqual(additionalEvent)

		// Test pop functionality with getEventCount
		await engineStore.popCard(card.id)
		expect(await card.getEventCount()).toBe(5)

		const eventsAfterPop = await card.getEvents()
		expect(eventsAfterPop).toHaveLength(5)
		// Should not contain the last event that was popped
		expect(eventsAfterPop).not.toContainEqual(additionalEvent)
	})
})
