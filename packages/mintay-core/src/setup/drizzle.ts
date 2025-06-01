import { CollectionStore, DrizzleCollectionStore } from "../cardStore"
import { MintayDrizzleDB } from "../db/db"
import {
	MintayCardStateExtractor,
	MintayCardStateReducer,
	MintayTypeSpec,
	MintayTypeSpecSerializer,
} from "../defines"
import {
	MintayCardDataExtractor,
	MintayCardDataUtil,
	MintayCollectionDataUtil,
} from "../defines/card"
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
			cardDataExtractor: new MintayCardDataExtractor(),
		})
	}

	public readonly getEngineStore = (
		id: CardId,
		parameters: FsrsParameters,
	): EngineStore<MintayTypeSpec> => {
		const reducer = new MintayCardStateReducer(parameters)
		const stateExtractor = new MintayCardStateExtractor()
		const dataExtractor = new MintayCardDataExtractor()
		const newStore = new DrizzleEngineStore<MintayTypeSpec>({
			reducer,
			stateExtractor,
			dataExtractor,
			db: this.db,
			collectionId: id,
			serializer: MintayTypeSpecSerializer,
		})

		return newStore
	}
}
