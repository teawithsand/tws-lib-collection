import { WebApiError, WebApiUnsupportedError } from "./errors"

/**
 * Storage quota and usage information
 */
export interface StorageEstimate {
	readonly quota: number
	readonly usage: number
	readonly usageDetails?: Record<string, number> | undefined
}

/**
 * StorageManager method support information
 */
export interface StorageManagerSupport {
	readonly storageManager: boolean
	readonly estimate: boolean
	readonly persist: boolean
	readonly persisted: boolean
	readonly getDirectory: boolean
}

/**
 * Anti-Corruption Layer over StorageManager API.
 * Provides a clean interface to interact with browser storage management while handling
 * unsupported environments and API inconsistencies.
 */
export class StorageManagerACL {
	private constructor() {
		// Private constructor to prevent instantiation
	}

	/**
	 * Gets support information for StorageManager methods
	 * @returns Readonly, frozen object indicating which methods are supported
	 */
	public static readonly getSupport = (): StorageManagerSupport => {
		const storageManagerAvailable = (() => {
			try {
				return (
					typeof navigator !== "undefined" &&
					"storage" in navigator &&
					navigator.storage !== null
				)
			} catch {
				return false
			}
		})()

		const support = {
			storageManager: storageManagerAvailable,
			estimate:
				storageManagerAvailable && "estimate" in navigator.storage,
			persist: storageManagerAvailable && "persist" in navigator.storage,
			persisted:
				storageManagerAvailable && "persisted" in navigator.storage,
			getDirectory:
				storageManagerAvailable && "getDirectory" in navigator.storage,
		}

		return Object.freeze(support)
	}

	/**
	 * Estimates storage quota and usage for the current origin
	 * @returns Promise resolving to storage estimate information
	 * @throws WebApiUnsupportedError if StorageManager or estimate method is not available
	 * @throws WebApiError if the estimate operation fails
	 */
	public static readonly estimate = async (): Promise<StorageEstimate> => {
		const support = StorageManagerACL.getSupport()

		if (!support.storageManager) {
			throw new WebApiUnsupportedError("StorageManager is not available")
		}

		if (!support.estimate) {
			throw new WebApiUnsupportedError(
				"StorageManager.estimate() is not supported",
			)
		}

		try {
			const estimate = await navigator.storage.estimate()
			return {
				quota: estimate.quota ?? 0,
				usage: estimate.usage ?? 0,
				usageDetails: (estimate as any).usageDetails, // usageDetails may not be available in all browsers
			}
		} catch (error) {
			throw new WebApiError(`Failed to estimate storage: ${error}`)
		}
	}

	/**
	 * Requests persistent storage for the current origin
	 * @returns Promise resolving to true if persistent storage was granted, false otherwise
	 * @throws WebApiUnsupportedError if StorageManager or persist method is not available
	 * @throws WebApiError if the persist operation fails
	 */
	public static readonly persist = async (): Promise<boolean> => {
		const support = StorageManagerACL.getSupport()

		if (!support.storageManager) {
			throw new WebApiUnsupportedError("StorageManager is not available")
		}

		if (!support.persist) {
			throw new WebApiUnsupportedError(
				"StorageManager.persist() is not supported",
			)
		}

		try {
			return await navigator.storage.persist()
		} catch (error) {
			throw new WebApiError(
				`Failed to request persistent storage: ${error}`,
			)
		}
	}

	/**
	 * Checks if storage is already persistent for the current origin
	 * @returns Promise resolving to true if storage is persistent, false otherwise
	 * @throws WebApiUnsupportedError if StorageManager or persisted method is not available
	 * @throws WebApiError if the persisted operation fails
	 */
	public static readonly persisted = async (): Promise<boolean> => {
		const support = StorageManagerACL.getSupport()

		if (!support.storageManager) {
			throw new WebApiUnsupportedError("StorageManager is not available")
		}

		if (!support.persisted) {
			throw new WebApiUnsupportedError(
				"StorageManager.persisted() is not supported",
			)
		}

		try {
			return await navigator.storage.persisted()
		} catch (error) {
			throw new WebApiError(
				`Failed to check if storage is persistent: ${error}`,
			)
		}
	}

	/**
	 * Gets a reference to the origin private file system directory
	 * @returns Promise resolving to a FileSystemDirectoryHandle
	 * @throws WebApiUnsupportedError if StorageManager or getDirectory method is not available
	 * @throws WebApiError if the getDirectory operation fails
	 */
	public static readonly getDirectory =
		async (): Promise<FileSystemDirectoryHandle> => {
			const support = StorageManagerACL.getSupport()

			if (!support.storageManager) {
				throw new WebApiUnsupportedError(
					"StorageManager is not available",
				)
			}

			if (!support.getDirectory) {
				throw new WebApiUnsupportedError(
					"StorageManager.getDirectory() is not supported",
				)
			}

			try {
				return await navigator.storage.getDirectory()
			} catch (error) {
				throw new WebApiError(
					`Failed to get origin private file system directory: ${error}`,
				)
			}
		}
}
