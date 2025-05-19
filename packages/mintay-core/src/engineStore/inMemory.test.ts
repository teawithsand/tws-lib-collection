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

let cards: Record<string, InMemoryCard<DummySpec>> = {}

const createStore = () => {
	cards = {}
	const db = new InMemoryDb<DummySpec>()
	const store = new InMemoryEngineStore<DummySpec, number>({
		reducer: dummyReducer,
		priorityExtractor,
		db,
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
