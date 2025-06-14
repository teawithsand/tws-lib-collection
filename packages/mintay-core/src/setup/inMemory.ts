import { CardStore, CollectionStore } from "../cardStore/defines"
import {
	InMemoryCardStore,
	InMemoryCollectionStore,
} from "../cardStore/inMemory"
import {
	CardId,
	MintayCardExtractor,
	MintayCardStateReducer,
	MintayTypeSpec,
} from "../defines"
import { MintayCardDataUtil, MintayCollectionDataUtil } from "../defines/card"
import { EngineStore } from "../engineStore"
import { InMemoryEngineStore } from "../engineStore/inMemory"
import { FsrsParameters } from "../fsrs/params"
import { InMemoryDb } from "../inMemoryDb/db"
import { Mintay } from "./defines"

export class InMemoryMintay implements Mintay {
	public readonly collectionStore: CollectionStore<MintayTypeSpec>
	public readonly cardStore: CardStore<MintayTypeSpec>
	private readonly db: InMemoryDb<MintayTypeSpec>

	constructor() {
		this.db = new InMemoryDb<MintayTypeSpec>()
		this.collectionStore = new InMemoryCollectionStore<MintayTypeSpec>({
			db: this.db,
			defaultCollectionHeader: MintayCollectionDataUtil.getDefaultData(),
			defaultCardData: MintayCardDataUtil.getDefaultData(),
		})
		this.cardStore = new InMemoryCardStore<MintayTypeSpec>({
			db: this.db,
		})
	}

	public readonly getEngineStore = (
		id: CardId,
		parameters: FsrsParameters,
	): EngineStore<MintayTypeSpec> => {
		const reducer = new MintayCardStateReducer(parameters)

		const newStore = new InMemoryEngineStore<MintayTypeSpec>({
			reducer,
			extractor: new MintayCardExtractor(),
			db: this.db,
			collectionId: id,
		})

		return newStore
	}
}
