import { QueueLockAdapter, RwLockAdapter } from "@teawithsand/lngext"
import { CardStore, CollectionStore } from "../cardStore"
import { RwLockedCardStore } from "../cardStore/rwLocked/cardStore"
import { RwLockedCollectionStore } from "../cardStore/rwLocked/collectionStore"
import { CardId, MintayTypeSpec } from "../defines"
import { EngineStore } from "../engineStore"
import { RwLockedEngineStore } from "../engineStore/rwLocked/engineStore"
import { FsrsParameters } from "../fsrs"
import { Mintay } from "./defines"

/**
 * Thread-safe wrapper for Mintay implementations using read-write locks.
 * All stores (collection, card, engine) are wrapped with RwLocked* types to provide thread safety.
 */
export class LockingMintay implements Mintay {
	public readonly collectionStore: CollectionStore<MintayTypeSpec>
	public readonly cardStore: CardStore<MintayTypeSpec>
	private readonly mintay: Mintay
	private readonly lockAdapter: RwLockAdapter

	public static readonly wrapSafe = (mintay: Mintay) => {
		const lock = new QueueLockAdapter()
		return new LockingMintay({
			mintay,
			lockAdapter: {
				readLock: lock,
				writeLock: lock,
			},
		})
	}

	constructor({
		mintay,
		lockAdapter,
	}: {
		mintay: Mintay
		lockAdapter: RwLockAdapter
	}) {
		this.mintay = mintay
		this.lockAdapter = lockAdapter

		this.collectionStore = new RwLockedCollectionStore<MintayTypeSpec>({
			store: mintay.collectionStore,
			lockAdapter: this.lockAdapter,
		})

		this.cardStore = new RwLockedCardStore<MintayTypeSpec>({
			store: mintay.cardStore,
			lockAdapter: this.lockAdapter,
		})
	}

	public readonly getEngineStore = (
		id: CardId,
		parameters: FsrsParameters,
	): EngineStore<MintayTypeSpec> => {
		const underlyingStore = this.mintay.getEngineStore(id, parameters)
		return new RwLockedEngineStore<MintayTypeSpec>({
			store: underlyingStore,
			lockAdapter: this.lockAdapter,
		})
	}
}
