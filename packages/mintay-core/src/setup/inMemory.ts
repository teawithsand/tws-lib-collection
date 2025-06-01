import { CollectionStore } from "../cardStore/defines/collection"
import { InMemoryCollectionStore } from "../cardStore/inMemory"
import {
	MintayCardStateExtractor,
	MintayCardStateReducer,
	MintayTypeSpec,
} from "../defines"
import {
	MintayCardDataExtractor,
	MintayCardDataUtil,
	MintayCollectionDataUtil,
} from "../defines/card"
import { CardId } from "../defines/typings/cardId"
import { EngineStore } from "../engineStore"
import { InMemoryEngineStore } from "../engineStore/inMemory"
import { FsrsParameters } from "../fsrs/params"
import { InMemoryDb } from "../inMemoryDb/db"
import { Mintay } from "./defines"

export class InMemoryMintay implements Mintay {
	public readonly collectionStore: CollectionStore<MintayTypeSpec>
	private readonly db: InMemoryDb<MintayTypeSpec>

	constructor() {
		this.db = new InMemoryDb<MintayTypeSpec>()
		this.collectionStore = new InMemoryCollectionStore<MintayTypeSpec>({
			db: this.db,
			defaultCollectionHeader: MintayCollectionDataUtil.getDefaultData(),
			defaultCardData: MintayCardDataUtil.getDefaultData(),
		})
	}

	public readonly getEngineStore = (
		id: CardId,
		parameters: FsrsParameters,
	): EngineStore<MintayTypeSpec> => {
		const reducer = new MintayCardStateReducer(parameters)
		const stateExtractor = new MintayCardStateExtractor()
		const dataExtractor = new MintayCardDataExtractor()

		const newStore = new InMemoryEngineStore<MintayTypeSpec>({
			reducer,
			stateExtractor,
			dataExtractor,
			db: this.db,
			collectionId: id,
		})

		return newStore
	}
}
