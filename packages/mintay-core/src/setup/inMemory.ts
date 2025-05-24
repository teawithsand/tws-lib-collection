import { CollectionStore } from "../cardStore/defines/collection"
import { InMemoryCollectionStore } from "../cardStore/inMemory"
import {
	MintayCardQueue,
	MintayCardStateExtractor,
	MintayCardStateReducer,
	MintayTypeSpec,
} from "../defines"
import { MintayCardDataUtil, MintayCollectionDataUtil } from "../defines/card"
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
	): EngineStore<MintayTypeSpec, MintayCardQueue> => {
		const reducer = new MintayCardStateReducer(parameters)
		const priorityExtractor = new MintayCardStateExtractor()
		const newStore = new InMemoryEngineStore<
			MintayTypeSpec,
			MintayCardQueue
		>({
			reducer,
			priorityExtractor,
			db: this.db,
			collectionId: id,
		})

		return newStore
	}
}
