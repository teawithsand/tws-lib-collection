import { beforeEach, describe, expect, test } from "vitest"
import { CardStateReducer } from "../defines/reducer/defines"
import { CardStateExtractor } from "../defines/typings/defines"
import { StorageTypeSpec } from "../defines/typings/typeSpec"
import { InMemoryCard, InMemoryDb } from "../inMemoryDb/db"
import { InMemoryEngineStore } from "./inMemory"

interface DummySpec extends StorageTypeSpec {
	cardEvent: { priority: number; queue?: number }
	cardState: { value: number; priority?: number; queue?: number }
	collectionHeader: {}
	cardData: {}
}

const dummyState: DummySpec["cardState"] = { value: 0, priority: 0 }

const dummyReducer: CardStateReducer<
	DummySpec["cardEvent"],
	DummySpec["cardState"]
> = {
	fold: (state, event) => ({
		...state,
		priority: event.priority,
		queue: event.queue !== undefined ? event.queue : state.queue,
	}),
	getDefaultState: () => dummyState,
}

const priorityExtractor: CardStateExtractor<DummySpec["cardState"], number> = {
	getPriority: (state) => state.priority ?? 0,
	getQueue: (state) => state.queue ?? 0,
	getStats: (state) => ({ lapses: 0, repeats: 0 }),
}

const collectionId = "collection1"

const createStore = () => {
	const db = new InMemoryDb<DummySpec>()
	const store = new InMemoryEngineStore<DummySpec, number>({
		reducer: dummyReducer,
		priorityExtractor,
		db,
		collectionId,
	})

	db.upsertCard("card1", { data: {}, collection: "collection1", states: [] })
	db.upsertCard("card2", { data: {}, collection: "collection1", states: [] })
	db.upsertCard("card3", { data: {}, collection: "collection1", states: [] })
	db.upsertCard("card4", { data: {}, collection: "collection1", states: [] })
	db.upsertCard("card5", { data: {}, collection: "collection1", states: [] })

	return store
}

describe("InMemoryEngineStore", () => {
	let store: InMemoryEngineStore<DummySpec, number>

	beforeEach(() => {
		store = createStore()
	})

	test("push adds event and state correctly", async () => {
		await store.push("card1", { priority: 1 })
		const data = await store.getCardData("card1")
		expect(data).toEqual({ ...dummyState, priority: 1 })
	})

	test("popCard removes last event and updates state", async () => {
		await store.push("card1", { priority: 1 })
		await store.push("card1", { priority: 2 })
		await store.popCard("card1")
		const data = await store.getCardData("card1")
		expect(data.priority).toBe(1)
	})

	test("popCard on empty stack does nothing", async () => {
		await store.popCard("card1")
		const data = await store.getCardData("card1")
		expect(data).toEqual(dummyState)
	})

	test("popCard removes card from store if last event popped", async () => {
		await store.push("card1", { priority: 1 })
		await store.popCard("card1")
		const data = await store.getCardData("card1")
		expect(data).toEqual(dummyState)
	})

	test("popCard multiple times removes events in order", async () => {
		await store.push("card1", { priority: 1 })
		await store.push("card1", { priority: 2 })
		await store.push("card1", { priority: 3 })

		await store.popCard("card1")
		let data = await store.getCardData("card1")
		expect(data.priority).toBe(2)

		await store.popCard("card1")
		data = await store.getCardData("card1")
		expect(data.priority).toBe(1)

		await store.popCard("card1")
		data = await store.getCardData("card1")
		expect(data).toEqual(dummyState)
	})

	test("getCardData returns default state if no data", async () => {
		const data = await store.getCardData("card1")
		expect(data).toEqual(dummyState)
	})

	test("getTopCard returns card with highest priority", async () => {
		await store.push("card1", { priority: 1 })
		await store.push("card2", { priority: 3 })
		await store.push("card3", { priority: 2 })

		const topCard = await store.getTopCard(undefined)
		expect(topCard).toBe("card2")
	})

	test("getTopCard returns null if no cards", async () => {
		const topCard = await store.getTopCard(undefined)
		expect(topCard).toBeNull()
	})

	test("getTopCard returns one of highest priority cards if tie", async () => {
		await store.push("card1", { priority: 5 })
		await store.push("card2", { priority: 5 })

		const topCard = await store.getTopCard(undefined)
		expect(["card1", "card2"]).toContain(topCard)
	})

	test("getTopCard returns correct card after popping highest priority card", async () => {
		await store.push("card1", { priority: 1 })
		await store.push("card2", { priority: 3 })
		await store.push("card3", { priority: 2 })

		let topCard = await store.getTopCard(undefined)
		expect(topCard).toBe("card2")

		await store.popCard("card2")

		topCard = await store.getTopCard(undefined)
		expect(topCard).toBe("card3")
	})

	test("getTopCard returns null after popping all cards", async () => {
		await store.push("card1", { priority: 1 })
		await store.popCard("card1")

		const topCard = await store.getTopCard(undefined)
		expect(topCard).toBeNull()
	})

	test("getTopCard handles multiple cards with varying stack sizes", async () => {
		await store.push("card1", { priority: 1 })
		await store.push("card1", { priority: 4 })
		await store.push("card2", { priority: 3 })
		await store.push("card3", { priority: 2 })

		const topCard = await store.getTopCard(undefined)
		expect(topCard).toBe("card1")
	})

	test("pop removes last pushed event from lastPushedCardIds and stack", async () => {
		await store.push("card1", { priority: 1 })
		await store.push("card1", { priority: 2 })
		await store.pop()
		const data = await store.getCardData("card1")
		expect(data.priority).toBe(1)
	})

	test("pop does nothing if no last pushed card ids", async () => {
		await store.pop()
		const data = await store.getCardData("card1")
		expect(data).toEqual(dummyState)
	})

	test("pop removes card from store if last event popped", async () => {
		await store.push("card1", { priority: 1 })
		await store.pop()
		const data = await store.getCardData("card1")
		expect(data).toEqual(dummyState)
	})

	test("push and popCard interleaved multiple times", async () => {
		await store.push("card1", { priority: 1 })
		await store.push("card1", { priority: 2 })
		await store.popCard("card1")
		let data = await store.getCardData("card1")
		expect(data.priority).toBe(1)

		await store.push("card1", { priority: 3 })
		data = await store.getCardData("card1")
		expect(data.priority).toBe(3)

		await store.popCard("card1")
		data = await store.getCardData("card1")
		expect(data.priority).toBe(1)

		await store.popCard("card1")
		data = await store.getCardData("card1")
		expect(data).toEqual(dummyState)
	})

	test("push multiple cards and verify states", async () => {
		await store.push("card1", { priority: 1 })
		await store.push("card2", { priority: 2 })
		await store.push("card1", { priority: 3 })

		const data1 = await store.getCardData("card1")
		const data2 = await store.getCardData("card2")

		expect(data1.priority).toBe(3)
		expect(data2.priority).toBe(2)
	})

	test("popCard removes only last event for card", async () => {
		await store.push("card1", { priority: 1 })
		await store.push("card1", { priority: 2 })
		await store.popCard("card1")
		const data = await store.getCardData("card1")
		expect(data.priority).toBe(1)
	})

	test("pop removes events in correct order", async () => {
		await store.push("card1", { priority: 1 })
		await store.push("card2", { priority: 2 })
		await store.pop()
		let data = await store.getCardData("card2")
		expect(data).toEqual(dummyState)

		await store.pop()
		data = await store.getCardData("card1")
		expect(data).toEqual(dummyState)
	})

	test("pop with interleaved push and popCard", async () => {
		await store.push("card1", { priority: 1 })
		await store.push("card2", { priority: 2 })
		await store.popCard("card1")
		await store.pop()
		const data1 = await store.getCardData("card1")
		const data2 = await store.getCardData("card2")
		expect(data1).toEqual(dummyState)
		expect(data2).toEqual(dummyState)
	})

	test("concurrent pushes and pops maintain consistency", async () => {
		const promises: Promise<void>[] = []
		for (let i = 0; i < 10; i++) {
			promises.push(store.push("card1", { priority: i }))
		}
		await Promise.all(promises)

		for (let i = 0; i < 10; i++) {
			await store.pop()
		}

		const data = await store.getCardData("card1")
		expect(data).toEqual(dummyState)
	})

	test("getTopCard respects queue filtering comprehensively", async () => {
		// Push cards with queue info in state
		await store.push("card1", { priority: 1, queue: 1 })
		await store.push("card2", { priority: 3, queue: 2 })
		await store.push("card3", { priority: 2, queue: 1 })
		await store.push("card4", { priority: 3, queue: 1 })
		await store.push("card5", { priority: 3, queue: 3 })

		// Filter by queueA (queue 1), should return card4 (priority 3) or card3 (priority 2) or card1 (priority 1), card4 highest priority
		let topCard = await store.getTopCard([1])
		expect(["card4", "card3", "card1"]).toContain(topCard)
		expect(topCard).toBe("card4")

		// Filter by queueB (queue 2), should return card2
		topCard = await store.getTopCard([2])
		expect(topCard).toBe("card2")

		// Filter by queueC (queue 3), should return card5
		topCard = await store.getTopCard([3])
		expect(topCard).toBe("card5")

		// Filter by queueD (queue 4, no cards), should return null
		topCard = await store.getTopCard([4])
		expect(topCard).toBeNull()

		// Filter by empty array, should return null
		topCard = await store.getTopCard([])
		expect(topCard).toBeNull()

		// No filter (undefined), should return card2, card4 or card5 (priority 3)
		topCard = await store.getTopCard(undefined)
		expect(["card2", "card4", "card5"]).toContain(topCard)
	})
})

const collectionId2 = "collection2"

describe("InMemoryEngineStore - Mixed Collection Tests", () => {
	let db: InMemoryDb<DummySpec>
	let store1: InMemoryEngineStore<DummySpec, number>
	let store2: InMemoryEngineStore<DummySpec, number>

	beforeEach(() => {
		db = new InMemoryDb<DummySpec>()
		store1 = new InMemoryEngineStore<DummySpec, number>({
			reducer: dummyReducer,
			priorityExtractor,
			db,
			collectionId: collectionId, // "collection1"
		})
		store2 = new InMemoryEngineStore<DummySpec, number>({
			reducer: dummyReducer,
			priorityExtractor,
			db,
			collectionId: collectionId2, // "collection2"
		})

		// Add cards to the db for both collections
		db.upsertCard("card1_coll1", {
			data: {},
			collection: collectionId,
			states: [],
		})
		db.upsertCard("card2_coll1", {
			data: {},
			collection: collectionId,
			states: [],
		})
		db.upsertCard("card1_coll2", {
			data: {},
			collection: collectionId2,
			states: [],
		})
		db.upsertCard("card2_coll2", {
			data: {},
			collection: collectionId2,
			states: [],
		})
	})

	test("push to different collections updates them independently", async () => {
		await store1.push("card1_coll1", { priority: 10 })
		await store2.push("card1_coll2", { priority: 20 })

		const data1 = await store1.getCardData("card1_coll1")
		expect(data1.priority).toBe(10)

		const data2 = await store2.getCardData("card1_coll2")
		expect(data2.priority).toBe(20)

		// Expect getCardData to throw if accessing a card from another collection via the wrong store
		await expect(store1.getCardData("card1_coll2")).rejects.toThrow()
		await expect(store2.getCardData("card1_coll1")).rejects.toThrow()
	})

	test("pop operates only on the specific collection's push history", async () => {
		await store1.push("card1_coll1", { priority: 1 })
		await store1.push("card1_coll1", { priority: 2 }) // card1_coll1 state: prio 2 (via store1)
		await store2.push("card1_coll2", { priority: 3 }) // card1_coll2 state: prio 3 (via store2)

		await store1.pop() // Should pop from store1's history (card1_coll1: prio 2 -> prio 1)

		const data1_after_pop1 = await store1.getCardData("card1_coll1")
		expect(data1_after_pop1.priority).toBe(1)

		const data2_after_pop1 = await store2.getCardData("card1_coll2")
		expect(data2_after_pop1.priority).toBe(3) // Unchanged

		await store2.pop() // Should pop from store2's history (card1_coll2: prio 3 -> default)

		const data1_after_pop2 = await store1.getCardData("card1_coll1")
		expect(data1_after_pop2.priority).toBe(1) // Unchanged

		const data2_after_pop2 = await store2.getCardData("card1_coll2")
		expect(data2_after_pop2).toEqual(dummyState) // Back to default
	})

	test("getTopCard is collection-specific", async () => {
		// Collection 1
		await store1.push("card1_coll1", { priority: 3 })
		await store1.push("card2_coll1", { priority: 1 })
		// Collection 2
		await store2.push("card1_coll2", { priority: 5 })
		await store2.push("card2_coll2", { priority: 2 })

		const topCard_coll1 = await store1.getTopCard(undefined)
		expect(topCard_coll1).toBe("card1_coll1")

		const topCard_coll2 = await store2.getTopCard(undefined)
		expect(topCard_coll2).toBe("card1_coll2")
	})

	test("getTopCard with queues is collection-specific", async () => {
		// Collection 1
		await store1.push("card1_coll1", { priority: 3, queue: 101 })
		await store1.push("card2_coll1", { priority: 4, queue: 102 })
		// Collection 2
		await store2.push("card1_coll2", { priority: 5, queue: 101 })
		await store2.push("card2_coll2", { priority: 6, queue: 102 })

		let topCard = await store1.getTopCard([101])
		expect(topCard).toBe("card1_coll1")

		topCard = await store2.getTopCard([101])
		expect(topCard).toBe("card1_coll2")

		topCard = await store1.getTopCard([102])
		expect(topCard).toBe("card2_coll1")

		topCard = await store2.getTopCard([102])
		expect(topCard).toBe("card2_coll2")

		topCard = await store1.getTopCard([999]) // Non-existent queue
		expect(topCard).toBeNull()
	})

	test("popCard is collection-specific and does not affect other collections", async () => {
		await store1.push("card1_coll1", { priority: 1 })
		await store1.push("card1_coll1", { priority: 2 })
		await store2.push("card1_coll2", { priority: 3 })

		await store1.popCard("card1_coll1") // card1_coll1 state: prio 1

		const data1 = await store1.getCardData("card1_coll1")
		expect(data1.priority).toBe(1)
		const data2 = await store2.getCardData("card1_coll2")
		expect(data2.priority).toBe(3) // Unchanged

		// Try to popCard from store1 for a card in store2 (should throw due to collection mismatch in getCard)
		await expect(store1.popCard("card1_coll2")).rejects.toThrow()
	})

	test("interleaved operations across collections maintain consistency", async () => {
		await store1.push("card1_coll1", { priority: 10 })
		await store2.push("card1_coll2", { priority: 20 })

		await store1.pop() // card1_coll1 (store1) -> default
		let data1_store1 = await store1.getCardData("card1_coll1")
		expect(data1_store1).toEqual(dummyState)
		let data1_store2 = await store2.getCardData("card1_coll2")
		expect(data1_store2.priority).toBe(20)

		await store1.push("card1_coll1", { priority: 15 }) // card1_coll1 (store1) -> prio 15
		data1_store1 = await store1.getCardData("card1_coll1")
		expect(data1_store1.priority).toBe(15)

		await store2.push("card2_coll2", { priority: 25 }) // card2_coll2 (store2) -> prio 25

		await store2.pop() // card2_coll2 (store2) -> default. card1_coll2 (store2) should be next in its history.
		const data2_store2_card1 = await store2.getCardData("card1_coll2")
		expect(data2_store2_card1.priority).toBe(20)
		const data2_store2_card2 = await store2.getCardData("card2_coll2")
		expect(data2_store2_card2).toEqual(dummyState)

		// Verify store1's card is unaffected
		data1_store1 = await store1.getCardData("card1_coll1")
		expect(data1_store1.priority).toBe(15)
	})
})
