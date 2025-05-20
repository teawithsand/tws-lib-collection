import { describe, expect, test } from "vitest"
import { ABookEntry, ABookEntryDisposition } from "../../entry/entry"
import { Language } from "../../misc/language"
import { ABook } from "../abook"
import { ABookTruthSourceType } from "../truthSource"
import { ABookSerializer } from "./index"

const makeEntry = (overrides: Partial<ABookEntry> = {}): ABookEntry => ({
	disposition: ABookEntryDisposition.DESCRIPTION,
	metadata: {
		uploadMetadata: {
			fileName: "file.txt",
			lastModifiedTimestamp: 0,
			fileSize: 0,
			path: null,
		},
		audioMetadata: null,
	},
	locator: { type: 1, id: "id" },
	...overrides,
})

const makeBook = (overrides: Partial<ABook> = {}): ABook => ({
	header: {
		metadata: {
			title: "Test Title",
			author: "Test Author",
			description: "Test Description",
			language: Language.EN,
			...overrides.header?.metadata,
		},
		truthSource: {
			type: ABookTruthSourceType.INTERNAL_STORAGE,
			...overrides.header?.truthSource,
		},
		...overrides.header,
	},
	entries: overrides.entries || [],
	...overrides,
})

describe("ABookSerializer", () => {
	test("serialize and deserialize roundtrip", () => {
		const book = makeBook()
		const stored = ABookSerializer.serialize(book)
		const roundtrip = ABookSerializer.deserialize(stored)
		expect(roundtrip).toEqual(book)
	})

	test("handles empty entries", () => {
		const book = makeBook({ entries: [] })
		const stored = ABookSerializer.serialize(book)
		expect(stored.entries).toEqual([])
		const roundtrip = ABookSerializer.deserialize(stored)
		expect(roundtrip.entries).toEqual([])
	})

	test("handles custom metadata", () => {
		const book = makeBook({
			header: {
				metadata: {
					title: "Custom Title",
					author: "Custom Author",
					description: "Custom Desc",
					language: Language.FR,
				},
				truthSource: {
					type: ABookTruthSourceType.INTERNAL_STORAGE,
				},
			},
		})
		const stored = ABookSerializer.serialize(book)
		expect(stored.header.metadata.title).toBe("Custom Title")
		expect(stored.header.metadata.author).toBe("Custom Author")
		expect(stored.header.metadata.description).toBe("Custom Desc")
		const roundtrip = ABookSerializer.deserialize(stored)
		expect(roundtrip.header.metadata.language).toBe(Language.FR)
	})

	test("handles multiple entries", () => {
		const entry = makeEntry()
		const book = makeBook({ entries: [entry, entry] })
		const stored = ABookSerializer.serialize(book)
		expect(stored.entries.length).toBe(2)
		const roundtrip = ABookSerializer.deserialize(stored)
		expect(roundtrip.entries.length).toBe(2)
	})
})
