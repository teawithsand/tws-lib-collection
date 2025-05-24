import { eq } from "drizzle-orm"
import { DrizzleDB } from "../../db/db"
import { cardCollectionsTable, cardsTable } from "../../db/schema"
import { CardId, CardIdUtil } from "../../defines/typings/cardId"
import { TypeSpecSerializer } from "../../defines/typings/serializer"
import { StorageTypeSpec } from "../../defines/typings/typeSpec"
import { CardHandle } from "../defines/card"

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
