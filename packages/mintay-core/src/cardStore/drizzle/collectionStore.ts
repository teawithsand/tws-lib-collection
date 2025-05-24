import { DbUtil, DrizzleDB } from "../../db/db"
import { cardCollectionsTable } from "../../db/schema"
import { CardId, CardIdUtil } from "../../defines/typings/cardId"
import { TypeSpecSerializer } from "../../defines/typings/serializer"
import { StorageTypeSpec } from "../../defines/typings/typeSpec"
import { CollectionHandle, CollectionStore } from "../defines/collection"
import { DrizzleCollectionHandle } from "./collectionHandle"

export class DrizzleCollectionStore<T extends StorageTypeSpec>
	implements CollectionStore<T>
{
	private readonly db: DrizzleDB
	private readonly defaultCollectionHeader: T["collectionData"]
	private readonly defaultCardData: T["cardData"]
	private readonly serializer: TypeSpecSerializer<T>

	constructor({
		db,
		serializer,
		defaultCollectionHeader,
		defaultCardData,
	}: {
		db: DrizzleDB
		serializer: TypeSpecSerializer<T>
		defaultCollectionHeader: T["collectionData"]
		defaultCardData: T["cardData"]
	}) {
		this.db = db
		this.serializer = serializer
		this.defaultCollectionHeader = defaultCollectionHeader
		this.defaultCardData = defaultCardData
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

			const id = await DbUtil.selectLastInsertId(tx)
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
		})
	}

	public readonly get = (id: CardId): CollectionHandle<T> => {
		return new DrizzleCollectionHandle<T>({
			id,
			db: this.db,
			defaultCardData: this.defaultCardData,
			serializer: this.serializer,
		})
	}
}
