import { afterEach, beforeEach, describe, expect, test } from "vitest"
import type { AtomicObjectStore, ObjectStore } from "./objectStore"

import { InMemoryAtomicObjectStore } from "./inMemoryAtomicObjectStore"
import { IndexedDBAtomicObjectStore } from "./indexedDBAtomicObjectStore"

import "fake-indexeddb/auto"

export interface ObjectStoreTestOptions<
	Header,
	Store extends ObjectStore<Header> = ObjectStore<Header>,
> {
	storeFactory: () => Store
	cleanup?: (store: Store) => Promise<void> | void
}

export function objectStoreTests<
	Header,
	Store extends ObjectStore<Header> = ObjectStore<Header>,
>({
	storeFactory,
	cleanup,
	describeText = "ObjectStore generic tests",
}: ObjectStoreTestOptions<Header, Store> & { describeText?: string }): void {
	describe(describeText, () => {
		let store: Store

		beforeEach(() => {
			store = storeFactory()
		})

		afterEach(async () => {
			if (cleanup) {
				await cleanup(store)
			}
		})

		test("setBlob and getBlob should store and retrieve blobs correctly", async () => {
			const key = "test-blob"
			const blob = new Blob(["hello world"], { type: "text/plain" })

			await store.setBlob(key, blob)
			const retrieved = await store.getBlob(key)
			expect(retrieved).not.toBeNull()
			if (retrieved) {
				const text = await retrieved.text()
				expect(text).toBe("hello world")
			}
		})

		test("setBlob with null should remove the blob", async () => {
			const key = "test-remove-blob"
			const blob = new Blob(["data"], { type: "text/plain" })

			await store.setBlob(key, blob)
			await store.setBlob(key, null)
			const retrieved = await store.getBlob(key)
			expect(retrieved).toBeNull()
		})

		test("setHeader and getHeader should store and retrieve headers correctly", async () => {
			const key = "test-header"
			const header = { foo: "bar" } as unknown as Header

			await store.setHeader(key, header)
			const retrieved = await store.getHeader(key)
			expect(retrieved).toEqual(header)
		})

		test("setHeader with null should remove the header", async () => {
			const key = "test-remove-header"
			const header = { foo: "bar" } as unknown as Header

			await store.setHeader(key, header)
			await store.setHeader(key, null)
			const retrieved = await store.getHeader(key)
			expect(retrieved).toBeNull()
		})

		test("getKeys should return keys with given prefix", async () => {
			await store.setBlob("prefix-key1", new Blob(["1"]))
			await store.setHeader("prefix-key1", { a: 1 } as unknown as Header)
			await store.setBlob("prefix-key2", new Blob(["2"]))
			await store.setHeader("prefix-key2", { a: 2 } as unknown as Header)
			await store.setBlob("other-key", new Blob(["3"]))

			const keys = await store.getKeys("prefix-")
			expect(keys).toEqual(
				expect.arrayContaining(["prefix-key1", "prefix-key2"]),
			)
			expect(keys).not.toContain("other-key")
		})

		test("clear should remove all blobs and headers", async () => {
			await store.setBlob("key1", new Blob(["1"]))
			await store.setHeader("key1", { a: 1 } as unknown as Header)
			await store.setBlob("key2", new Blob(["2"]))
			await store.setHeader("key2", { a: 2 } as unknown as Header)

			await store.clear()

			const keys = await store.getKeys("")
			expect(keys.length).toBe(0)
			const blob1 = await store.getBlob("key1")
			const header1 = await store.getHeader("key1")
			const blob2 = await store.getBlob("key2")
			const header2 = await store.getHeader("key2")

			expect(blob1).toBeNull()
			expect(header1).toBeNull()
			expect(blob2).toBeNull()
			expect(header2).toBeNull()
		})
	})
}

export interface AtomicObjectStoreTestOptions<
	Header,
	Store extends AtomicObjectStore<Header> = AtomicObjectStore<Header>,
> {
	storeFactory: () => Store
	cleanup?: (store: Store) => Promise<void> | void
}

export function atomicObjectStoreTests<
	Header,
	Store extends AtomicObjectStore<Header> = AtomicObjectStore<Header>,
>({
	storeFactory,
	cleanup,
	describeText = "AtomicObjectStore tests",
}: AtomicObjectStoreTestOptions<Header, Store> & {
	describeText?: string
}): void {
	describe(describeText, () => {
		let store: Store

		beforeEach(() => {
			store = storeFactory()
		})

		afterEach(async () => {
			if (cleanup) {
				await cleanup(store)
			}
		})

		test("atomic set and get should store and retrieve blob and header correctly", async () => {
			const key = "atomic-test"
			const blob = new Blob(["atomic data"], { type: "text/plain" })
			const header = { atomic: true } as unknown as Header

			await store.set(key, blob, header)
			const result = await store.get(key)

			expect(result.blob).not.toBeNull()
			if (result.blob) {
				const text = await result.blob.text()
				expect(text).toBe("atomic data")
			}
			expect(result.header).toEqual(header)
		})

		test("atomic set with nulls should remove blob and header", async () => {
			const key = "atomic-remove"
			const blob = new Blob(["to be removed"], { type: "text/plain" })
			const header = { remove: true } as unknown as Header

			await store.set(key, blob, header)
			await store.set(key, null, null)

			const result = await store.get(key)
			expect(result.blob).toBeNull()
			expect(result.header).toBeNull()
		})

		test("atomic delete should remove blob and header", async () => {
			const key = "atomic-delete"
			const blob = new Blob(["to delete"], { type: "text/plain" })
			const header = { delete: true } as unknown as Header

			await store.set(key, blob, header)
			await store.delete(key)

			const result = await store.get(key)
			expect(result.blob).toBeNull()
			expect(result.header).toBeNull()
		})
	})
}

objectStoreTests({
	storeFactory: () => new InMemoryAtomicObjectStore(),
	describeText: "InMemoryAtomicObjectStore atomic tests",
})
atomicObjectStoreTests({
	storeFactory: () => new InMemoryAtomicObjectStore(),
	describeText: "InMemoryAtomicObjectStore atomic tests",
})

objectStoreTests({
	storeFactory: () => new IndexedDBAtomicObjectStore({ dbName: "test-db" }),
	describeText: "IndexedDBAtomicObjectStore atomic tests",
	cleanup: async (store) => {
		await store.close()
		IndexedDBAtomicObjectStore.deleteDatabase("test-db")
	},
})

atomicObjectStoreTests({
	storeFactory: () => new IndexedDBAtomicObjectStore({ dbName: "test-db" }),
	describeText: "IndexedDBAtomicObjectStore atomic tests",
	cleanup: async (store) => {
		await store.close()
		IndexedDBAtomicObjectStore.deleteDatabase("test-db")
	},
})
