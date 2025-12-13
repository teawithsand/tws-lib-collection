import { AbookStoreService } from "@/domain/abookStore/abookStoreService"
import {
	AbookAggregatorImpl,
	AbookEntryAggregatorImpl,
	InMemoryAbookStore,
} from "@teawithsand/booklibr"
import { beforeEach, describe, expect, test } from "vitest"
import { AbookCreateBehavior, AbookCreateData } from "./AbookCreateBehavior"

describe("AbookCreateBehavior", () => {
	let behavior: AbookCreateBehavior
	let service: AbookStoreService
	let store: InMemoryAbookStore

	beforeEach(() => {
		store = new InMemoryAbookStore({
			abookAggregator: AbookAggregatorImpl.create(),
			abookEntryAggregator: AbookEntryAggregatorImpl.create(),
		})
		service = new AbookStoreService({ abookStore: store })
		behavior = new AbookCreateBehavior(service)
	})

	const createMockAudioFile = (
		name = "test.mp3",
		type = "audio/mpeg",
	): File => {
		return new File(["mock audio content"], name, { type })
	}

	const createMockImageFile = (
		name = "cover.jpg",
		type = "image/jpeg",
	): File => {
		return new File(["mock image content"], name, { type })
	}

	describe("createAbookWithEntries", () => {
		test("should create audiobook with single audio file", async () => {
			const data: AbookCreateData = {
				title: "Test Audiobook",
				description: "Test description",
				files: [createMockAudioFile("chapter1.mp3")],
			}

			const result = await behavior.createAbookWithEntries(data)

			expect(result.abookId).toBeDefined()
			expect(result.entriesCreated).toBe(1)
			const abooks = await store.listAbooks()
			expect(abooks).toHaveLength(1)

			const abookHandle = abooks[0]
			const abook = await abookHandle.read()
			expect(abook?.data.header.metadata.title).toBe("Test Audiobook")
			expect(abook?.data.header.metadata.description).toBe(
				"Test description",
			)

			// Verify entry was created
			const entries = await abookHandle.listEntries()
			expect(entries).toHaveLength(1)

			const entry = await entries[0].read()
			expect(entry?.data.name).toBe("chapter1")
			expect(entry?.data.disposition).toBe("playable-audio")
		})

		test("should create audiobook with multiple audio files", async () => {
			const data: AbookCreateData = {
				title: "Multi Chapter Book",
				files: [
					createMockAudioFile("chapter1.mp3"),
					createMockAudioFile("chapter2.mp3"),
					createMockAudioFile("chapter3.mp3"),
				],
			}

			const result = await behavior.createAbookWithEntries(data)

			expect(result.entriesCreated).toBe(3)

			const abooks = await store.listAbooks()
			const abookHandle = abooks[0]
			const entries = await abookHandle.listEntries()
			expect(entries).toHaveLength(3)
		})

		test("should prioritize audio files over other files", async () => {
			const data: AbookCreateData = {
				title: "Test Book",
				files: [
					createMockImageFile("cover.jpg"),
					createMockAudioFile("chapter1.mp3"),
					createMockImageFile("back.jpg"),
				],
			}

			const result = await behavior.createAbookWithEntries(data)

			expect(result.entriesCreated).toBe(3)

			const abooks = await store.listAbooks()
			const abookHandle = abooks[0]
			const entries = await abookHandle.listEntries()

			// First entry should be audio file
			const firstEntry = await entries[0].read()
			expect(firstEntry?.data.disposition).toBe("playable-audio")
		})

		test("should use filename without extension as entry title", async () => {
			const data: AbookCreateData = {
				title: "Test Book",
				files: [createMockAudioFile("chapter-001.mp3")],
			}

			const result = await behavior.createAbookWithEntries(data)

			expect(result.entriesCreated).toBe(1)

			const abooks = await store.listAbooks()
			const abookHandle = abooks[0]
			const entries = await abookHandle.listEntries()
			const entry = await entries[0].read()

			expect(entry?.data.name).toBe("chapter-001")
		})

		test("should create audiobook with no files", async () => {
			const data: AbookCreateData = {
				title: "Empty Audiobook",
				description: "Audiobook without entries yet",
				files: [],
			}

			const result = await behavior.createAbookWithEntries(data)

			expect(result.abookId).toBeDefined()
			expect(result.entriesCreated).toBe(0)

			const abooks = await store.listAbooks()
			expect(abooks).toHaveLength(1)

			const abookHandle = abooks[0]
			const abook = await abookHandle.read()
			expect(abook?.data.header.metadata.title).toBe("Empty Audiobook")

			const entries = await abookHandle.listEntries()
			expect(entries).toHaveLength(0)
		})

		test("should create audiobook with only non-audio files", async () => {
			const data: AbookCreateData = {
				title: "Image Only Book",
				files: [createMockImageFile("cover.jpg")],
			}

			const result = await behavior.createAbookWithEntries(data)

			expect(result.abookId).toBeDefined()
			expect(result.entriesCreated).toBe(1)

			const abooks = await store.listAbooks()
			const abookHandle = abooks[0]
			const entries = await abookHandle.listEntries()
			expect(entries).toHaveLength(1)

			const entry = await entries[0].read()
			expect(entry?.data.disposition).toBe("unknown")
		})

		test("should handle optional fields", async () => {
			const data: AbookCreateData = {
				title: "Minimal Book",
				files: [createMockAudioFile()],
			}

			const result = await behavior.createAbookWithEntries(data)

			expect(result.entriesCreated).toBe(1)

			const abooks = await store.listAbooks()
			const abookHandle = abooks[0]
			const abook = await abookHandle.read()

			expect(abook?.data.header.metadata.title).toBe("Minimal Book")
			expect(abook?.data.header.metadata.description).toBe("")
			expect(abook?.data.header.metadata.privateUserNote).toBe("")
		})

		test("should handle private note", async () => {
			const data: AbookCreateData = {
				title: "Book with Note",
				privateNote: "My personal note",
				files: [createMockAudioFile()],
			}

			const result = await behavior.createAbookWithEntries(data)

			expect(result.entriesCreated).toBe(1)

			const abooks = await store.listAbooks()
			const abookHandle = abooks[0]
			const abook = await abookHandle.read()

			expect(abook?.data.header.metadata.privateUserNote).toBe(
				"My personal note",
			)
		})

		test("should handle file with no MIME type", async () => {
			const fileWithoutType = new File(["content"], "unknown.xyz", {})

			const data: AbookCreateData = {
				title: "Test Book",
				files: [createMockAudioFile(), fileWithoutType],
			}

			const result = await behavior.createAbookWithEntries(data)

			expect(result.entriesCreated).toBe(2)

			const abooks = await store.listAbooks()
			const abookHandle = abooks[0]
			const entries = await abookHandle.listEntries()

			// Second entry should have default MIME type
			const secondEntry = await entries[1].read()
			if (secondEntry?.data.source.type === "upload") {
				expect(secondEntry.data.source.uploadFileMime).toBe(
					"application/octet-stream",
				)
			}
		})
	})
})
