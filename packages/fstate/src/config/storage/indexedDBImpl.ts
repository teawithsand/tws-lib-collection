import { ConfigStorage } from "./storage"

/**
 * IndexedDB-based config storage implementation for larger data
 */
export class IndexedDBConfigStorage implements ConfigStorage {
	private readonly dbName: string
	private readonly storeName: string
	private readonly version: number
	private db: IDBDatabase | null = null

	constructor({
		dbName = "ConfigDB",
		storeName = "config",
		version = 1,
	}: {
		dbName?: string
		storeName?: string
		version?: number
	} = {}) {
		this.dbName = dbName
		this.storeName = storeName
		this.version = version
	}

	/**
	 * Initialize the IndexedDB database
	 */
	private readonly initDB = async (): Promise<IDBDatabase> => {
		if (this.db) {
			return this.db
		}

		if (typeof indexedDB === "undefined") {
			throw new Error("IndexedDB is not available")
		}

		return new Promise((resolve, reject) => {
			const request = indexedDB.open(this.dbName, this.version)

			request.onerror = () => {
				reject(new Error(`Failed to open IndexedDB: ${request.error}`))
			}

			request.onsuccess = () => {
				this.db = request.result
				resolve(this.db)
			}

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result
				if (!db.objectStoreNames.contains(this.storeName)) {
					db.createObjectStore(this.storeName)
				}
			}
		})
	}

	public readonly get = async (key: string): Promise<unknown | null> => {
		const db = await this.initDB()

		return new Promise((resolve, reject) => {
			const transaction = db.transaction([this.storeName], "readonly")
			const store = transaction.objectStore(this.storeName)
			const request = store.get(key)

			request.onerror = () => {
				reject(
					new Error(
						`Failed to get value from IndexedDB: ${request.error}`,
					),
				)
			}

			request.onsuccess = () => {
				resolve(request.result ?? null)
			}
		})
	}

	public readonly set = async (
		key: string,
		value: unknown,
	): Promise<void> => {
		if (value === undefined) {
			throw new Error(
				"Cannot store undefined values in IndexedDB storage",
			)
		}

		const db = await this.initDB()

		return new Promise((resolve, reject) => {
			const transaction = db.transaction([this.storeName], "readwrite")
			const store = transaction.objectStore(this.storeName)
			const request = store.put(value, key)

			request.onerror = () => {
				reject(
					new Error(
						`Failed to store value in IndexedDB: ${request.error}`,
					),
				)
			}

			request.onsuccess = () => {
				resolve()
			}
		})
	}

	public readonly delete = async (key: string): Promise<void> => {
		const db = await this.initDB()

		return new Promise((resolve, reject) => {
			const transaction = db.transaction([this.storeName], "readwrite")
			const store = transaction.objectStore(this.storeName)
			const request = store.delete(key)

			request.onerror = () => {
				reject(
					new Error(
						`Failed to delete value from IndexedDB: ${request.error}`,
					),
				)
			}

			request.onsuccess = () => {
				resolve()
			}
		})
	}

	public readonly has = async (key: string): Promise<boolean> => {
		const db = await this.initDB()

		return new Promise((resolve, reject) => {
			const transaction = db.transaction([this.storeName], "readonly")
			const store = transaction.objectStore(this.storeName)
			const request = store.count(key)

			request.onerror = () => {
				reject(
					new Error(
						`Failed to check key existence in IndexedDB: ${request.error}`,
					),
				)
			}

			request.onsuccess = () => {
				resolve(request.result > 0)
			}
		})
	}

	/**
	 * Close the IndexedDB connection
	 */
	public readonly close = (): void => {
		if (this.db) {
			this.db.close()
			this.db = null
		}
	}
}
