import { CollectionStore } from "../cardStore/defines/collection"
import { InMemoryCollectionStore } from "../cardStore/inMemory"
import {
	SdelkaCardQueue,
	SdelkaCardStateExtractor,
	SdelkaCardStateReducer,
	SdelkaTypeSpec,
} from "../defines"
import { SdelkaCardDataUtil, SdelkaCollectionDataUtil } from "../defines/card"
import { CardId } from "../defines/typings/cardId"
import { EngineStore } from "../engineStore"
import { InMemoryEngineStore } from "../engineStore/inMemory"
import { FsrsParameters } from "../fsrs/params"
import { InMemoryDb } from "../inMemoryDb/db"
import { Sdelka } from "./defines"

export class InMemorySdelka implements Sdelka {
	public readonly collectionStore: CollectionStore<SdelkaTypeSpec>
	private readonly db: InMemoryDb<SdelkaTypeSpec>

	constructor() {
		this.db = new InMemoryDb<SdelkaTypeSpec>()
		this.collectionStore = new InMemoryCollectionStore<SdelkaTypeSpec>({
			db: this.db,
			defaultCollectionHeader: SdelkaCollectionDataUtil.getDefaultData(),
			defaultCardData: SdelkaCardDataUtil.getDefaultData(),
		})
	}

	public readonly getEngineStore = (
		id: CardId,
		parameters: FsrsParameters,
	): EngineStore<SdelkaTypeSpec, SdelkaCardQueue> => {
		const reducer = new SdelkaCardStateReducer(parameters)
		const priorityExtractor = new SdelkaCardStateExtractor()
		const newStore = new InMemoryEngineStore<
			SdelkaTypeSpec,
			SdelkaCardQueue
		>({
			reducer,
			priorityExtractor,
			db: this.db,
			collectionId: id,
		})

		return newStore
	}
}
