import { Serializer } from "@teawithsand/reserd"
import { and, count, eq } from "drizzle-orm"
import { MintayDbUtil, MintayDrizzleDB } from "../../db/db"
import { cardCollectionsTable, cardsTable } from "../../db/schema"
import { CardEngineExtractor } from "../../defines"
import { CardId } from "../../defines/typings/defines"
import { CardIdUtil } from "../../defines/typings/internalCardIdUtil"
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
	private readonly defaultCardDataFactory: () => T["cardData"]
	private readonly collectionDataSerializer: Serializer<
		unknown,
		T["collectionData"]
	>
	private readonly cardStateSerializer: Serializer<unknown, T["cardState"]>
	private readonly cardDataSerializer: Serializer<unknown, T["cardData"]>
	private readonly cardEventSerializer: Serializer<unknown, T["cardEvent"]>
	private readonly cardExtractor: CardEngineExtractor<T>

	constructor({
		id,
		db,
		defaultCardDataFactory,
		collectionDataSerializer,
		cardStateSerializer,
		cardDataSerializer,
		cardEventSerializer,
		cardExtractor,
	}: {
		id: CardId
		db: MintayDrizzleDB
		defaultCardDataFactory: () => T["cardData"]
		collectionDataSerializer: Serializer<unknown, T["collectionData"]>
		cardStateSerializer: Serializer<unknown, T["cardState"]>
		cardDataSerializer: Serializer<unknown, T["cardData"]>
		cardEventSerializer: Serializer<unknown, T["cardEvent"]>
		cardExtractor: CardEngineExtractor<T>
	}) {
		this.id = id
		this.db = db
		this.defaultCardDataFactory = defaultCardDataFactory
		this.collectionDataSerializer = collectionDataSerializer
		this.cardStateSerializer = cardStateSerializer
		this.cardDataSerializer = cardDataSerializer
		this.cardEventSerializer = cardEventSerializer
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
			const serializedData = this.collectionDataSerializer.serialize(data)
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
			...this.collectionDataSerializer.deserialize(
				collection.collectionHeader,
			),
			...partial,
		}
		const serializedUpdatedData =
			this.collectionDataSerializer.serialize(updatedOwnedData)

		await this.db
			.update(cardCollectionsTable)
			.set({ collectionHeader: serializedUpdatedData })
			.where(eq(cardCollectionsTable.id, CardIdUtil.toNumber(this.id)))
			.run()
	}

	public readonly read = async (): Promise<T["collectionData"] | null> => {
		const collection = await this.db
			.select()
			.from(cardCollectionsTable)
			.where(eq(cardCollectionsTable.id, CardIdUtil.toNumber(this.id)))
			.get()

		if (!collection) {
			return null
		}

		return this.collectionDataSerializer.deserialize(
			collection.collectionHeader,
		)
	}

	public readonly mustRead = async (): Promise<T["collectionData"]> => {
		const data = await this.read()
		if (data === null) {
			throw new Error("Collection not found")
		}
		return data
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
					id: card.id as CardId,
					db: this.db,
					cardStateSerializer: this.cardStateSerializer,
					cardDataSerializer: this.cardDataSerializer,
					cardEventSerializer: this.cardEventSerializer,
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
			cardStateSerializer: this.cardStateSerializer,
			cardDataSerializer: this.cardDataSerializer,
			cardEventSerializer: this.cardEventSerializer,
			collectionId: this.id,
			cardExtractor: this.cardExtractor,
		})
	}

	public readonly createCard = async (): Promise<CardHandle<T>> => {
		const newCardData = this.defaultCardDataFactory()

		const queue = this.cardExtractor.getQueue(null, newCardData)
		const priority = this.cardExtractor.getPriority(null, newCardData)
		const stats = this.cardExtractor.getStats(null, newCardData)

		const insertedCard = await this.db.transaction(async (tx) => {
			await tx
				.insert(cardsTable)
				.values({
					collectionId: CardIdUtil.toNumber(this.id),
					cardData: this.cardDataSerializer.serialize(newCardData),
					queue: queue,
					priority: priority,
					repeats: stats.repeats,
					lapses: stats.lapses,
				})
				.run()

			const id = await MintayDbUtil.selectLastInsertId(tx)
			return { id }
		})

		if (!insertedCard) throw new Error("Failed to retrieve inserted card")

		const newId = insertedCard.id

		return new DrizzleCardHandle<T>({
			id: newId as CardId,
			db: this.db,
			cardStateSerializer: this.cardStateSerializer,
			cardDataSerializer: this.cardDataSerializer,
			cardEventSerializer: this.cardEventSerializer,
			collectionId: this.id,
			cardExtractor: this.cardExtractor,
		})
	}
}
