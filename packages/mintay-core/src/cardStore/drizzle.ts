import { and, count, eq } from "drizzle-orm"
import { DbUtil, DrizzleDB } from "../db/db"
import { cardCollectionsTable, cardsTable } from "../db/schema"
import { CardId, CardIdUtil } from "../defines/typings/cardId"
import { TypeSpecSerializer } from "../defines/typings/serializer"
import { StorageTypeSpec } from "../defines/typings/typeSpec"
import { CardHandle } from "./defines/card"
import {
	CollectionGetCardsParams,
	CollectionHandle,
	CollectionStore,
} from "./defines/collection"

export class DrizzleCollectionHandle<T extends StorageTypeSpec>
	implements CollectionHandle<T>
{
	public readonly id: CardId
	private readonly db: DrizzleDB
	private readonly defaultCardData: T["cardData"]
	private readonly serializer: TypeSpecSerializer<T>

	constructor({
		id,
		db,
		defaultCardData,
		serializer,
	}: {
		id: CardId
		db: DrizzleDB
		defaultCardData: T["cardData"]
		serializer: TypeSpecSerializer<T>
	}) {
		this.id = id
		this.db = db
		this.defaultCardData = defaultCardData
		this.serializer = serializer
	}

	public readonly save = async (data: T["collectionData"]): Promise<void> => {
		await this.db.transaction(async (tx) => {
			const existing = await tx
				.select()
				.from(cardCollectionsTable)
				.where(
					eq(cardCollectionsTable.id, CardIdUtil.toNumber(this.id)),
				)
				.get()
			const serializedData =
				this.serializer.serializeCollectionHeader(data)
			if (existing) {
				await tx
					.update(cardCollectionsTable)
					.set({ collectionHeader: serializedData })
					.where(
						eq(
							cardCollectionsTable.id,
							CardIdUtil.toNumber(this.id),
						),
					)
					.run()
			} else {
				await tx
					.insert(cardCollectionsTable)
					.values({
						collectionHeader: serializedData,
						id: CardIdUtil.toNumber(this.id),
					})
					.run()
			}
		})
	}

	public readonly update = async (
		partial: Partial<T["collectionData"]>,
	): Promise<void> => {
		const collection = await this.db
			.select()
			.from(cardCollectionsTable)
			.where(eq(cardCollectionsTable.id, CardIdUtil.toNumber(this.id)))
			.get()
		if (!collection) throw new Error("Collection not found")

		const updatedOwnedData = {
			...this.serializer.deserializeCollectionHeader(
				collection.collectionHeader,
			),
			...partial,
		}
		const serializedUpdatedData =
			this.serializer.serializeCollectionHeader(updatedOwnedData)

		await this.db
			.update(cardCollectionsTable)
			.set({ collectionHeader: serializedUpdatedData })
			.where(eq(cardCollectionsTable.id, CardIdUtil.toNumber(this.id)))
			.run()
	}

	public readonly read = async (): Promise<T["collectionData"]> => {
		const collection = await this.db
			.select()
			.from(cardCollectionsTable)
			.where(eq(cardCollectionsTable.id, CardIdUtil.toNumber(this.id)))
			.get()

		if (!collection) {
			throw new Error("Collection not found")
		}

		return this.serializer.deserializeCollectionHeader(
			collection.collectionHeader,
		)
	}

	public readonly exists = async (): Promise<boolean> => {
		const collection = await this.db
			.select({
				id: cardCollectionsTable.id,
			})
			.from(cardCollectionsTable)
			.where(eq(cardCollectionsTable.id, CardIdUtil.toNumber(this.id)))
			.get()
		return !!collection
	}

	public readonly delete = async (): Promise<void> => {
		await this.db
			.delete(cardCollectionsTable)
			.where(eq(cardCollectionsTable.id, CardIdUtil.toNumber(this.id)))
			.run()
	}

	public readonly getCardCount = async (): Promise<number> => {
		const cards = await this.db
			.select({
				count: count(),
			})
			.from(cardsTable)
			.where(eq(cardsTable.collectionId, CardIdUtil.toNumber(this.id)))
			.get()

		if (!cards) return 0
		return cards.count
	}

	public readonly getCards = async (
		params?: CollectionGetCardsParams,
	): Promise<CardHandle<T>[]> => {
		const cards = await this.db
			.select()
			.from(cardsTable)
			.where(eq(cardsTable.collectionId, CardIdUtil.toNumber(this.id)))
			.offset(params?.offset ?? 0)
			.limit(params?.limit ?? Number.MAX_SAFE_INTEGER)
			.all()
		return cards.map(
			(card) =>
				new DrizzleCardHandle<T>({
					id: CardIdUtil.toNumber(card.id),
					db: this.db,
					serializer: this.serializer,
					collectionId: this.id,
				}),
		)
	}

	public readonly getCard = async (id: CardId): Promise<CardHandle<T>> => {
		const card = await this.db.transaction(async (tx) => {
			const card = await tx
				.select()
				.from(cardsTable)
				.where(
					and(
						eq(cardsTable.id, CardIdUtil.toNumber(id)),
						// eq(cardsTable.collectionId, CardIdUtil.toNumber(this.id)),
					),
				)
				.get()
			return card
		})
		if (!card) throw new Error("Card not found")
		if (card.collectionId !== this.id)
			throw new Error("Card does not belong to this collection")
		return new DrizzleCardHandle<T>({
			id,
			db: this.db,
			serializer: this.serializer,
			collectionId: this.id,
		})
	}

	public readonly createCard = async (): Promise<CardHandle<T>> => {
		const newCardData = this.defaultCardData
		const insertedCard = await this.db.transaction(async (tx) => {
			await tx
				.insert(cardsTable)
				.values({
					collectionId: CardIdUtil.toNumber(this.id),
					cardData: this.serializer.serializeCardData(newCardData),
				})
				.run()

			const id = await DbUtil.selectLastInsertId(tx)
			return { id }
		})

		if (!insertedCard) throw new Error("Failed to retrieve inserted card")

		const newId = insertedCard.id

		return new DrizzleCardHandle<T>({
			id: newId,
			db: this.db,
			serializer: this.serializer,
			collectionId: this.id,
		})
	}
}

export class DrizzleCardHandle<T extends StorageTypeSpec>
	implements CardHandle<T>
{
	public readonly id: CardId
	private readonly db: DrizzleDB
	private collectionId: CardId
	private readonly serializer: TypeSpecSerializer<T>

	constructor({
		id,
		db,
		serializer,
		collectionId,
	}: {
		id: CardId
		db: DrizzleDB
		serializer: TypeSpecSerializer<T>
		collectionId: CardId
	}) {
		this.id = id
		this.db = db
		this.collectionId = collectionId
		this.serializer = serializer
	}

	public readonly save = async (data: T["cardData"]): Promise<void> => {
		await this.db.transaction(async (tx) => {
			const card = await tx
				.select()
				.from(cardsTable)
				.where(eq(cardsTable.id, CardIdUtil.toNumber(this.id)))
				.get()

			if (!card) {
				const collection = await tx
					.select()
					.from(cardCollectionsTable)
					.where(
						eq(
							cardCollectionsTable.id,
							CardIdUtil.toNumber(this.collectionId),
						),
					)
					.get()
				if (!collection)
					throw new Error(
						"Card not found and collection does not exist",
					)
				await tx
					.insert(cardsTable)
					.values({
						id: CardIdUtil.toNumber(this.id),
						collectionId: CardIdUtil.toNumber(this.collectionId),
						cardData: this.serializer.serializeCardData(data),
					})
					.run()
				return
			}
			await tx
				.update(cardsTable)
				.set({ cardData: this.serializer.serializeCardData(data) })
				.where(eq(cardsTable.id, CardIdUtil.toNumber(this.id)))
				.run()
		})
	}

	public readonly update = async (
		partial: Partial<T["cardData"]>,
	): Promise<void> => {
		await this.db.transaction(async (tx) => {
			const card = await tx
				.select()
				.from(cardsTable)
				.where(eq(cardsTable.id, CardIdUtil.toNumber(this.id)))
				.get()

			if (!card) throw new Error("Card not found")

			const deserialized = this.serializer.deserializeCardData(
				card.cardData,
			)

			const updatedData = {
				...deserialized,
				...partial,
			}

			await tx
				.update(cardsTable)
				.set({
					cardData: this.serializer.serializeCardData(updatedData),
				})
				.where(eq(cardsTable.id, CardIdUtil.toNumber(this.id)))
				.run()
		})
	}

	public readonly read = async (): Promise<T["cardData"]> => {
		const card = await this.db
			.select()
			.from(cardsTable)
			.where(eq(cardsTable.id, CardIdUtil.toNumber(this.id)))
			.get()
		if (!card) throw new Error("Card not found")
		return this.serializer.deserializeCardData(card.cardData)
	}

	public readonly exists = async (): Promise<boolean> => {
		const card = await this.db
			.select({
				id: cardsTable.id,
			})
			.from(cardsTable)
			.where(eq(cardsTable.id, CardIdUtil.toNumber(this.id)))
			.get()
		return !!card
	}

	public readonly delete = async (): Promise<void> => {
		await this.db
			.delete(cardsTable)
			.where(eq(cardsTable.id, CardIdUtil.toNumber(this.id)))
			.run()
	}

	public readonly setCollection = async (id: CardId): Promise<void> => {
		await this.db.transaction(async (tx) => {
			const card = await tx
				.select()
				.from(cardsTable)
				.where(eq(cardsTable.id, CardIdUtil.toNumber(this.id)))
				.get()
			if (!card) throw new Error("Card not found")
			await tx
				.update(cardsTable)
				.set({ collectionId: CardIdUtil.toNumber(id) })
				.where(eq(cardsTable.id, CardIdUtil.toNumber(this.id)))
				.run()
		})
		this.collectionId = id
	}
}

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
