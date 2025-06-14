import {
	CardStore,
	CollectionStore,
	DrizzleCardStore,
	DrizzleCollectionStore,
} from "../cardStore"
import { MintayDrizzleDB } from "../db/db"
import {
	MintayCardExtractor,
	MintayCardStateReducer,
	MintayTypeSpec,
	MintayTypeSpecSerializer,
} from "../defines"
import { MintayCardDataUtil, MintayCollectionDataUtil } from "../defines/card"
import { CardId } from "../defines/typings/defines"
import { DrizzleEngineStore, EngineStore } from "../engineStore"
import { FsrsParameters } from "../fsrs/params"
import { Mintay } from "./defines"

export class DrizzleMintay implements Mintay {
	public readonly collectionStore: CollectionStore<MintayTypeSpec>
	public readonly cardStore: CardStore<MintayTypeSpec>
	private readonly db: MintayDrizzleDB

	constructor({ db }: { db: MintayDrizzleDB }) {
		this.db = db
		this.collectionStore = new DrizzleCollectionStore<MintayTypeSpec>({
			db: this.db,
			defaultCollectionHeader: MintayCollectionDataUtil.getDefaultData(),
			defaultCardData: MintayCardDataUtil.getDefaultData(),
			serializer: MintayTypeSpecSerializer,
			cardExtractor: new MintayCardExtractor(),
		})
		this.cardStore = new DrizzleCardStore<MintayTypeSpec>({
			db: this.db,
			serializer: MintayTypeSpecSerializer,
			cardExtractor: new MintayCardExtractor(),
		})
	}

	public readonly getEngineStore = (
		id: CardId,
		parameters: FsrsParameters,
	): EngineStore<MintayTypeSpec> => {
		const reducer = new MintayCardStateReducer(parameters)
		const newStore = new DrizzleEngineStore<MintayTypeSpec>({
			reducer,
			db: this.db,
			collectionId: id,
			serializer: MintayTypeSpecSerializer,
			extractor: new MintayCardExtractor(),
		})

		return newStore
	}
}
