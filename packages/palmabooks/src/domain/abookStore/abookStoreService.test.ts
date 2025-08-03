import {
	AbookAggregatorImpl,
	AbookEntryAggregatorImpl,
	AbookHeaderData,
	InMemoryAbookStore,
} from "@teawithsand/booklibr"
import { createStore } from "@teawithsand/fstate"
import { DefaultClock } from "@teawithsand/lngext"
import { beforeEach, describe, expect, test } from "vitest"
import { AbookStoreService } from "./abookStoreService"

describe("AbookStoreService", () => {
	let service: AbookStoreService
	let store: InMemoryAbookStore
	let atomStore: ReturnType<typeof createStore>

	beforeEach(() => {
		atomStore = createStore()
		store = new InMemoryAbookStore({
			abookAggregator: AbookAggregatorImpl.create(),
			abookEntryAggregator: AbookEntryAggregatorImpl.create(),
		})
		service = new AbookStoreService({ abookStore: store })
	})

	const createTestAbookData = (): AbookHeaderData => ({
		createdAt: DefaultClock.getInstance().getNow(),
		metadata: {
			title: "Test Audiobook",
			description: "A test audiobook for unit testing",
			privateUserNote: "Test note",
		},
		position: null,
	})

	describe("Abooks List", () => {
		test("should initialize with empty abooks list", async () => {
			const abooksList = await atomStore.get(service.abooksList)
			expect(abooksList).toEqual([])
		})

		test("should create a new audiobook", async () => {
			const testData = createTestAbookData()
			await atomStore.set(service.createAbook, testData)
			const abooksList = await atomStore.get(service.abooksList)
			expect(abooksList).toHaveLength(1)
			expect(abooksList[0].data.data.header.metadata.title).toBe(
				"Test Audiobook",
			)
			expect(abooksList[0].data.data.header.metadata.description).toBe(
				"A test audiobook for unit testing",
			)
		})

		test("should refresh abooks list", async () => {
			const testData = createTestAbookData()
			await store.createAbook(testData)
			await atomStore.set(service.refreshAbooksList)
			const abooksList = await atomStore.get(service.abooksList)
			expect(abooksList).toHaveLength(1)
		})

		test("should handle multiple abooks", async () => {
			const testData1 = createTestAbookData()
			const testData2 = {
				...createTestAbookData(),
				metadata: {
					...createTestAbookData().metadata,
					title: "Second Audiobook",
					description: "Another test audiobook",
				},
			}
			await atomStore.set(service.createAbook, testData1)
			await atomStore.set(service.createAbook, testData2)
			const abooksList = await atomStore.get(service.abooksList)
			expect(abooksList).toHaveLength(2)
			const titles = abooksList
				.map((ab) => ab.data.data.header.metadata.title)
				.sort()
			expect(titles).toEqual(["Second Audiobook", "Test Audiobook"])
		})

		test("should handle loadable atoms correctly", async () => {
			const testData = createTestAbookData()
			await atomStore.set(service.createAbook, testData)
			await atomStore.get(service.abooksList)
			let loadableResult = atomStore.get(service.abooksListLoadable)
			if (loadableResult.state === "loading") {
				await new Promise((resolve) => setTimeout(resolve, 10))
				loadableResult = atomStore.get(service.abooksListLoadable)
			}
			expect(loadableResult.state).toBe("hasData")
			if (loadableResult.state === "hasData") {
				expect(loadableResult.data).toHaveLength(1)
				expect(
					loadableResult.data[0].data.data.header.metadata.title,
				).toBe("Test Audiobook")
			}
		})
	})

	describe("Abook Data", () => {
		test("should handle abook operations through getAbook", async () => {
			const testData = createTestAbookData()
			const handle = await store.createAbook(testData)
			const abookId = handle.id
			const abookOperations = service.getAbook(abookId)
			const abookData = await atomStore.get(abookOperations.data)
			expect(abookData).not.toBeNull()
			expect(abookData?.data.header.metadata.title).toBe("Test Audiobook")
			const abookDataWithId = await atomStore.get(
				abookOperations.dataWithId,
			)
			expect(abookDataWithId.id).toBe(abookId)
			expect(abookDataWithId.data?.data.header.metadata.title).toBe(
				"Test Audiobook",
			)
		})

		test("should update abook data", async () => {
			const testData = createTestAbookData()
			const handle = await store.createAbook(testData)
			const abookId = handle.id
			const abookOperations = service.getAbook(abookId)
			const updatedData = {
				...testData,
				metadata: {
					...testData.metadata,
					title: "Updated Title",
					description: "Updated description",
				},
			}
			await atomStore.set(abookOperations.update, { data: updatedData })
			const abookData = await atomStore.get(abookOperations.data)
			expect(abookData?.data.header.metadata.title).toBe("Updated Title")
			expect(abookData?.data.header.metadata.description).toBe(
				"Updated description",
			)
		})

		test("should delete abook", async () => {
			const testData = createTestAbookData()
			const handle = await store.createAbook(testData)
			const abookId = handle.id
			const abookOperations = service.getAbook(abookId)
			let abooksList = await atomStore.get(service.abooksList)
			expect(abooksList).toHaveLength(1)
			await atomStore.set(abookOperations.delete)
			abooksList = await atomStore.get(service.abooksList)
			expect(abooksList).toHaveLength(0)
		})

		test("should refresh abook data", async () => {
			const testData = createTestAbookData()
			const handle = await store.createAbook(testData)
			const abookId = handle.id
			const abookOperations = service.getAbook(abookId)
			let abookData = await atomStore.get(abookOperations.data)
			expect(abookData?.data.header.metadata.title).toBe("Test Audiobook")
			const updatedData = {
				...testData,
				metadata: {
					...testData.metadata,
					title: "Manually Updated Title",
				},
			}
			await handle.write({ data: updatedData })
			abookData = await atomStore.get(abookOperations.data)
			expect(abookData?.data.header.metadata.title).toBe("Test Audiobook")
			await atomStore.set(abookOperations.refresh)
			abookData = await atomStore.get(abookOperations.data)
			expect(abookData?.data.header.metadata.title).toBe(
				"Manually Updated Title",
			)
		})

		test("should handle non-existent abook data gracefully", async () => {
			const nonExistentId = "non-existent-id"
			const abookOperations = service.getAbook(nonExistentId)
			const abookData = await atomStore.get(abookOperations.data)
			expect(abookData).toBeNull()
		})

		test("should handle loadable atoms correctly", async () => {
			const testData = createTestAbookData()
			const handle = await store.createAbook(testData)
			const abookId = handle.id
			const abookOperations = service.getAbook(abookId)
			await atomStore.get(abookOperations.data)
			let abookLoadableResult = atomStore.get(
				abookOperations.dataLoadable,
			)
			if (abookLoadableResult.state === "loading") {
				await new Promise((resolve) => setTimeout(resolve, 10))
				abookLoadableResult = atomStore.get(
					abookOperations.dataLoadable,
				)
			}
			expect(abookLoadableResult.state).toBe("hasData")
			if (abookLoadableResult.state === "hasData") {
				expect(
					abookLoadableResult.data?.data.header.metadata.title,
				).toBe("Test Audiobook")
			}
		})
	})

	describe("Abook Entries", () => {
		test("should handle entries operations", async () => {
			const testData = createTestAbookData()
			const handle = await store.createAbook(testData)
			const abookId = handle.id
			const abookOperations = service.getAbook(abookId)
			const entries = await atomStore.get(abookOperations.entries)
			expect(entries).toEqual([])
		})

		test("should handle AbookNotFoundError correctly when listing entries", async () => {
			const nonExistentId = "non-existent-id"
			const abookOperations = service.getAbook(nonExistentId)
			const entries = await atomStore.get(abookOperations.entries)
			expect(entries).toEqual([])
		})

		test("should handle entries loadable atoms correctly", async () => {
			const testData = createTestAbookData()
			const handle = await store.createAbook(testData)
			const abookId = handle.id
			const abookOperations = service.getAbook(abookId)
			await atomStore.get(abookOperations.entries)
			let entriesLoadableResult = atomStore.get(
				abookOperations.entriesLoadable,
			)
			if (entriesLoadableResult.state === "loading") {
				await new Promise((resolve) => setTimeout(resolve, 10))
				entriesLoadableResult = atomStore.get(
					abookOperations.entriesLoadable,
				)
			}
			expect(entriesLoadableResult.state).toBe("hasData")
			if (entriesLoadableResult.state === "hasData") {
				expect(entriesLoadableResult.data).toEqual([])
			}
		})
	})

	describe("Abook Aggregates", () => {
		test("should compute aggregate data", async () => {
			const testData = createTestAbookData()
			const handle = await store.createAbook(testData)
			const abookId = handle.id
			const abookOperations = service.getAbook(abookId)
			let abookData = await atomStore.get(abookOperations.data)
			expect(abookData?.aggregate.totalEntries).toBe(0)
			expect(abookData?.aggregate.totalDurationMillis).toBe(0)
			await atomStore.set(abookOperations.computeAggregate)
			abookData = await atomStore.get(abookOperations.data)
			expect(abookData?.aggregate.totalEntries).toBe(0)
			expect(abookData?.aggregate.totalDurationMillis).toBe(0)
		})
	})
})
