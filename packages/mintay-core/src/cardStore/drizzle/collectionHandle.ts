import { and, count, eq } from "drizzle-orm"
import { MintayDbUtil, MintayDrizzleDB } from "../../db/db"
import { cardCollectionsTable, cardsTable } from "../../db/schema"
import { CardExtractor } from "../../defines"
import { CardId, CardIdUtil } from "../../defines/typings/cardId"
import { TypeSpecSerializer } from "../../defines/typings/serializer"
import { StorageTypeSpec } from "../../defines/typings/typeSpec"
import { CardHandle } from "../defines/card"
import {
	CollectionGetCardsParams,
	CollectionHandle,
} from "../defines/collection"
import { DrizzleCardHandle } from "./cardHandle"

export class DrizzleCollectionHandle<
	T extends StorageTypeSpec & { queue: number },
> implements CollectionHandle<T>
{
	public readonly id: CardId
	private readonly db: MintayDrizzleDB
	private readonly defaultCardData: T["cardData"]
	private readonly serializer: TypeSpecSerializer<T>
	private readonly cardExtractor: CardExtractor<T>

	constructor({
		id,
		db,
		defaultCardData,
		serializer,
		cardExtractor: cardExtractor,
	}: {
		id: CardId
		db: MintayDrizzleDB
		defaultCardData: T["cardData"]
		serializer: TypeSpecSerializer<T>
		cardExtractor: CardExtractor<T>
	}) {
		this.id = id
		this.db = db
		this.defaultCardData = defaultCardData
		this.serializer = serializer
		this.cardExtractor = cardExtractor
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
		if (params?.offset && params.offset < 0) {
			throw new Error("Offset cannot be negative")
		}
		if (params?.limit && params.limit < 0) {
			throw new Error("Limit cannot be negative")
		}
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
					cardExtractor: this.cardExtractor,
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
		if (card.collectionId !== CardIdUtil.toNumber(this.id))
			throw new Error("Card does not belong to this collection")
		return new DrizzleCardHandle<T>({
			id,
			db: this.db,
			serializer: this.serializer,
			collectionId: this.id,
			cardExtractor: this.cardExtractor,
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

			const id = await MintayDbUtil.selectLastInsertId(tx)
			return { id }
		})

		if (!insertedCard) throw new Error("Failed to retrieve inserted card")

		const newId = insertedCard.id

		return new DrizzleCardHandle<T>({
			id: newId,
			db: this.db,
			serializer: this.serializer,
			collectionId: this.id,
			cardExtractor: this.cardExtractor,
		})
	}
}
