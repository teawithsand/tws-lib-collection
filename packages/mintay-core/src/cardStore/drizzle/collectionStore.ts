import { Serializer } from "@teawithsand/reserd"
import { MintayDbUtil, MintayDrizzleDB } from "../../db/db"
import { cardCollectionsTable } from "../../db/schema"
import { CardEngineExtractor, CollectionDataExtractor } from "../../defines"
import { MintayId, MintayIdUtil } from "../../defines/id"
import { TypeSpec } from "../../defines/typeSpec"
import { CollectionHandle, CollectionStore } from "../defines/collection"
import { DrizzleCollectionHandle } from "./collectionHandle"

export class DrizzleCollectionStore<T extends TypeSpec & { queue: number }>
	implements CollectionStore<T>
{
	private readonly db: MintayDrizzleDB
	private readonly defaultCardDataFactory: () => T["cardData"]
	private readonly collectionDataSerializer: Serializer<
		unknown,
		T["collectionData"]
	>
	private readonly cardDataSerializer: Serializer<unknown, T["cardData"]>
	private readonly cardStateSerializer: Serializer<unknown, T["cardState"]>
	private readonly cardEventSerializer: Serializer<unknown, T["cardEvent"]>
	private readonly cardExtractor: CardEngineExtractor<T>
	private readonly defaultCollectionDataFactory: () => T["collectionData"]

	constructor({
		db,
		collectionDataSerializer,
		cardDataSerializer,
		cardStateSerializer,
		cardEventSerializer,
		defaultCardDataFactory,
		defaultCollectionDataFactory,
		cardExtractor,
	}: {
		db: MintayDrizzleDB
		collectionDataSerializer: Serializer<unknown, T["collectionData"]>
		cardDataSerializer: Serializer<unknown, T["cardData"]>
		cardStateSerializer: Serializer<unknown, T["cardState"]>
		cardEventSerializer: Serializer<unknown, T["cardEvent"]>
		defaultCardDataFactory: () => T["cardData"]
		defaultCollectionDataFactory: () => T["collectionData"]
		cardExtractor: CardEngineExtractor<T>
		collectionDataExtractor: CollectionDataExtractor<T>
	}) {
		this.db = db
		this.collectionDataSerializer = collectionDataSerializer
		this.cardDataSerializer = cardDataSerializer
		this.cardStateSerializer = cardStateSerializer
		this.cardEventSerializer = cardEventSerializer
		this.defaultCardDataFactory = defaultCardDataFactory
		this.defaultCollectionDataFactory = defaultCollectionDataFactory
		this.cardExtractor = cardExtractor
	}

	public readonly create = async (): Promise<CollectionHandle<T>> => {
		const header = this.defaultCollectionDataFactory()
		const serializedHeader = this.collectionDataSerializer.serialize(header)
		const insertedCollection = await this.db.transaction(async (tx) => {
			await tx
				.insert(cardCollectionsTable)
				.values({
					collectionHeader: serializedHeader,
				})
				.run()

			const id = await MintayDbUtil.selectLastInsertId(tx)
			return { id }
		})

		if (!insertedCollection) {
			throw new Error("Failed to retrieve inserted collection")
		}

		const newId = MintayIdUtil.toNumber(insertedCollection.id)

		return new DrizzleCollectionHandle<T>({
			id: newId,
			db: this.db,
			defaultCardDataFactory: this.defaultCardDataFactory,
			collectionDataSerializer: this.collectionDataSerializer,
			cardStateSerializer: this.cardStateSerializer,
			cardDataSerializer: this.cardDataSerializer,
			cardEventSerializer: this.cardEventSerializer,
			cardExtractor: this.cardExtractor,
		})
	}

	public readonly get = (id: MintayId): CollectionHandle<T> => {
		return new DrizzleCollectionHandle<T>({
			id,
			db: this.db,
			defaultCardDataFactory: this.defaultCardDataFactory,
			collectionDataSerializer: this.collectionDataSerializer,
			cardStateSerializer: this.cardStateSerializer,
			cardDataSerializer: this.cardDataSerializer,
			cardEventSerializer: this.cardEventSerializer,
			cardExtractor: this.cardExtractor,
		})
	}

	public readonly list = async (): Promise<MintayId[]> => {
		const collections = await this.db
			.select({ id: cardCollectionsTable.id })
			.from(cardCollectionsTable)
			.all()

		return collections.map((collection) =>
			MintayIdUtil.toNumber(collection.id),
		)
	}
}
