/**
 * Async storage interface for config persistence.
 * Storage implementations should handle encoding/decoding if needed.
 */
export interface ConfigStorage {
	/**
	 * Retrieves a value from storage by key
	 * @param key Storage key
	 * @returns Promise resolving to the stored value or null if not found
	 */
	readonly get: (key: string) => Promise<unknown | null>

	/**
	 * Stores a value in storage by key
	 * @param key Storage key
	 * @param value Value to store
	 * @returns Promise that resolves when storage is complete
	 */
	readonly set: (key: string, value: unknown) => Promise<void>

	/**
	 * Removes a value from storage by key
	 * @param key Storage key
	 * @returns Promise that resolves when removal is complete
	 */
	readonly delete: (key: string) => Promise<void>

	/**
	 * Checks if a key exists in storage
	 * @param key Storage key
	 * @returns Promise resolving to true if key exists, false otherwise
	 */
	readonly has: (key: string) => Promise<boolean>
}
