import { CollectionStore, DrizzleCollectionStore } from "../cardStore"
import { DrizzleDB } from "../db/db"
import {
	SdelkaCardQueue,
	SdelkaCardStateExtractor,
	SdelkaCardStateReducer,
	SdelkaTypeSpec,
	SdelkaTypeSpecSerializer,
} from "../defines"
import { SdelkaCardDataUtil, SdelkaCollectionDataUtil } from "../defines/card"
import { CardId } from "../defines/typings/cardId"
import { DrizzleEngineStore, EngineStore } from "../engineStore"
import { FsrsParameters } from "../fsrs/params"
import { Sdelka } from "./defines"

export class DrizzleSdelka implements Sdelka {
	public readonly collectionStore: CollectionStore<SdelkaTypeSpec>
	private readonly db: DrizzleDB

	constructor({ db }: { db: DrizzleDB }) {
		this.db = db
		this.collectionStore = new DrizzleCollectionStore<SdelkaTypeSpec>({
			db: this.db,
			defaultCollectionHeader: SdelkaCollectionDataUtil.getDefaultData(),
			defaultCardData: SdelkaCardDataUtil.getDefaultData(),
			serializer: SdelkaTypeSpecSerializer,
		})
	}

	public readonly getEngineStore = (
		id: CardId,
		parameters: FsrsParameters,
	): EngineStore<SdelkaTypeSpec, SdelkaCardQueue> => {
		const reducer = new SdelkaCardStateReducer(parameters)
		const priorityExtractor = new SdelkaCardStateExtractor()
		const newStore = new DrizzleEngineStore<
			SdelkaTypeSpec,
			SdelkaCardQueue
		>({
			reducer,
			priorityExtractor,
			db: this.db,
			collectionId: id,
			serializer: SdelkaTypeSpecSerializer,
		})

		return newStore
	}
}
