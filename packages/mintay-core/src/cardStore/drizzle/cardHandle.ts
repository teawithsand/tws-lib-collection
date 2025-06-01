import { desc, eq } from "drizzle-orm"
import { MintayDrizzleDB } from "../../db/db"
import {
	cardCollectionsTable,
	cardEventsTable,
	cardsTable,
} from "../../db/schema"
import { CardId, CardIdUtil } from "../../defines/typings/cardId"
import { CardExtractor } from "../../defines/typings/defines"
import { TypeSpecSerializer } from "../../defines/typings/serializer"
import { StorageTypeSpec } from "../../defines/typings/typeSpec"
import { CardHandle } from "../defines/card"

export class DrizzleCardHandle<T extends StorageTypeSpec & { queue: number }>
	implements CardHandle<T>
{
	public readonly id: CardId
	private readonly db: MintayDrizzleDB
	private collectionId: CardId
	private readonly serializer: TypeSpecSerializer<T>
	private readonly cardExtractor: CardExtractor<T>

	constructor({
		id,
		db,
		serializer,
		collectionId,
		cardExtractor,
	}: {
		id: CardId
		db: MintayDrizzleDB
		serializer: TypeSpecSerializer<T>
		collectionId: CardId
		cardExtractor: CardExtractor<T>
	}) {
		this.id = id
		this.db = db
		this.collectionId = collectionId
		this.serializer = serializer
		this.cardExtractor = cardExtractor
	}

	/**
	 * Converts CardId to number for database operations
	 */
	private readonly getCardIdAsNumber = (): number => {
		return CardIdUtil.toNumber(this.id)
	}

	/**
	 * Converts collection CardId to number for database operations
	 */
	private readonly getCollectionIdAsNumber = (): number => {
		return CardIdUtil.toNumber(this.collectionId)
	}

	/**
	 * Fetches card from database within a transaction
	 */
	private readonly fetchCard = async (tx: any) => {
		return await tx
			.select()
			.from(cardsTable)
			.where(eq(cardsTable.id, this.getCardIdAsNumber()))
			.get()
	}

	/**
	 * Fetches the latest state for the card
	 */
	private readonly fetchLatestState = async (
		tx: any,
	): Promise<T["cardState"] | null> => {
		const latestStateRes = await tx
			.select({
				state: cardEventsTable.state,
			})
			.from(cardEventsTable)
			.orderBy(desc(cardEventsTable.ordinalNumber))
			.where(eq(cardEventsTable.cardId, this.getCardIdAsNumber()))
			.get()

		return latestStateRes?.state
			? this.serializer.deserializeState(latestStateRes.state)
			: null
	}

	/**
	 * Extracts card metadata (priority, queue, stats) based on state and data
	 */
	private readonly extractCardMetadata = (
		state: T["cardState"] | null,
		data: T["cardData"],
	) => {
		return {
			priority: this.cardExtractor.getPriority(state, data),
			queue: this.cardExtractor.getQueue(state, data),
			stats: this.cardExtractor.getStats(state, data),
		}
	}

	/**
	 * Validates that the collection exists
	 */
	private readonly validateCollectionExists = async (
		tx: any,
	): Promise<void> => {
		const collection = await tx
			.select()
			.from(cardCollectionsTable)
			.where(eq(cardCollectionsTable.id, this.getCollectionIdAsNumber()))
			.get()

		if (!collection) {
			throw new Error("Card not found and collection does not exist")
		}
	}

	/**
	 * Gets card from database, throws if not found
	 */
	private readonly getExistingCard = async (tx: any) => {
		const card = await this.fetchCard(tx)
		if (!card) throw new Error("Card not found")
		return card
	}

	/**
	 * Updates card metadata based on state and data
	 */
	private readonly updateCardMetadata = async (
		tx: any,
		data: T["cardData"],
		state: T["cardState"] | null = null,
	): Promise<void> => {
		const { priority, queue, stats } = this.extractCardMetadata(state, data)

		await tx
			.update(cardsTable)
			.set({
				cardData: this.serializer.serializeCardData(data),
				priority,
				queue,
				lapses: stats.lapses,
				repeats: stats.repeats,
			})
			.where(eq(cardsTable.id, this.getCardIdAsNumber()))
			.run()
	}

	/**
	 * Executes a transaction that requires an existing card
	 */
	private readonly withExistingCard = async <R>(
		callback: (tx: any, card: any) => Promise<R>,
	): Promise<R> => {
		return await this.db.transaction(async (tx) => {
			const card = await this.getExistingCard(tx)
			return await callback(tx, card)
		})
	}

	/**
	 * Creates a new card in the database
	 */
	private readonly createCard = async (
		tx: any,
		data: T["cardData"],
	): Promise<void> => {
		await this.validateCollectionExists(tx)

		const { priority, queue, stats } = this.extractCardMetadata(null, data)

		await tx
			.insert(cardsTable)
			.values({
				id: this.getCardIdAsNumber(),
				collectionId: this.getCollectionIdAsNumber(),
				cardData: this.serializer.serializeCardData(data),
				priority,
				queue,
				lapses: stats.lapses,
				repeats: stats.repeats,
			})
			.run()
	}

	/**
	 * Updates an existing card in the database
	 */
	private readonly updateCard = async (
		tx: any,
		data: T["cardData"],
	): Promise<void> => {
		const latestState = await this.fetchLatestState(tx)
		await this.updateCardMetadata(tx, data, latestState)
	}

	public readonly save = async (data: T["cardData"]): Promise<void> => {
		await this.db.transaction(async (tx) => {
			const card = await this.fetchCard(tx)

			if (!card) {
				await this.createCard(tx, data)
			} else {
				await this.updateCard(tx, data)
			}
		})
	}

	public readonly update = async (
		partial: Partial<T["cardData"]>,
	): Promise<void> => {
		await this.withExistingCard(async (tx, card) => {
			const deserialized = this.serializer.deserializeCardData(
				card.cardData,
			)
			const updatedData = { ...deserialized, ...partial }
			const latestState = await this.fetchLatestState(tx)

			await this.updateCardMetadata(tx, updatedData, latestState)
		})
	}

	public readonly read = async (): Promise<T["cardData"]> => {
		const card = await this.db
			.select()
			.from(cardsTable)
			.where(eq(cardsTable.id, this.getCardIdAsNumber()))
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
			.where(eq(cardsTable.id, this.getCardIdAsNumber()))
			.get()
		return !!card
	}

	public readonly delete = async (): Promise<void> => {
		await this.db
			.delete(cardsTable)
			.where(eq(cardsTable.id, this.getCardIdAsNumber()))
			.run()
	}

	public readonly setCollection = async (id: CardId): Promise<void> => {
		await this.withExistingCard(async (tx) => {
			await tx
				.update(cardsTable)
				.set({ collectionId: CardIdUtil.toNumber(id) })
				.where(eq(cardsTable.id, this.getCardIdAsNumber()))
				.run()
		})
		this.collectionId = id
	}
}
