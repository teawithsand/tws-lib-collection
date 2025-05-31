import { CollectionStore, DrizzleCollectionStore } from "../cardStore"
import { MintayDrizzleDB } from "../db/db"
import {
	MintayCardQueue,
	MintayCardStateExtractor,
	MintayCardStateReducer,
	MintayTypeSpec,
	MintayTypeSpecSerializer,
} from "../defines"
import { MintayCardDataUtil, MintayCollectionDataUtil } from "../defines/card"
import { CardId } from "../defines/typings/cardId"
import { DrizzleEngineStore, EngineStore } from "../engineStore"
import { FsrsParameters } from "../fsrs/params"
import { Mintay } from "./defines"

export class DrizzleMintay implements Mintay {
	public readonly collectionStore: CollectionStore<MintayTypeSpec>
	private readonly db: MintayDrizzleDB

	constructor({ db }: { db: MintayDrizzleDB }) {
		this.db = db
		this.collectionStore = new DrizzleCollectionStore<MintayTypeSpec>({
			db: this.db,
			defaultCollectionHeader: MintayCollectionDataUtil.getDefaultData(),
			defaultCardData: MintayCardDataUtil.getDefaultData(),
			serializer: MintayTypeSpecSerializer,
		})
	}

	public readonly getEngineStore = (
		id: CardId,
		parameters: FsrsParameters,
	): EngineStore<MintayTypeSpec, MintayCardQueue> => {
		const reducer = new MintayCardStateReducer(parameters)
		const priorityExtractor = new MintayCardStateExtractor()
		const newStore = new DrizzleEngineStore<
			MintayTypeSpec,
			MintayCardQueue
		>({
			reducer,
			priorityExtractor,
			db: this.db,
			collectionId: id,
			serializer: MintayTypeSpecSerializer,
		})

		return newStore
	}
}
