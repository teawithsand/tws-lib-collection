import {
	CardStore,
	CollectionStore,
	DrizzleCardStore,
	DrizzleCollectionStore,
} from "../cardStore"
import { MintayDrizzleDB } from "../db/db"
import { MintayCardStateReducer, MintayTypeSpec } from "../defines"
import {
	MintayCardEventVersionedType,
	MintayCardStateVersionedType,
	MintayTypeSpecParams,
} from "../defines/card"
import { CardId } from "../defines/typings/defines"
import { DrizzleEngineStore, EngineStore } from "../engineStore"
import { FsrsParameters } from "../fsrs/params"
import { Mintay, MintayParams } from "./defines"

export class DrizzleMintay<T extends MintayTypeSpecParams>
	implements Mintay<T>
{
	public readonly collectionStore: CollectionStore<MintayTypeSpec<T>>
	public readonly cardStore: CardStore<MintayTypeSpec<T>>
	private readonly db: MintayDrizzleDB
	private readonly params: MintayParams<T>

	constructor({
		db,
		params,
	}: {
		db: MintayDrizzleDB
		params: MintayParams<T>
	}) {
		this.db = db
		this.params = params
		this.collectionStore = new DrizzleCollectionStore<MintayTypeSpec<T>>({
			db: this.db,
			defaultCardDataFactory: params.defaultCardDataFactory,
			defaultCollectionDataFactory: params.defaultCollectionDataFactory,
			cardDataSerializer: params.cardDataSerializer,
			collectionDataSerializer: params.collectionDataSerializer,
			cardStateSerializer:
				MintayCardStateVersionedType.getUnknownSerializer(),
			cardEventSerializer:
				MintayCardEventVersionedType.getUnknownSerializer(),
			cardExtractor: params.cardEngineExtractor,
			collectionDataExtractor: params.collectionDataExtractor,
		})
		this.cardStore = new DrizzleCardStore<MintayTypeSpec<T>>({
			db: this.db,
			cardStateSerializer:
				MintayCardStateVersionedType.getUnknownSerializer(),
			cardEventSerializer:
				MintayCardEventVersionedType.getUnknownSerializer(),
			cardDataSerializer: params.cardDataSerializer,
			cardExtractor: params.cardEngineExtractor,
		})
	}

	public readonly getEngineStore = (
		id: CardId,
		parameters: FsrsParameters,
	): EngineStore<MintayTypeSpec<T>> => {
		const reducer = new MintayCardStateReducer(parameters)
		const newStore = new DrizzleEngineStore<MintayTypeSpec<T>>({
			reducer,
			db: this.db,
			collectionId: id,
			cardStateSerializer:
				MintayCardStateVersionedType.getUnknownSerializer(),
			cardEventSerializer:
				MintayCardEventVersionedType.getUnknownSerializer(),
			cardDataSerializer: this.params.cardDataSerializer,
			extractor: this.params.cardEngineExtractor,
		})

		return newStore
	}
}
