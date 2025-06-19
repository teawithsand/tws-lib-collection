import { CardStore, CollectionStore } from "../cardStore/defines"
import {
	InMemoryCardStore,
	InMemoryCollectionStore,
} from "../cardStore/inMemory"
import { MintayCardStateReducer, MintayId } from "../defines"
import { EngineStore } from "../engineStore"
import { InMemoryEngineStore } from "../engineStore/inMemory"
import { FsrsParameters } from "../fsrs/params"
import { InMemoryDb } from "../inMemoryDb/db"
import { Mintay, MintayParams } from "./defines"
import { MintayTypeSpec, MintayTypeSpecParams } from "./types/typeSpec"

export class InMemoryMintay<T extends MintayTypeSpecParams>
	implements Mintay<T>
{
	public readonly collectionStore: CollectionStore<MintayTypeSpec<T>>
	public readonly cardStore: CardStore<MintayTypeSpec<T>>
	private readonly db: InMemoryDb<MintayTypeSpec<T>>

	constructor(private readonly setup: MintayParams<T>) {
		this.db = new InMemoryDb<MintayTypeSpec<T>>()
		this.collectionStore = new InMemoryCollectionStore<MintayTypeSpec<T>>({
			db: this.db,
			defaultCardDataFactory: setup.defaultCardDataFactory,
			defaultCollectionDataFactory: setup.defaultCollectionDataFactory,
		})
		this.cardStore = new InMemoryCardStore<MintayTypeSpec<T>>({
			db: this.db,
		})
	}

	public readonly getEngineStore = (
		id: MintayId,
		parameters: FsrsParameters,
	): EngineStore<MintayTypeSpec<T>> => {
		const reducer = new MintayCardStateReducer(parameters)

		const newStore = new InMemoryEngineStore<MintayTypeSpec<T>>({
			reducer,
			extractor: this.setup.cardEngineExtractor,
			db: this.db,
			collectionId: id,
		})

		return newStore
	}
}
