import { InMemoryAtomicObjectStore } from "@teawithsand/blob-store"
import { beforeEach, describe, expect, test } from "vitest"
import { ABook, ABookHeader } from "../defines/abook/abook"
import { ABookTruthSourceType } from "../defines/abook/truthSource"
import { ABookEntry, ABookEntryDisposition } from "../defines/entry/entry"
import { Language } from "../defines/misc/language"
import { ABookStore } from "./abookStore"
import { InMemoryAbookStore } from "./inMemoryAbookStore"
import { ObjectStoreABookStore } from "./objectStoreABookStore"

// Helper to create a valid ABookEntry
const makeEntry = (): ABookEntry => ({
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
})

// Helper to create a valid ABookHeader
const makeHeader = (): ABookHeader => ({
	metadata: {
		title: "Test Title",
		author: "Test Author",
		description: "Test Description",
		language: Language.EN,
	},
	truthSource: {
		type: ABookTruthSourceType.INTERNAL_STORAGE,
	},
})

// Helper to create a large entry array for testing performance
const makeManyEntries = (count: number): ABookEntry[] => {
	const entries: ABookEntry[] = []
	for (let i = 0; i < count; i++) {
		entries.push({
			...makeEntry(),
			locator: { type: 1, id: `id-${i}` },
		})
	}
	return entries
}

// Common test suite for ABookStore implementations
const runABookStoreTests = (name: string, createStore: () => ABookStore) => {
	describe(name, () => {
		let abookStore: ABookStore
		const abook: ABook = {
			header: makeHeader(),
			entries: [makeEntry(), makeEntry()]
		}
		const abook2: ABook = {
			header: makeHeader(),
			entries: [makeEntry()]
		}

		beforeEach(() => {
			abookStore = createStore()
		})

		test("save and get abook", async () => {
			await abookStore.saveABook("id1", abook)
			const result = await abookStore.getABook("id1")
			expect(result).toEqual(abook)
		})

		test("getABooks returns all books", async () => {
			await abookStore.saveABook("id1", abook)
			await abookStore.saveABook("id2", abook2)
			const books = await abookStore.getABooks()
			expect(books).toHaveLength(2)
			const ids = books.map(b => b.id)
			expect(ids).toContain("id1")
			expect(ids).toContain("id2")
		})

		test("deleteABook removes the book", async () => {
			await abookStore.saveABook("id1", abook)
			await abookStore.deleteABook("id1")
			const result = await abookStore.getABook("id1")
			expect(result).toBeNull()
		})

		test("getABook returns null for missing id", async () => {
			const result = await abookStore.getABook("missing")
			expect(result).toBeNull()
		})

		// Additional tests
		test("save and overwrite an existing book", async () => {
			await abookStore.saveABook("id1", abook)
			
			const updatedBook = {
				header: {
					...abook.header,
					metadata: {
						...abook.header.metadata,
						title: "Updated Title"
					}
				},
				entries: [...abook.entries]
			}
			
			await abookStore.saveABook("id1", updatedBook)
			const result = await abookStore.getABook("id1")
			expect(result).toEqual(updatedBook)
			expect(result?.header.metadata.title).toBe("Updated Title")
		})

		test("save and get book with empty entries array", async () => {
			const emptyBook: ABook = {
				header: makeHeader(),
				entries: []
			}
			
			await abookStore.saveABook("empty", emptyBook)
			const result = await abookStore.getABook("empty")
			expect(result).toEqual(emptyBook)
			expect(result?.entries).toHaveLength(0)
		})

		test("deleteABook on non-existent book doesn't throw", async () => {
			await expect(abookStore.deleteABook("non-existent")).resolves.not.toThrow()
		})
		
		test("getABooks returns empty array when no books exist", async () => {
			const books = await abookStore.getABooks()
			expect(books).toEqual([])
		})

		test("handles special characters in ID", async () => {
			const specialId = "special/chars?#id"
			await abookStore.saveABook(specialId, abook)
			const result = await abookStore.getABook(specialId)
			expect(result).toEqual(abook)
		})
		
		test("handles book with many entries", async () => {
			const largeBook: ABook = {
				header: makeHeader(),
				entries: makeManyEntries(100)
			}
			
			await abookStore.saveABook("large", largeBook)
			const result = await abookStore.getABook("large")
			expect(result?.entries.length).toBe(100)
		})
		
		test("saves and retrieves multiple books correctly", async () => {
			const bookCount = 10
			const ids = Array.from({length: bookCount}, (_, i) => `multi-${i}`)
			
			// Save multiple books
			for (let i = 0; i < bookCount; i++) {
				await abookStore.saveABook(`multi-${i}`, {
					header: {
						...makeHeader(),
						metadata: {
							...makeHeader().metadata,
							title: `Book ${i}`
						}
					},
					entries: [makeEntry()]
				})
			}
			
			// Verify all books retrieved individually
			for (let i = 0; i < bookCount; i++) {
				const book = await abookStore.getABook(`multi-${i}`)
				expect(book?.header.metadata.title).toBe(`Book ${i}`)
			}
			
			// Verify getABooks returns all books
			const allBooks = await abookStore.getABooks()
			expect(allBooks.length).toBeGreaterThanOrEqual(bookCount)
			
			// Verify all books are in the returned list
			for (let i = 0; i < bookCount; i++) {
				expect(allBooks.some(b => b.id === `multi-${i}` && b.data.header.metadata.title === `Book ${i}`)).toBeTruthy()
			}
			
			// Delete all books
			for (let i = 0; i < bookCount; i++) {
				await abookStore.deleteABook(`multi-${i}`)
			}
			
			// Verify all books are deleted
			for (let i = 0; i < bookCount; i++) {
				const book = await abookStore.getABook(`multi-${i}`)
				expect(book).toBeNull()
			}
		})
	})
}

// Advanced test scenarios for ABookStore implementations
const runAdvancedABookStoreTests = (name: string, createStore: () => ABookStore) => {
	describe(`${name} - Advanced Tests`, () => {
		let abookStore: ABookStore
		
		beforeEach(() => {
			abookStore = createStore()
		})
		
		test("handles books with various languages", async () => {
			const languages = [
				Language.EN,
				Language.DE,
				Language.ES, 
				Language.FR,
				Language.IT,
				Language.JA,
				Language.KO,
				Language.PT,
				Language.RU,
				Language.ZH,
			]
			
			// Create a book for each language
			for (let i = 0; i < languages.length; i++) {
				const lang = languages[i]
				const book: ABook = {
					header: {
						...makeHeader(),
						metadata: {
							...makeHeader().metadata,
							language: lang,
							title: `Book in ${lang}`,
						}
					},
					entries: [makeEntry()]
				}
				
				await abookStore.saveABook(`lang-${lang}`, book)
			}
			
			// Verify each book's language was stored correctly
			for (let i = 0; i < languages.length; i++) {
				const lang = languages[i]
				const book = await abookStore.getABook(`lang-${lang}`)
				expect(book?.header.metadata.language).toBe(lang)
				expect(book?.header.metadata.title).toBe(`Book in ${lang}`)
			}
		})
		
		test("handles very large book with extensive content", async () => {
			// Create a book with 1000 entries and lengthy metadata
			const largeBook: ABook = {
				header: {
					metadata: {
						title: "A".repeat(1000), // Long title
						author: "B".repeat(1000), // Long author
						description: "C".repeat(5000), // Very long description
						language: Language.EN,
					},
					truthSource: {
						type: ABookTruthSourceType.INTERNAL_STORAGE,
					},
				},
				entries: makeManyEntries(1000), // 1000 entries
			}
			
			await abookStore.saveABook("very-large", largeBook)
			const result = await abookStore.getABook("very-large")
			
			expect(result?.header.metadata.title).toBe("A".repeat(1000))
			expect(result?.header.metadata.author).toBe("B".repeat(1000))
			expect(result?.header.metadata.description).toBe("C".repeat(5000))
			expect(result?.entries.length).toBe(1000)
		})
		
		test("handles saving and retrieving book with Unicode characters", async () => {
			const unicodeBook: ABook = {
				header: {
					...makeHeader(),
					metadata: {
						...makeHeader().metadata,
						title: "Unicode测试书📚",
						author: "测试作者👨‍💻",
						description: "This is a 测试 with emoji 🎉🎊🔥",
					},
				},
				entries: [makeEntry()],
			}
			
			await abookStore.saveABook("unicode-id-📚", unicodeBook)
			const result = await abookStore.getABook("unicode-id-📚")
			
			expect(result?.header.metadata.title).toBe("Unicode测试书📚")
			expect(result?.header.metadata.author).toBe("测试作者👨‍💻")
			expect(result?.header.metadata.description).toBe("This is a 测试 with emoji 🎉🎊🔥")
		})
		
		test("handles large number of entries per book", async () => {
			// Create a book with 500 entries
			const largeBook: ABook = {
				header: makeHeader(),
				entries: makeManyEntries(500)
			}
			
			await abookStore.saveABook("large-entries", largeBook)
			const retrieved = await abookStore.getABook("large-entries")
			
			expect(retrieved?.entries.length).toBe(500)
			
			// Verify first and last entries
			const firstEntry = retrieved?.entries[0];
			const lastEntry = retrieved?.entries[499];
			
			expect(firstEntry?.locator).toMatchObject({ type: 1, id: "id-0" });
			expect(lastEntry?.locator).toMatchObject({ type: 1, id: "id-499" });
		})
	})
}

// Performance and stress tests
const runPerformanceTests = (name: string, createStore: () => ABookStore) => {
	describe(`${name} - Performance Tests`, () => {
		let abookStore: ABookStore
		
		beforeEach(() => {
			abookStore = createStore()
		})
		
		test("can handle batch operations with many books", async () => {
			const booksToCreate = 50
			
			// Batch save
			for (let i = 0; i < booksToCreate; i++) {
				await abookStore.saveABook(`perf-${i}`, {
					header: {
						...makeHeader(),
						metadata: {
							...makeHeader().metadata,
							title: `Book ${i}`,
							author: `Author ${i}`,
							description: `Description for book ${i}`.repeat(10),
						}
					},
					entries: makeManyEntries(5) // 5 entries per book
				})
			}
			
			// Verify all books are present
			const allBooks = await abookStore.getABooks()
			expect(allBooks.length).toBeGreaterThanOrEqual(booksToCreate)
			
			// Batch read
			for (let i = 0; i < booksToCreate; i++) {
				const book = await abookStore.getABook(`perf-${i}`)
				expect(book).not.toBeNull()
				expect(book?.header.metadata.title).toBe(`Book ${i}`)
			}
			
			// Batch delete every other book
			for (let i = 0; i < booksToCreate; i += 2) {
				await abookStore.deleteABook(`perf-${i}`)
			}
			
			// Verify deletion
			const remainingBooks = await abookStore.getABooks()
			expect(remainingBooks.length).toBe(Math.ceil(booksToCreate / 2))
			
			// Odd-numbered books should still exist
			for (let i = 1; i < booksToCreate; i += 2) {
				const book = await abookStore.getABook(`perf-${i}`)
				expect(book).not.toBeNull()
			}
		})
	})
}

// Implementation-specific tests for ObjectStoreABookStore
describe("ObjectStoreABookStore - Implementation specific", () => {
	let store: InMemoryAtomicObjectStore<void>
	let abookStore: ObjectStoreABookStore
	
	beforeEach(() => {
		store = new InMemoryAtomicObjectStore<void>()
		abookStore = new ObjectStoreABookStore({ store })
	})
	
	test("correctly serializes and deserializes to/from the store", async () => {
		const book: ABook = {
			header: makeHeader(),
			entries: [makeEntry(), makeEntry()]
		}
		
		await abookStore.saveABook("test-id", book)
		
		// Inspect raw blob in the store to verify JSON serialization
		const blob = await store.getBlob("test-id")
		expect(blob).not.toBeNull()
		
		if (blob) {
			const text = await blob.text()
			const storedData = JSON.parse(text)
			
			// Verify stored data structure
			expect(storedData).toHaveProperty("version")
			expect(storedData).toHaveProperty("header")
			expect(storedData).toHaveProperty("entries")
			expect(storedData.header.metadata.title).toBe(book.header.metadata.title)
			expect(storedData.entries).toHaveLength(2)
		}
	})
	
	test("handles invalid JSON blob gracefully", async () => {
		// Create an invalid blob
		const invalidBlob = new Blob(["not valid JSON"], { type: "application/json" })
		await store.setBlob("invalid-json", invalidBlob)
		
		// Try to get the book
		const result = await abookStore.getABook("invalid-json")
		expect(result).toBeNull()
	})
	
	test("store clear impacts the ABookStore", async () => {
		// Add some books
		await abookStore.saveABook("book1", { header: makeHeader(), entries: [makeEntry()] })
		await abookStore.saveABook("book2", { header: makeHeader(), entries: [makeEntry()] })
		
		// Clear the underlying store
		await store.clear()
		
		// Check that books are gone
		expect(await abookStore.getABook("book1")).toBeNull()
		expect(await abookStore.getABook("book2")).toBeNull()
		expect((await abookStore.getABooks()).length).toBe(0)
	})
})

// Implementation-specific tests for InMemoryAbookStore
describe("InMemoryAbookStore - Implementation specific", () => {
	let abookStore: InMemoryAbookStore
	
	beforeEach(() => {
		abookStore = new InMemoryAbookStore()
	})
	
	test("stores and retrieves without serialization", async () => {
		const book: ABook = {
			header: makeHeader(),
			entries: [makeEntry()]
		}
		
		await abookStore.saveABook("test-id", book)
		
		// Modify the original book after saving
		book.header.metadata.title = "Changed Title"
		
		// Retrieve stored book should not reflect changes to the original object
		const storedBook = await abookStore.getABook("test-id")
		expect(storedBook?.header.metadata.title).toBe("Test Title")
	})
})

// Run all tests against both implementations
runABookStoreTests("InMemoryAbookStore", () => new InMemoryAbookStore())
runAdvancedABookStoreTests("InMemoryAbookStore", () => new InMemoryAbookStore())
runPerformanceTests("InMemoryAbookStore", () => new InMemoryAbookStore())

runABookStoreTests("ObjectStoreABookStore", () => {
	const store = new InMemoryAtomicObjectStore<void>()
	return new ObjectStoreABookStore({ store })
})
runAdvancedABookStoreTests("ObjectStoreABookStore", () => {
	const store = new InMemoryAtomicObjectStore<void>()
	return new ObjectStoreABookStore({ store })
})
runPerformanceTests("ObjectStoreABookStore", () => {
	const store = new InMemoryAtomicObjectStore<void>()
	return new ObjectStoreABookStore({ store })
})