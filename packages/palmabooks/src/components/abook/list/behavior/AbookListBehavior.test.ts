import { Abook, AbookEntry, WithId } from "@teawithsand/booklibr"
import { atom, createStore } from "@teawithsand/fstate"
import { Timestamp } from "@teawithsand/lngext"
import { describe, expect, test } from "vitest"
import { AbookListBehavior, AbookListSortField } from "./AbookListBehavior"

const createAbook = (
	title: string,
	createdAtMillis: number,
): WithId<Abook> => ({
	id: title,
	data: new Abook({
		data: {
			header: {
				createdAt: Timestamp.fromMillis(createdAtMillis),
				metadata: {
					title,
					description: `${title} description`,
					privateUserNote: `${title} note`,
				},
				position: null,
			},
			entries: new Map<string, AbookEntry>(),
		},
		aggregate: {
			totalDurationMillis: 0,
			totalEntries: 0,
		},
	}),
})

const createBehavior = (abooks: WithId<Abook>[]) => {
	const store = createStore()
	const sourceAtom = atom<Promise<WithId<Abook>[]>>(Promise.resolve(abooks))
	const behavior = new AbookListBehavior(sourceAtom)
	return { behavior, store }
}

describe("AbookListBehavior", () => {
	test("should expose sorted list in ascending order by default", async () => {
		// Arrange
		const abooks = [
			createAbook("Zebra Tales", Date.UTC(2024, 0, 1)),
			createAbook("alpha adventures", Date.UTC(2023, 0, 1)),
			createAbook("Voyager 2", Date.UTC(2022, 0, 1)),
		]
		const { behavior, store } = createBehavior(abooks)

		// Act
		const sorted = await store.get(behavior.abooks)
		let loadableState = store.get(behavior.abooksLoadable)
		if (loadableState.state === "loading") {
			await new Promise((resolve) => setTimeout(resolve, 5))
			loadableState = store.get(behavior.abooksLoadable)
		}

		// Assert
		expect(
			sorted.map((book) => book.data.data.header.metadata.title),
		).toEqual(["alpha adventures", "Voyager 2", "Zebra Tales"])
		expect(loadableState.state).toBe("hasData")
		if (loadableState.state === "hasData") {
			expect(
				loadableState.data.map(
					(book) => book.data.data.header.metadata.title,
				),
			).toEqual(["alpha adventures", "Voyager 2", "Zebra Tales"])
		}
	})

	test("should respect descending flag when sorting", async () => {
		// Arrange
		const abooks = [
			createAbook("Echoes", Date.UTC(2024, 5, 1)),
			createAbook("Beacon", Date.UTC(2023, 5, 1)),
			createAbook("Aurora", Date.UTC(2022, 5, 1)),
		]
		const { behavior, store } = createBehavior(abooks)
		await store.get(behavior.abooks)

		// Act
		store.set(behavior.abookSort, (draft) => {
			draft.desc = true
			draft.field = AbookListSortField.NAME
		})
		const sorted = await store.get(behavior.abooks)

		// Assert
		expect(
			sorted.map((book) => book.data.data.header.metadata.title),
		).toEqual(["Echoes", "Beacon", "Aurora"])
	})
})
