import { deleteDB, IDBPDatabase, openDB } from "idb"
import { AtomicObjectStore, ObjectStoreTuple } from "./objectStore"

// Private per-module type for object store values

type ObjectValue<Header> =
	| { blob: Blob | null; header: Header | null }
	| undefined

/**
 * Draft IndexedDB-based implementation of AtomicObjectStore.
 * Stores blobs and headers in a single object store.
 * All methods are not implemented yet.
 */
export class IndexedDBAtomicObjectStore<Header>
	implements AtomicObjectStore<Header>
{
	private readonly dbName
	private dbPromise: Promise<IDBPDatabase> | null = null

	constructor({ dbName }: { dbName: string }) {
		this.dbName = dbName
	}

	private readonly _setupDb = async (): Promise<IDBPDatabase> => {
		if (!this.dbPromise) {
			this.dbPromise = openDB(this.dbName, 1, {
				upgrade(db) {
					if (!db.objectStoreNames.contains("objects"))
						db.createObjectStore("objects")
				},
			})
		}
		return this.dbPromise
	}

	public readonly getBlob = async (key: string): Promise<Blob | null> => {
		const db = await this._setupDb()
		const tx = db.transaction("objects", "readonly")
		const store = tx.objectStore("objects")
		const value = (await store.get(key)) as ObjectValue<Header>
		return value && "blob" in value ? (value.blob ?? null) : null
	}

	public readonly setBlob = async (
		key: string,
		blob: Blob | null,
	): Promise<void> => {
		const db = await this._setupDb()
		const tx = db.transaction("objects", "readwrite")
		const store = tx.objectStore("objects")
		const existing = (await store.get(key)) as ObjectValue<Header>
		if (blob === null) {
			if (existing && existing.header != null) {
				await store.put({ blob: null, header: existing.header }, key)
			} else {
				await store.delete(key)
			}
		} else {
			await store.put(
				{ blob, header: existing ? (existing.header ?? null) : null },
				key,
			)
		}
		await tx.done
	}

	public readonly getHeader = async (key: string): Promise<Header | null> => {
		const db = await this._setupDb()
		const tx = db.transaction("objects", "readonly")
		const store = tx.objectStore("objects")
		const value = (await store.get(key)) as ObjectValue<Header>
		return value && "header" in value ? (value.header ?? null) : null
	}

	public readonly setHeader = async (
		key: string,
		header: Header | null,
	): Promise<void> => {
		const db = await this._setupDb()
		const tx = db.transaction("objects", "readwrite")
		const store = tx.objectStore("objects")
		const existing = (await store.get(key)) as ObjectValue<Header>
		if (header === null) {
			if (existing && existing.blob != null) {
				await store.put({ blob: existing.blob, header: null }, key)
			} else {
				await store.delete(key)
			}
		} else {
			await store.put(
				{ blob: existing ? (existing.blob ?? null) : null, header },
				key,
			)
		}
		await tx.done
	}

	public readonly get = async (
		key: string,
	): Promise<ObjectStoreTuple<Header>> => {
		const db = await this._setupDb()
		const tx = db.transaction("objects", "readonly")
		const store = tx.objectStore("objects")
		const value = (await store.get(key)) as ObjectValue<Header>
		return {
			blob: value && "blob" in value ? (value.blob ?? null) : null,
			header: value && "header" in value ? (value.header ?? null) : null,
		}
	}

	public readonly delete = async (key: string): Promise<void> => {
		const db = await this._setupDb()
		const tx = db.transaction("objects", "readwrite")
		const store = tx.objectStore("objects")
		await store.delete(key)
		await tx.done
	}

	public readonly set = async (
		key: string,
		blob: Blob | null,
		header: Header | null,
	): Promise<void> => {
		const db = await this._setupDb()
		const tx = db.transaction("objects", "readwrite")
		const store = tx.objectStore("objects")
		if (blob === null && header === null) {
			await store.delete(key)
		} else {
			await store.put({ blob, header }, key)
		}
		await tx.done
	}

	/**
	 * Returns all keys in the 'objects' store that start with the given prefix.
	 * Uses an IndexedDB key range for optimal performance.
	 * @param prefix - The prefix to match keys against.
	 * @returns Promise resolving to an array of matching keys.
	 */
	public readonly getKeys = async (prefix: string): Promise<string[]> => {
		const db = await this._setupDb()
		const tx = db.transaction("objects", "readonly")
		const store = tx.objectStore("objects")
		const range = IDBKeyRange.bound(prefix, prefix + "\uffff", false, false)
		const keys = await store.getAllKeys(range)
		return keys.filter(
			(key) => typeof key === "string" && key.startsWith(prefix),
		) as string[]
	}

	/**
	 * Removes all blobs and headers from the object store.
	 * @returns Promise that resolves when the store has been cleared.
	 */
	public readonly clear = async (): Promise<void> => {
		const db = await this._setupDb()
		const tx = db.transaction("objects", "readwrite")
		await tx.objectStore("objects").clear()
		await tx.done
	}

	/**
	 * Closes the database connection.
	 */
	public readonly close = async (): Promise<void> => {
		const db = await this._setupDb()
		db.close()
	}

	/**
	 * Deletes the entire IndexedDB database for this object store.
	 * @returns Promise that resolves when the database has been deleted.
	 */
	public static readonly deleteDatabase = async (
		dbName: string,
	): Promise<void> => {
		await deleteDB(dbName)
	}
}
