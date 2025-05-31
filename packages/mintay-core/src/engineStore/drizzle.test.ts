import { afterEach, beforeEach, describe, expect, test } from "vitest"
import { CardHandle, DrizzleCollectionStore } from "../cardStore"
import { MintayDrizzleDB } from "../db/db"
import { getTestingDb } from "../db/dbTest.test"
import { cardsTable } from "../db/schema"
import { CardStateReducer } from "../defines/reducer/defines"
import { CardStateExtractor } from "../defines/typings/defines"
import { TypeSpecSerializer } from "../defines/typings/serializer"
import { StorageTypeSpec } from "../defines/typings/typeSpec"
import { DrizzleEngineStore } from "./drizzle"

interface DummySpec extends StorageTypeSpec {
	cardEvent: {
		priority: number
		queue?: number
		lapses?: number
		repeats?: number
	}
	cardState: {
		value: number
		priority: number
		queue?: number
		lapses?: number
		repeats?: number
	}
	collectionHeader: {}
	cardData: {}
}

const dummyState: DummySpec["cardState"] = {
	value: 0,
	priority: Number.MAX_SAFE_INTEGER,
}

const dummyReducer: CardStateReducer<
	DummySpec["cardEvent"],
	DummySpec["cardState"]
> = {
	fold: (state, event) => ({
		...state,
		priority: event.priority,
		queue: event.queue !== undefined ? event.queue : state.queue,
		lapses: event.lapses !== undefined ? event.lapses : state.lapses,
		repeats: event.repeats !== undefined ? event.repeats : state.repeats,
	}),
	getDefaultState: () => dummyState,
}

const priorityExtractor: CardStateExtractor<DummySpec, number> = {
	getPriority: (state) => state.priority ?? 0,
	getQueue: (state) => state.queue ?? 0,
	getStats: (state) => {
		const { lapses = 0, repeats = 0 } = state

		return {
			lapses,
			repeats,
		}
	},
}

const mockSerializer: TypeSpecSerializer<DummySpec> = {
	serializeEvent: (event) => JSON.stringify(event),
	serializeState: (state) => JSON.stringify(state),
	deserializeState: (stateStr) => JSON.parse(stateStr as string),
	serializeCardData: (data) => JSON.stringify(data),
	deserializeCardData: (dataStr) => JSON.parse(dataStr as string),
	serializeCollectionHeader: (header) => JSON.stringify(header),
	deserializeCollectionHeader: (headerStr) => JSON.parse(headerStr as string),
	deserializeEvent: (eventStr) => JSON.parse(eventStr as string),
}

describe("DrizzleEngineStore", () => {
	let store: DrizzleEngineStore<DummySpec, number>
	let close: () => any
	let collectionStore: DrizzleCollectionStore<DummySpec>
	let collectionOne: any

	const createCards = async (
		count: number = 5,
	): Promise<CardHandle<DummySpec>[]> => {
		const cards: CardHandle<DummySpec>[] = []
		for (let i = 0; i < count; i++) {
			cards.push(await collectionOne.createCard())
		}
		return cards
	}

	beforeEach(async () => {
		const res = await getTestingDb()
		close = res.close
		const db = res.drizzle

		collectionStore = new DrizzleCollectionStore({
			db,
			defaultCardData: {},
			defaultCollectionHeader: {},
			serializer: mockSerializer,
		})

		collectionOne = await collectionStore.create()

		store = new DrizzleEngineStore<DummySpec, number>({
			db,
			reducer: dummyReducer,
			priorityExtractor,
			serializer: mockSerializer,
			collectionId: collectionOne.id,
		})
	})

	afterEach(async () => {
		await close()
	})

	test("push adds event and state correctly", async () => {
		const cards = await createCards()
		await store.push(cards[0].id, { priority: 1 })
		const data = await store.getCardData(cards[0].id)
		expect(data).toEqual({ ...dummyState, priority: 1 })
	})

	test("popCard removes last event and updates state", async () => {
		const cards = await createCards()
		await store.push(cards[0].id, { priority: 1 })
		await store.push(cards[0].id, { priority: 2 })
		await store.popCard(cards[0].id)
		const data = await store.getCardData(cards[0].id)
		expect(data.priority).toBe(1)
	})

	test("popCard on empty stack does nothing", async () => {
		const cards = await createCards()
		await store.popCard(cards[0].id)
		const data = await store.getCardData(cards[0].id)
		expect(data).toEqual(dummyState)
	})

	test("popCard removes card from store if last event popped", async () => {
		const cards = await createCards()
		await store.push(cards[0].id, { priority: 1 })
		await store.popCard(cards[0].id)
		const data = await store.getCardData(cards[0].id)
		expect(data).toEqual(dummyState)
	})

	test("popCard multiple times removes events in order", async () => {
		const cards = await createCards()
		await store.push(cards[0].id, { priority: 1 })
		await store.push(cards[0].id, { priority: 2 })
		await store.push(cards[0].id, { priority: 3 })

		await store.popCard(cards[0].id)
		let data = await store.getCardData(cards[0].id)
		expect(data.priority).toBe(2)

		await store.popCard(cards[0].id)
		data = await store.getCardData(cards[0].id)
		expect(data.priority).toBe(1)

		await store.popCard(cards[0].id)
		data = await store.getCardData(cards[0].id)
		expect(data).toEqual(dummyState)
	})

	test("getCardData returns default state if no data", async () => {
		const cards = await createCards()
		const data = await store.getCardData(cards[0].id)
		expect(data).toEqual(dummyState)
	})

	test("getTopCard returns card with lowest priority", async () => {
		const cards = await createCards()
		await store.push(cards[0].id, { priority: 1 })
		await store.push(cards[1].id, { priority: 3 })
		await store.push(cards[2].id, { priority: 2 })

		const topCard = await store.getTopCard(undefined)
		expect(topCard).toBe(cards[0].id)
	})

	test("getTopCard returns null if no cards", async () => {
		const topCard = await store.getTopCard(undefined)
		expect(topCard).toBeNull()
	})

	test("getTopCard returns one of lowest priority cards if tie", async () => {
		const cards = await createCards()
		await store.push(cards[0].id, { priority: 5 })
		await store.push(cards[1].id, { priority: 5 })

		const topCard = await store.getTopCard(undefined)
		expect([cards[0].id, cards[1].id]).toContain(topCard)
	})

	test("getTopCard returns correct card after popping lowest priority card", async () => {
		const cards = await createCards()
		await store.push(cards[0].id, { priority: 1 })
		await store.push(cards[1].id, { priority: 3 })
		await store.push(cards[2].id, { priority: 2 })

		let topCard = await store.getTopCard(undefined)
		expect(topCard).toBe(cards[0].id)

		await store.popCard(cards[0].id)

		topCard = await store.getTopCard(undefined)
		expect(topCard).toBe(cards[2].id)
	})

	test("getTopCard handles multiple cards with varying stack sizes", async () => {
		const cards = await createCards()
		await store.push(cards[0].id, { priority: 1 })
		await store.push(cards[0].id, { priority: 4 })
		await store.push(cards[1].id, { priority: 3 })
		await store.push(cards[2].id, { priority: 2 })

		const topCard = await store.getTopCard(undefined)
		expect(topCard).toBe(cards[2].id)
	})

	test("pop removes last pushed event from stack", async () => {
		const cards = await createCards()
		await store.push(cards[0].id, { priority: 1 })
		await store.push(cards[0].id, { priority: 2 })
		await store.pop()
		const data = await store.getCardData(cards[0].id)
		expect(data.priority).toBe(1)
	})

	test("pop does nothing if no last pushed card ids", async () => {
		const cards = await createCards()
		await store.pop()
		const data = await store.getCardData(cards[0].id)
		expect(data).toEqual(dummyState)
	})

	test("pop removes card from store if last event popped", async () => {
		const cards = await createCards()
		await store.push(cards[0].id, { priority: 1 })
		await store.pop()
		const data = await store.getCardData(cards[0].id)
		expect(data).toEqual(dummyState)
	})

	test("push and popCard interleaved multiple times", async () => {
		const cards = await createCards()
		await store.push(cards[0].id, { priority: 1 })
		await store.push(cards[0].id, { priority: 2 })
		await store.popCard(cards[0].id)
		let data = await store.getCardData(cards[0].id)
		expect(data.priority).toBe(1)

		await store.push(cards[0].id, { priority: 3 })
		data = await store.getCardData(cards[0].id)
		expect(data.priority).toBe(3)

		await store.popCard(cards[0].id)
		data = await store.getCardData(cards[0].id)
		expect(data.priority).toBe(1)

		await store.popCard(cards[0].id)
		data = await store.getCardData(cards[0].id)
		expect(data).toEqual(dummyState)
	})

	test("push multiple cards and verify states", async () => {
		const cards = await createCards()
		await store.push(cards[0].id, { priority: 1 })
		await store.push(cards[1].id, { priority: 2 })
		await store.push(cards[0].id, { priority: 3 })

		const data1 = await store.getCardData(cards[0].id)
		const data2 = await store.getCardData(cards[1].id)

		expect(data1.priority).toBe(3)
		expect(data2.priority).toBe(2)
	})

	test("popCard removes only last event for card", async () => {
		const cards = await createCards()
		await store.push(cards[0].id, { priority: 1 })
		await store.push(cards[0].id, { priority: 2 })
		await store.popCard(cards[0].id)
		const data = await store.getCardData(cards[0].id)
		expect(data.priority).toBe(1)
	})

	test("pop removes events in correct order", async () => {
		const cards = await createCards()
		await store.push(cards[0].id, { priority: 1 })
		await store.push(cards[1].id, { priority: 2 })
		await store.pop()
		let data = await store.getCardData(cards[1].id)
		expect(data).toEqual(dummyState)

		await store.pop()
		data = await store.getCardData(cards[0].id)
		expect(data).toEqual(dummyState)
	})

	test("pop with interleaved push and popCard", async () => {
		const cards = await createCards()
		await store.push(cards[0].id, { priority: 1 })
		await store.push(cards[1].id, { priority: 2 })
		await store.popCard(cards[0].id)
		await store.pop()
		const data1 = await store.getCardData(cards[0].id)
		const data2 = await store.getCardData(cards[1].id)
		expect(data1).toEqual(dummyState)
		expect(data2).toEqual(dummyState)
	})

	test("getTopCard respects queue filtering comprehensively", async () => {
		const cards = await createCards()
		await store.push(cards[0].id, { priority: 1, queue: 1 })
		await store.push(cards[1].id, { priority: 3, queue: 2 })
		await store.push(cards[2].id, { priority: 2, queue: 1 })
		await store.push(cards[3].id, { priority: 3, queue: 1 })
		await store.push(cards[4].id, { priority: 3, queue: 3 })

		let topCard = await store.getTopCard([1])
		expect([cards[0].id, cards[2].id, cards[3].id]).toContain(topCard)
		expect(topCard).toBe(cards[0].id)

		topCard = await store.getTopCard([2])
		expect(topCard).toBe(cards[1].id)

		topCard = await store.getTopCard([3])
		expect(topCard).toBe(cards[4].id)

		topCard = await store.getTopCard([4])
		expect(topCard).toBeNull()

		topCard = await store.getTopCard([])
		expect(topCard).toBeNull()

		topCard = await store.getTopCard(undefined)
		expect([cards[0].id, cards[1].id, cards[3].id, cards[4].id]).toContain(
			topCard,
		)
	})

	test("advanced push/popCard/pop and getCardData scenario for multiple cards", async () => {
		const cards = await createCards()
		await store.push(cards[0].id, { priority: 1 })
		await store.push(cards[1].id, { priority: 2 })
		await store.push(cards[2].id, { priority: 3 })

		await store.push(cards[0].id, { priority: 4 })
		await store.push(cards[1].id, { priority: 5 })

		expect(await store.getCardData(cards[0].id)).toEqual(
			expect.objectContaining({ priority: 4 }),
		)
		expect(await store.getCardData(cards[1].id)).toEqual(
			expect.objectContaining({ priority: 5 }),
		)
		expect(await store.getCardData(cards[2].id)).toEqual(
			expect.objectContaining({ priority: 3 }),
		)

		await store.popCard(cards[0].id)
		expect(await store.getCardData(cards[0].id)).toEqual(
			expect.objectContaining({ priority: 1 }),
		)

		await store.pop()
		expect(await store.getCardData(cards[1].id)).toEqual(
			expect.objectContaining({ priority: 2 }),
		)

		await store.popCard(cards[2].id)
		expect(await store.getCardData(cards[2].id)).toEqual(dummyState)

		await store.push(cards[2].id, { priority: 6 })
		expect(await store.getCardData(cards[2].id)).toEqual(
			expect.objectContaining({ priority: 6 }),
		)

		await store.pop()
		expect(await store.getCardData(cards[2].id)).toEqual(dummyState)

		await store.popCard(cards[1].id)
		expect(await store.getCardData(cards[1].id)).toEqual(dummyState)

		await store.popCard(cards[0].id)
		expect(await store.getCardData(cards[0].id)).toEqual(dummyState)

		for (const card of cards) {
			const state = await store.getCardData(card.id)
			expect(state).toEqual(dummyState)
		}
	})
})
