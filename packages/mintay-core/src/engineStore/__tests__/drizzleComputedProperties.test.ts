import { eq } from "drizzle-orm"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { DrizzleCardHandle } from "../../cardStore/drizzle/cardHandle"
import { MintayDrizzleDB } from "../../db"
import { getTestingDb } from "../../db/dbTest.test"
import { cardCollectionsTable, cardsTable } from "../../db/schema"
import { CardStats } from "../../defines/card/cardStats"
import { CardStateReducer } from "../../defines/reducer/defines"
import { CardExtractor } from "../../defines/typings/defines"
import { CardIdUtil } from "../../defines/typings/internalCardIdUtil"
import { TypeSpecSerializer } from "../../defines/typings/serializer"
import { StorageTypeSpec } from "../../defines/typings/typeSpec"
import { DrizzleEngineStore } from "../drizzle"

enum TestQueue {
	NEW = 0,
	LEARNING = 1,
	REVIEW = 2,
}

interface TestCardData extends Record<string, unknown> {
	basePriority: number
}

interface TestCardState extends Record<string, unknown> {
	reviews: number
	failures: number
	duePriority: number
	queue: TestQueue
}

interface TestCardEvent extends Record<string, unknown> {
	success: boolean
	timestamp: number
}

interface TestCollectionData extends Record<string, unknown> {
	name: string
}

interface TestTypeSpec extends StorageTypeSpec {
	cardData: TestCardData
	cardState: TestCardState
	cardEvent: TestCardEvent
	collectionData: TestCollectionData
	queue: TestQueue
}

// Simplified test implementations
const extractor: CardExtractor<TestTypeSpec> = {
	getPriority: (state, data) => state?.duePriority ?? data.basePriority,
	getQueue: (state) => state?.queue ?? TestQueue.NEW,
	getStats: (state): CardStats => ({
		repeats: state?.reviews ?? 0,
		lapses: state?.failures ?? 0,
	}),
}

const reducer: CardStateReducer<TestCardEvent, TestCardState> = {
	getDefaultState: () => ({
		reviews: 0,
		failures: 0,
		duePriority: 1000000000000 + 86400000,
		queue: TestQueue.NEW,
	}),
	fold: (state, event) => {
		const newReviews = state.reviews + 1
		const newFailures = event.success ? state.failures : state.failures + 1

		// Calculate new queue
		let newQueue: TestQueue
		if (event.success) {
			newQueue =
				state.queue === TestQueue.NEW
					? TestQueue.LEARNING
					: TestQueue.REVIEW
		} else {
			newQueue =
				state.queue === TestQueue.NEW
					? TestQueue.NEW
					: TestQueue.LEARNING
		}

		// Calculate new priority
		const newDuePriority = event.success
			? event.timestamp + 86400000 * Math.max(1, newReviews - newFailures)
			: event.timestamp + 600000

		return {
			reviews: newReviews,
			failures: newFailures,
			duePriority: newDuePriority,
			queue: newQueue,
		}
	},
}

const serializer: TypeSpecSerializer<TestTypeSpec> = {
	serializeCardData: (data) => ({ basePriority: data.basePriority }),
	deserializeCardData: (data: any) => ({ basePriority: data.basePriority }),
	serializeCollectionHeader: (data) => ({ name: data.name }),
	deserializeCollectionHeader: (data: any) => ({ name: data.name }),
	serializeState: (state) => state,
	deserializeState: (data: any) => data,
	serializeEvent: (event) => event,
	deserializeEvent: (data: any) => data,
}

describe("Drizzle Computed Properties", () => {
	let db: MintayDrizzleDB
	let cleanup: () => Promise<void>

	beforeAll(async () => {
		const testDb = await getTestingDb()
		db = testDb.drizzle as MintayDrizzleDB
		cleanup = testDb.close
	})

	afterAll(async () => {
		await cleanup()
	})

	test("should set queue and priority correctly when saving card data with no events", async () => {
		// Arrange
		const collectionId = CardIdUtil.toNumber(1)
		const cardId = CardIdUtil.toNumber(2)
		const testCardData: TestCardData = { basePriority: 5000 }

		// Create collection first
		await db
			.insert(cardCollectionsTable)
			.values({
				id: collectionId,
				collectionHeader: serializer.serializeCollectionHeader({
					name: "Test Collection",
				}),
			})
			.run()

		const cardHandle = new DrizzleCardHandle<TestTypeSpec>({
			id: cardId,
			db,
			serializer,
			collectionId,
			cardExtractor: extractor,
		})

		// Act
		await cardHandle.save(testCardData)

		// Assert
		const savedCard = await db
			.select()
			.from(cardsTable)
			.where(eq(cardsTable.id, CardIdUtil.toNumber(cardId)))
			.get()

		expect(savedCard).toBeTruthy()
		expect(savedCard!.queue).toBe(TestQueue.NEW) // Should be NEW queue for no state
		expect(savedCard!.priority).toBe(testCardData.basePriority) // Should use basePriority when no state
		expect(savedCard!.repeats).toBe(0) // Should be 0 for no events
		expect(savedCard!.lapses).toBe(0) // Should be 0 for no events

		// Verify serialized data
		const deserializedData = serializer.deserializeCardData(
			savedCard!.cardData,
		)
		expect(deserializedData.basePriority).toBe(testCardData.basePriority)
	})

	test("should set queue and priority correctly when updating card data with no events", async () => {
		// Arrange
		const collectionId = CardIdUtil.toNumber(3)
		const cardId = CardIdUtil.toNumber(4)
		const initialCardData: TestCardData = { basePriority: 3000 }
		const updatedCardData: Partial<TestCardData> = { basePriority: 7000 }

		// Create collection first
		await db
			.insert(cardCollectionsTable)
			.values({
				id: collectionId,
				collectionHeader: serializer.serializeCollectionHeader({
					name: "Test Collection Update",
				}),
			})
			.run()

		const cardHandle = new DrizzleCardHandle<TestTypeSpec>({
			id: cardId,
			db,
			serializer,
			collectionId,
			cardExtractor: extractor,
		})

		// Create initial card
		await cardHandle.save(initialCardData)

		// Act
		await cardHandle.update(updatedCardData)

		// Assert
		const updatedCard = await db
			.select()
			.from(cardsTable)
			.where(eq(cardsTable.id, CardIdUtil.toNumber(cardId)))
			.get()

		expect(updatedCard).toBeTruthy()
		expect(updatedCard!.queue).toBe(TestQueue.NEW) // Should remain NEW queue for no state
		expect(updatedCard!.priority).toBe(updatedCardData.basePriority) // Should use updated basePriority when no state
		expect(updatedCard!.repeats).toBe(0) // Should remain 0 for no events
		expect(updatedCard!.lapses).toBe(0) // Should remain 0 for no events

		// Verify serialized data
		const deserializedData = serializer.deserializeCardData(
			updatedCard!.cardData,
		)
		expect(deserializedData.basePriority).toBe(updatedCardData.basePriority)
	})

	test("should update state correctly when events are pushed to existing card", async () => {
		// Arrange
		const collectionId = CardIdUtil.toNumber(5)
		const cardId = CardIdUtil.toNumber(6)
		const testCardData: TestCardData = { basePriority: 4000 }
		const currentTime = Date.now()

		// Create collection first
		await db
			.insert(cardCollectionsTable)
			.values({
				id: collectionId,
				collectionHeader: serializer.serializeCollectionHeader({
					name: "Test Collection Events",
				}),
			})
			.run()

		const cardHandle = new DrizzleCardHandle<TestTypeSpec>({
			id: cardId,
			db,
			serializer,
			collectionId,
			cardExtractor: extractor,
		})

		// Create initial card
		await cardHandle.save(testCardData)

		const engineStore = new DrizzleEngineStore<TestTypeSpec>({
			db,
			reducer,
			extractor,
			serializer,
			collectionId,
		})

		const successEvent: TestCardEvent = {
			success: true,
			timestamp: currentTime,
		}
		const failureEvent: TestCardEvent = {
			success: false,
			timestamp: currentTime + 1000,
		}
		const secondSuccessEvent: TestCardEvent = {
			success: true,
			timestamp: currentTime + 2000,
		}

		// Act
		await engineStore.push(cardId, successEvent)
		await engineStore.push(cardId, failureEvent)
		await engineStore.push(cardId, secondSuccessEvent)

		// Assert
		const finalCard = await db
			.select()
			.from(cardsTable)
			.where(eq(cardsTable.id, CardIdUtil.toNumber(cardId)))
			.get()

		expect(finalCard).toBeTruthy()
		expect(finalCard!.queue).toBe(TestQueue.REVIEW) // Should transition to REVIEW after multiple events
		expect(finalCard!.priority).toBe(currentTime + 2000 + 86400000 * 2) // Should use timestamp + 2 days (3 reviews - 1 failure)
		expect(finalCard!.repeats).toBe(3) // Should have 3 reviews
		expect(finalCard!.lapses).toBe(1) // Should have 1 failure
	})

	test("should compute queue and priority correctly when saving card data with existing events", async () => {
		// Arrange
		const collectionId = CardIdUtil.toNumber(7)
		const cardId = CardIdUtil.toNumber(8)
		const initialCardData: TestCardData = { basePriority: 6000 }
		const newCardData: TestCardData = { basePriority: 8000 }
		const currentTime = Date.now()

		// Create collection first
		await db
			.insert(cardCollectionsTable)
			.values({
				id: collectionId,
				collectionHeader: serializer.serializeCollectionHeader({
					name: "Test Collection Save With Events",
				}),
			})
			.run()

		const cardHandle = new DrizzleCardHandle<TestTypeSpec>({
			id: cardId,
			db,
			serializer,
			collectionId,
			cardExtractor: extractor,
		})

		// Create initial card and add events
		await cardHandle.save(initialCardData)

		const engineStore = new DrizzleEngineStore<TestTypeSpec>({
			db,
			reducer,
			extractor,
			serializer,
			collectionId,
		})

		const successEvent: TestCardEvent = {
			success: true,
			timestamp: currentTime,
		}
		const failureEvent: TestCardEvent = {
			success: false,
			timestamp: currentTime + 1000,
		}

		await engineStore.push(cardId, successEvent)
		await engineStore.push(cardId, failureEvent)

		// Act - Save new card data over existing card with events
		await cardHandle.save(newCardData)

		// Assert
		const savedCard = await db
			.select()
			.from(cardsTable)
			.where(eq(cardsTable.id, CardIdUtil.toNumber(cardId)))
			.get()

		expect(savedCard).toBeTruthy()
		expect(savedCard!.queue).toBe(TestQueue.LEARNING) // Should use computed state from events
		expect(savedCard!.priority).toBe(currentTime + 1000 + 600000) // Should use computed priority from last failure event
		expect(savedCard!.repeats).toBe(2) // Should have 2 reviews from events
		expect(savedCard!.lapses).toBe(1) // Should have 1 failure from events

		// Verify card data is updated but computed properties use state from events
		const deserializedData = serializer.deserializeCardData(
			savedCard!.cardData,
		)
		expect(deserializedData.basePriority).toBe(newCardData.basePriority)
	})

	test("should compute queue and priority correctly when updating card data with existing events", async () => {
		// Arrange
		const collectionId = CardIdUtil.toNumber(9)
		const cardId = CardIdUtil.toNumber(10)
		const initialCardData: TestCardData = { basePriority: 7000 }
		const updatedCardData: Partial<TestCardData> = { basePriority: 9000 }
		const currentTime = Date.now()

		// Create collection first
		await db
			.insert(cardCollectionsTable)
			.values({
				id: collectionId,
				collectionHeader: serializer.serializeCollectionHeader({
					name: "Test Collection Update With Events",
				}),
			})
			.run()

		const cardHandle = new DrizzleCardHandle<TestTypeSpec>({
			id: cardId,
			db,
			serializer,
			collectionId,
			cardExtractor: extractor,
		})

		// Create initial card and add events
		await cardHandle.save(initialCardData)

		const engineStore = new DrizzleEngineStore<TestTypeSpec>({
			db,
			reducer,
			extractor,
			serializer,
			collectionId,
		})

		const firstSuccessEvent: TestCardEvent = {
			success: true,
			timestamp: currentTime,
		}
		const secondSuccessEvent: TestCardEvent = {
			success: true,
			timestamp: currentTime + 1000,
		}

		await engineStore.push(cardId, firstSuccessEvent)
		await engineStore.push(cardId, secondSuccessEvent)

		// Act - Update card data over existing card with events
		await cardHandle.update(updatedCardData)

		// Assert
		const updatedCard = await db
			.select()
			.from(cardsTable)
			.where(eq(cardsTable.id, CardIdUtil.toNumber(cardId)))
			.get()

		expect(updatedCard).toBeTruthy()
		expect(updatedCard!.queue).toBe(TestQueue.REVIEW) // Should use computed state from events
		expect(updatedCard!.priority).toBe(currentTime + 1000 + 86400000 * 2) // Should use computed priority from events (2 successful reviews)
		expect(updatedCard!.repeats).toBe(2) // Should have 2 reviews from events
		expect(updatedCard!.lapses).toBe(0) // Should have 0 failures from events

		// Verify card data is updated but computed properties use state from events
		const deserializedData = serializer.deserializeCardData(
			updatedCard!.cardData,
		)
		expect(deserializedData.basePriority).toBe(updatedCardData.basePriority)
	})
})
