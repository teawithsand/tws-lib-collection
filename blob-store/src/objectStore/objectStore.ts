/**
 * Represents a tuple containing a Blob and its associated header metadata.
 * @template Header - The type of the header metadata.
 */
export type ObjectStoreTuple<Header> = {
	/** The binary data blob. */
	blob: Blob | null
	/** The header metadata associated with the blob. */
	header: Header | null
}

/**
 * Interface for an object store that manages blobs and their headers.
 *
 * Note: For simplicity, atomic writes of header and blobs are not supported.
 *
 * @template Header - The type of the header metadata.
 */
export interface ObjectStore<Header> {
	/**
	 * Retrieves the blob associated with the given key.
	 * @param key - The unique identifier for the blob.
	 * @returns A promise resolving to the Blob, or null if not found.
	 */
	getBlob: (key: string) => Promise<Blob | null>
	/**
	 * Stores or removes a blob for the given key.
	 * @param key - The unique identifier for the blob.
	 * @param blob - The Blob to store, or null to remove it.
	 * @returns A promise that resolves when the operation is complete.
	 */
	setBlob: (key: string, blob: Blob | null) => Promise<void>

	/**
	 * Retrieves the header metadata associated with the given key.
	 * @param key - The unique identifier for the header.
	 * @returns A promise resolving to the header, or null if not found.
	 */
	getHeader: (key: string) => Promise<Header | null>
	/**
	 * Stores or removes header metadata for the given key.
	 * @param key - The unique identifier for the header.
	 * @param header - The header to store, or null to remove it.
	 * @returns A promise that resolves when the operation is complete.
	 */
	setHeader: (key: string, header: Header | null) => Promise<void>

	/**
	 * Retrieves all keys in the object store that start with the specified prefix.
	 *
	 * It's behavior is undefined, when multiple writes are pending concurrently with this method.
	 * These keys may be included or not, however if a write has finished before this method has started,
	 * such key will be included if at least header or blob is set for it.
	 *
	 * @param prefix - The prefix to filter keys by.
	 * @returns A promise resolving to an array of matching keys.
	 */
	getKeys: (prefix: string) => Promise<string[]>

	/**
	 * Removes all blobs and headers from the object store.
	 * @returns A promise that resolves when the store has been cleared.
	 */
	clear: () => Promise<void>
}

/**
 * Interface for an object store that supports atomic operations on blobs and headers.
 *
 * Provides atomic get, set, and delete methods for managing both blob and header together.
 *
 * @template Header - The type of the header metadata.
 */
export interface AtomicObjectStore<Header> extends ObjectStore<Header> {
	/**
	 * Atomically retrieves both the blob and header associated with the given key.
	 * @param key - The unique identifier for the object.
	 * @returns A promise resolving to an ObjectStoreTuple containing the blob and header.
	 */
	get: (key: string) => Promise<ObjectStoreTuple<Header>>
	/**
	 * Atomically deletes both the blob and header associated with the given key.
	 * @param key - The unique identifier for the object.
	 * @returns A promise that resolves when the operation is complete.
	 */
	delete: (key: string) => Promise<void>
	/**
	 * Atomically sets both the blob and header for the given key.
	 * @param key - The unique identifier for the object.
	 * @param blob - The Blob to store, or null to remove it.
	 * @param header - The header to store, or null to remove it.
	 * @returns A promise that resolves when the operation is complete.
	 */
	set: (
		key: string,
		blob: Blob | null,
		header: Header | null,
	) => Promise<void>
}
