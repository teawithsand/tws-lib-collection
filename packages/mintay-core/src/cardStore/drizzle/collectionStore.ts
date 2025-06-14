import { MintayDbUtil, MintayDrizzleDB } from "../../db/db"
import { cardCollectionsTable } from "../../db/schema"
import { CardExtractor } from "../../defines"
import { CardId } from "../../defines/typings/defines"
import { CardIdUtil } from "../../defines/typings/internalCardIdUtil"
import { TypeSpecSerializer } from "../../defines/typings/serializer"
import { StorageTypeSpec } from "../../defines/typings/typeSpec"
import { CollectionHandle, CollectionStore } from "../defines/collection"
import { DrizzleCollectionHandle } from "./collectionHandle"

export class DrizzleCollectionStore<
	T extends StorageTypeSpec & { queue: number },
> implements CollectionStore<T>
{
	private readonly db: MintayDrizzleDB
	private readonly defaultCollectionHeader: T["collectionData"]
	private readonly defaultCardData: T["cardData"]
	private readonly serializer: TypeSpecSerializer<T>
	private readonly cardExtractor: CardExtractor<T>
	constructor({
		db,
		serializer,
		defaultCollectionHeader,
		defaultCardData,
		cardExtractor,
	}: {
		db: MintayDrizzleDB
		serializer: TypeSpecSerializer<T>
		defaultCollectionHeader: T["collectionData"]
		defaultCardData: T["cardData"]
		cardExtractor: CardExtractor<T>
	}) {
		this.db = db
		this.serializer = serializer
		this.defaultCollectionHeader = defaultCollectionHeader
		this.defaultCardData = defaultCardData
		this.cardExtractor = cardExtractor
	}

	public readonly create = async (): Promise<CollectionHandle<T>> => {
		const header = this.defaultCollectionHeader
		const serializedHeader =
			this.serializer.serializeCollectionHeader(header)
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

		const newId = CardIdUtil.toNumber(insertedCollection.id)

		return new DrizzleCollectionHandle<T>({
			id: newId,
			db: this.db,
			defaultCardData: this.defaultCardData,
			serializer: this.serializer,
			cardExtractor: this.cardExtractor,
		})
	}

	public readonly get = (id: CardId): CollectionHandle<T> => {
		return new DrizzleCollectionHandle<T>({
			id,
			db: this.db,
			defaultCardData: this.defaultCardData,
			serializer: this.serializer,
			cardExtractor: this.cardExtractor,
		})
	}

	public readonly list = async (): Promise<CardId[]> => {
		const collections = await this.db
			.select({ id: cardCollectionsTable.id })
			.from(cardCollectionsTable)
			.all()

		return collections.map((collection) =>
			CardIdUtil.toNumber(collection.id),
		)
	}
}
