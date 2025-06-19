import { QueueLockAdapter, RwLockAdapter } from "@teawithsand/lngext"
import { CardStore, CollectionStore } from "../cardStore"
import { RwLockedCardStore } from "../cardStore/rwLocked/cardStore"
import { RwLockedCollectionStore } from "../cardStore/rwLocked/collectionStore"
import { MintayId } from "../defines"
import { EngineStore } from "../engineStore"
import { RwLockedEngineStore } from "../engineStore/rwLocked/engineStore"
import { FsrsParameters } from "../fsrs"
import { Mintay } from "./defines"
import { MintayTypeSpec, MintayTypeSpecParams } from "./types/typeSpec"

/**
 * Thread-safe wrapper for Mintay implementations using read-write locks.
 * All stores (collection, card, engine) are wrapped with RwLocked* types to provide thread safety.
 */
export class LockingMintay<T extends MintayTypeSpecParams>
	implements Mintay<T>
{
	public readonly collectionStore: CollectionStore<MintayTypeSpec<T>>
	public readonly cardStore: CardStore<MintayTypeSpec<T>>
	private readonly mintay: Mintay<T>
	private readonly lockAdapter: RwLockAdapter

	public static readonly wrapSafe = <T extends MintayTypeSpecParams>(
		mintay: Mintay<T>,
	) => {
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
		mintay: Mintay<T>
		lockAdapter: RwLockAdapter
	}) {
		this.mintay = mintay
		this.lockAdapter = lockAdapter

		this.collectionStore = new RwLockedCollectionStore<MintayTypeSpec<T>>({
			store: mintay.collectionStore,
			lockAdapter: this.lockAdapter,
		})

		this.cardStore = new RwLockedCardStore<MintayTypeSpec<T>>({
			store: mintay.cardStore,
			lockAdapter: this.lockAdapter,
		})
	}

	public readonly getEngineStore = (
		id: MintayId,
		parameters: FsrsParameters,
	): EngineStore<MintayTypeSpec<T>> => {
		const underlyingStore = this.mintay.getEngineStore(id, parameters)
		return new RwLockedEngineStore<MintayTypeSpec<T>>({
			store: underlyingStore,
			lockAdapter: this.lockAdapter,
		})
	}
}
