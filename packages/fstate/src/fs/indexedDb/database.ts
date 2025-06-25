import { FsErrorUnknown, FsHandleType, Path } from "../defines"

export type IndexedDbFsEntry =
	| {
			type: FsHandleType.FILE
			content: Blob
	  }
	| {
			type: FsHandleType.DIR
			children: string[] // Names of child entries to append to path
	  }

/**
 * Configuration for IndexedDB database
 */
interface IndexedDbConfig {
	readonly dbName: string
	readonly version: number
	readonly storeName: string
}

/**
 * Default configuration for the IndexedDB file system
 */
const DEFAULT_CONFIG: IndexedDbConfig = {
	dbName: "FStateIndexedDb",
	version: 1,
	storeName: "entries",
}

/**
 * Handles IndexedDB operations with proper error handling and cleanup
 */
class IndexedDbConnection {
	private db: IDBDatabase | null = null
	private openPromise: Promise<IDBDatabase> | null = null

	constructor(private readonly config: IndexedDbConfig) {}

	/**
	 * Opens the IndexedDB database with proper schema setup
	 */
	public readonly open = async (): Promise<IDBDatabase> => {
		if (
			this.db &&
			!this.db.objectStoreNames.contains(this.config.storeName)
		) {
			this.db.close()
			this.db = null
		}

		if (this.db) {
			return this.db
		}

		if (this.openPromise) {
			return this.openPromise
		}

		this.openPromise = this.createConnection()
		try {
			this.db = await this.openPromise
			return this.db
		} finally {
			this.openPromise = null
		}
	}

	/**
	 * Creates a new IndexedDB connection
	 */
	private readonly createConnection = (): Promise<IDBDatabase> => {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(
				this.config.dbName,
				this.config.version,
			)

			request.onerror = () => {
				reject(
					new FsErrorUnknown(
						`Failed to open IndexedDB: ${request.error?.message}`,
					),
				)
			}

			request.onsuccess = () => {
				resolve(request.result)
			}

			request.onupgradeneeded = () => {
				const db = request.result
				if (!db.objectStoreNames.contains(this.config.storeName)) {
					db.createObjectStore(this.config.storeName, {
						keyPath: "path",
					})
				}
			}
		})
	}

	/**
	 * Closes the database connection
	 */
	public readonly close = () => {
		if (this.db) {
			this.db.close()
			this.db = null
		}
	}
}

/**
 * Manages IndexedDB transactions with proper error handling
 */
class TransactionManager {
	constructor(private readonly connection: IndexedDbConnection) {}

	/**
	 * Executes a read operation within a transaction
	 */
	public readonly executeRead = async <T>(
		operation: (store: IDBObjectStore) => IDBRequest<T>,
	): Promise<T> => {
		const db = await this.connection.open()
		return this.executeTransaction(db, "readonly", operation)
	}

	/**
	 * Executes a write operation within a transaction
	 */
	public readonly executeWrite = async <T>(
		operation: (store: IDBObjectStore) => IDBRequest<T>,
	): Promise<T> => {
		const db = await this.connection.open()
		return this.executeTransaction(db, "readwrite", operation)
	}

	/**
	 * Executes a custom transaction with direct database access
	 */
	public readonly executeCustomTransaction = async <T>(
		mode: IDBTransactionMode,
		operation: (db: IDBDatabase) => Promise<T>,
	): Promise<T> => {
		const db = await this.connection.open()
		return operation(db)
	}

	/**
	 * Executes a transaction with the given mode
	 */
	private readonly executeTransaction = async <T>(
		db: IDBDatabase,
		mode: IDBTransactionMode,
		operation: (store: IDBObjectStore) => IDBRequest<T>,
	): Promise<T> => {
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(["entries"], mode)
			const store = transaction.objectStore("entries")
			const request = operation(store)

			request.onsuccess = () => {
				resolve(request.result)
			}

			request.onerror = () => {
				reject(
					new Error(`Transaction failed: ${request.error?.message}`),
				)
			}

			transaction.onerror = () => {
				reject(
					new Error(
						`Transaction error: ${transaction.error?.message}`,
					),
				)
			}
		})
	}
}

/**
 * Stores IndexedDB file system entries with path as the key
 */
interface StoredEntry {
	readonly path: string
	readonly entry: IndexedDbFsEntry
}

/**
 * IndexedDB-based file system database implementation
 */
export class IndexedDbFsDb {
	private readonly connection: IndexedDbConnection
	private readonly transactionManager: TransactionManager

	constructor(config: Partial<IndexedDbConfig> = {}) {
		const finalConfig = { ...DEFAULT_CONFIG, ...config }
		this.connection = new IndexedDbConnection(finalConfig)
		this.transactionManager = new TransactionManager(this.connection)
	}

	/**
	 * Creates a handle for the given path
	 */
	public readonly getHandle = (path: Path): IndexedDbFsDbHandle => {
		return new IndexedDbFsDbHandle(path, this.transactionManager)
	}

	/**
	 * Closes the database connection
	 */
	public readonly close = () => {
		this.connection.close()
	}
}

/**
 * Handle for IndexedDB file system operations on a specific path
 */
export class IndexedDbFsDbHandle {
	constructor(
		private readonly path: Path,
		private readonly transactionManager: TransactionManager,
	) {}

	public readonly name = this.path.basename() ?? ""

	/**
	 * Checks if the entry exists in the database
	 */
	public readonly isValid = async (): Promise<boolean> => {
		try {
			const result = await this.transactionManager.executeRead((store) =>
				store.get(this.path.toString()),
			)
			return result !== undefined
		} catch {
			return false
		}
	}

	/**
	 * Returns the path of this handle
	 */
	public readonly getPath = (): Path => {
		return this.path
	}

	/**
	 * Writes an entry to the database, creating it if it doesn't exist
	 */
	public readonly writeForce = async (
		entry: IndexedDbFsEntry,
	): Promise<void> => {
		const storedEntry: StoredEntry = {
			path: this.path.toString(),
			entry,
		}
		await this.transactionManager.executeWrite((store) =>
			store.put(storedEntry),
		)
	}

	/**
	 * Writes an entry to the database, throwing if it doesn't exist
	 */
	public readonly writeThrowing = async (
		entry: IndexedDbFsEntry,
	): Promise<void> => {
		const exists = await this.isValid()
		if (!exists) {
			throw new Error(
				`Entry at path ${this.path.toString()} does not exist.`,
			)
		}
		await this.writeForce(entry)
	}

	/**
	 * Writes an entry to the database, returning false if it doesn't exist
	 */
	public readonly writeFallible = async (
		entry: IndexedDbFsEntry,
	): Promise<boolean> => {
		const exists = await this.isValid()
		if (!exists) {
			return false
		}
		await this.writeForce(entry)
		return true
	}

	/**
	 * Reads an entry from the database
	 */
	public readonly read = async (): Promise<IndexedDbFsEntry | undefined> => {
		try {
			const result = await this.transactionManager.executeRead((store) =>
				store.get(this.path.toString()),
			)
			return result?.entry
		} catch {
			return undefined
		}
	}

	/**
	 * Deletes an entry from the database
	 */
	public readonly delete = async (): Promise<boolean> => {
		try {
			await this.transactionManager.executeWrite((store) =>
				store.delete(this.path.toString()),
			)
			return true
		} catch {
			return false
		}
	}

	/**
	 * Deletes all children of this path from the database
	 */
	public readonly deleteAllChildren = async (): Promise<void> => {
		const prefix = this.path.toString()

		// Get all keys that start with the prefix
		const keysToDelete = await this.getChildKeys(prefix)

		// Delete all matching entries
		if (keysToDelete.length > 0) {
			await this.transactionManager.executeCustomTransaction(
				"readwrite",
				(db) => {
					return new Promise<void>((resolve, reject) => {
						const transaction = db.transaction(
							["entries"],
							"readwrite",
						)
						const store = transaction.objectStore("entries")
						let pendingDeletes = keysToDelete.length

						const onDeleteComplete = () => {
							pendingDeletes--
							if (pendingDeletes === 0) {
								resolve()
							}
						}

						for (const key of keysToDelete) {
							const deleteRequest = store.delete(key)
							deleteRequest.onsuccess = onDeleteComplete
							deleteRequest.onerror = () => {
								reject(
									new Error(
										`Failed to delete key ${key}: ${deleteRequest.error?.message}`,
									),
								)
							}
						}

						transaction.onerror = () => {
							reject(
								new Error(
									`Transaction error: ${transaction.error?.message}`,
								),
							)
						}
					})
				},
			)
		}
	}

	/**
	 * Gets all keys that are children of the given prefix
	 */
	private readonly getChildKeys = async (
		prefix: string,
	): Promise<string[]> => {
		return this.transactionManager.executeCustomTransaction(
			"readonly",
			(db) => {
				return new Promise<string[]>((resolve, reject) => {
					const transaction = db.transaction(["entries"], "readonly")
					const store = transaction.objectStore("entries")
					const keys: string[] = []
					const request = store.openCursor()

					request.onsuccess = () => {
						const cursor = request.result
						if (cursor) {
							const key = cursor.key as string
							if (key.startsWith(prefix)) {
								keys.push(key)
							}
							cursor.continue()
						} else {
							resolve(keys)
						}
					}

					request.onerror = () => {
						reject(
							new Error(
								`Failed to get child keys: ${request.error?.message}`,
							),
						)
					}

					transaction.onerror = () => {
						reject(
							new Error(
								`Transaction error: ${transaction.error?.message}`,
							),
						)
					}
				})
			},
		)
	}
}
