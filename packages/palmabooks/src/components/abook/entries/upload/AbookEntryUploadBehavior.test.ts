import { AbookStoreService } from "@/domain/abookStore/abookStoreService"
import {
	Abook,
	AbookAggregatorImpl,
	AbookEntryAggregatorImpl,
	AbookStore,
	AbookEntryData,
	InMemoryAbookStore,
	WithId,
} from "@teawithsand/booklibr"
import { createStore } from "@teawithsand/fstate"
import { DefaultClock } from "@teawithsand/lngext"
import { beforeEach, describe, expect, test, vi } from "vitest"
import {
	AbookEntryUploadBehavior,
	AbookEntryUploadTab,
} from "./AbookEntryUploadBehavior"

const createHeaderData = () => ({
	createdAt: DefaultClock.getInstance().getNow(),
	metadata: {
		title: "Test Abook",
		description: "",
		privateUserNote: "",
	},
	position: null,
})

const createMockFile = (name: string, type: string, content = "data") => {
	return new File([content], name, { type })
}

const createStubUploadService = () => {
	const createdEntries: AbookEntryData[] = []

	const abook: WithId<Abook> = {
		id: "stub-id",
		data: new Abook({
			data: {
				header: createHeaderData(),
				entries: new Map(),
			},
			aggregate: {
				totalEntries: 0,
				totalDurationMillis: 0,
			},
		}),
	}

	const service = new AbookStoreService({
		abookStore: {
			get: async () => ({
				listEntries: async () => [],
				createEntry: async (entryData: AbookEntryData) => ({
					getBlobWriter: async () => ({
						write: async () => {
							createdEntries.push(entryData)
						},
						close: async () => {},
					}),
					computeAggregate: async () => {},
				}),
				computeAggregate: async () => {},
			}),
		} as unknown as AbookStore,
	})


	return { service, createdEntries, abook }
}

const createDeferredPromise = () => {
	let resolvePromise!: () => void
	const promise = new Promise<void>((resolve) => {
		resolvePromise = resolve
	})

	return {
		promise,
		resolve: resolvePromise,
	}
}

describe("AbookEntryUploadBehavior", () => {
	let service: AbookStoreService
	let behavior: AbookEntryUploadBehavior
	let abookId: string
	let abook: WithId<Abook>
	let atomStore: ReturnType<typeof createStore>
	const createObjectURLMock = vi.fn(() => "blob:mock")

	beforeEach(async () => {
		atomStore = createStore()
		createObjectURLMock.mockClear()
		;(URL as unknown as { createObjectURL?: typeof createObjectURLMock }).createObjectURL =
			createObjectURLMock
		const abookStore = new InMemoryAbookStore({
			abookAggregator: AbookAggregatorImpl.create(),
			abookEntryAggregator: AbookEntryAggregatorImpl.create(),
		})
		service = new AbookStoreService({ abookStore })
		const abookHandle = await abookStore.createAbook(createHeaderData())
		abookId = String(abookHandle.id)
		abook = {
			id: abookHandle.id,
			data: await abookHandle.mustRead(),
		}
		behavior = new AbookEntryUploadBehavior(abook, service, abookId)
	})

	test("keeps upload tab locked while uploading", async () => {
		const files = [createMockFile("chapter.mp3", "audio/mpeg", "1234")]

		await atomStore.set(behavior.setFiles, files)

		const totalSize = await atomStore.get(behavior.totalSize)
		expect(totalSize).toBe(files[0].size)
		expect(await atomStore.get(behavior.activeTab)).toBe(
			AbookEntryUploadTab.FILES,
		)

		await atomStore.set(behavior.setActiveTab, AbookEntryUploadTab.UPLOAD)
		expect(await atomStore.get(behavior.activeTab)).toBe(
			AbookEntryUploadTab.UPLOAD,
		)

		const deferredUpload = createDeferredPromise()
		await atomStore.set(behavior.uploadingPromise, deferredUpload.promise)
		expect(await atomStore.get(behavior.isUploading)).toBe(true)
		await atomStore.set(behavior.setActiveTab, AbookEntryUploadTab.FILES)
		expect(await atomStore.get(behavior.activeTab)).toBe(
			AbookEntryUploadTab.UPLOAD,
		)

		deferredUpload.resolve()
		await deferredUpload.promise
		await atomStore.set(behavior.setActiveTab, AbookEntryUploadTab.FILES)
		expect(await atomStore.get(behavior.activeTab)).toBe(
			AbookEntryUploadTab.FILES,
		)
	})

	test(
		"uploads files and tracks results",
		async () => {
			const { service: stubService, createdEntries, abook: stubAbook } =
				createStubUploadService()
			const stubBehavior = new AbookEntryUploadBehavior(
				stubAbook,
				stubService,
				"stub-id",
			)
			const stubAtomStore = createStore()
			const files = [
				createMockFile("first.mp3", "audio/mpeg", "audio"),
				createMockFile("notes.txt", "text/plain", "notes"),
			]

			await stubAtomStore.set(stubBehavior.setFiles, files)
			await stubAtomStore.set(stubBehavior.startUpload)

			expect(await stubAtomStore.get(stubBehavior.uploadErrors)).toEqual([])
			expect(await stubAtomStore.get(stubBehavior.uploadedCount)).toBe(2)
			expect(await stubAtomStore.get(stubBehavior.isUploading)).toBe(false)
			expect(await stubAtomStore.get(stubBehavior.activeTab)).toBe(
				AbookEntryUploadTab.UPLOAD,
			)

			expect(createdEntries).toHaveLength(2)
			const names = createdEntries.map((entry) => entry.name)
			expect(names.sort()).toEqual(["first", "notes"])
		},
		15000,
	)

	test("captures upload errors when store is unavailable", async () => {
		const failingStore = new AbookStoreService({
			// Casting allows focusing the test on error handling without implementing the full store contract.
			abookStore: {
				get: async () => {
					throw new Error("store unavailable")
				},
			} as unknown as AbookStore,
		})
		const failingBehavior = new AbookEntryUploadBehavior(
			{
				id: "missing-id",
				data: new Abook({
					data: {
						header: createHeaderData(),
						entries: new Map(),
					},
					aggregate: {
						totalEntries: 0,
						totalDurationMillis: 0,
					},
				}),
			},
			failingStore,
			"missing-id",
		)
		const failingAtomStore = createStore()
		const files = [
			createMockFile("fail1.mp3", "audio/mpeg"),
			createMockFile("fail2.mp3", "audio/mpeg"),
		]

		await failingAtomStore.set(failingBehavior.setFiles, files)
		await failingAtomStore.set(failingBehavior.startUpload)

		const errors = await failingAtomStore.get(failingBehavior.uploadErrors)
		expect(errors).toHaveLength(2)
		expect(await failingAtomStore.get(failingBehavior.uploadedCount)).toBe(0)
		expect(await failingAtomStore.get(failingBehavior.isUploading)).toBe(false)
	})
})
