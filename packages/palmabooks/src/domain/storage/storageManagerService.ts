import {
	atom,
	atomWithRefresh,
	loadable,
	StorageManagerACL,
	WebApiUnsupportedError,
} from "@teawithsand/fstate"

/**
 * Service for managing browser storage operations with reactive state management.
 * Wraps StorageManagerACL from fstate and provides atom-based reactive interfaces.
 */
export class StorageManagerService {
	constructor() {}

	/**
	 * Atom that loads storage estimate information (quota and usage).
	 */
	private readonly _storageEstimate = atomWithRefresh(async () => {
		const support = StorageManagerACL.getSupport()
		if (!support.estimate) {
			throw new Error("Storage estimation is not supported")
		}
		return await StorageManagerACL.estimate()
	})

	/**
	 * Loadable atom for storage estimate.
	 */
	public readonly storageEstimateLoadable = loadable(this._storageEstimate)

	/**
	 * Atom to get storage estimate.
	 */
	public readonly storageEstimate = atom(
		async (get) => await get(this._storageEstimate),
	)

	/**
	 * Atom that checks if storage is currently persisted.
	 */
	private readonly _isStoragePersisted = atomWithRefresh(async () => {
		const support = StorageManagerACL.getSupport()
		if (!support.persisted) {
			throw new Error("Storage persistence check is not supported")
		}
		return await StorageManagerACL.persisted()
	})

	/**
	 * Loadable atom for storage persistence status.
	 */
	public readonly isStoragePersistedLoadable = loadable(
		this._isStoragePersisted,
	)

	/**
	 * Atom to get storage persistence status.
	 */
	public readonly isStoragePersisted = atom(
		async (get) => await get(this._isStoragePersisted),
	)

	/**
	 * Atom to get used storage space in bytes.
	 */
	public readonly usedSpace = atom(async (get) => {
		const estimate = await get(this._storageEstimate)
		return estimate.usage
	})

	/**
	 * Atom to get total available storage space in bytes.
	 */
	public readonly totalSpace = atom(async (get) => {
		const estimate = await get(this._storageEstimate)
		return estimate.quota
	})

	/**
	 * Atom to refresh all storage data (estimate and persistence status).
	 */
	public readonly refreshStorage = atom(null, (_get, set) => {
		set(this._storageEstimate)
		set(this._isStoragePersisted)
	})

	/**
	 * Atom to request storage persistence.
	 */
	public readonly requestPersistence = atom(
		null,
		async (_get, set): Promise<boolean> => {
			const support = StorageManagerACL.getSupport()
			if (!support.persist) {
				throw new WebApiUnsupportedError(
					"Storage persistence request is not supported",
				)
			}
			const granted = await StorageManagerACL.persist()
			// Refresh persistence status after request
			set(this._isStoragePersisted)
			return granted
		},
	)
}
