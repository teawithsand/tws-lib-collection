import { Serializer } from "@teawithsand/reserd"
import { asc, count, desc, eq } from "drizzle-orm"
import { MintayDrizzleDB, MintayDrizzleDBTx } from "../../db/db"
import {
	cardCollectionsTable,
	cardEventsTable,
	cardsTable,
} from "../../db/schema"
import { CardEngineExtractor, CardId } from "../../defines/typings/defines"
import { CardIdUtil } from "../../defines/typings/internalCardIdUtil"
import { StorageTypeSpec } from "../../defines/typings/typeSpec"
import { CardHandle } from "../defines/card"

type CardRecord = typeof cardsTable.$inferSelect

export class DrizzleCardHandle<T extends StorageTypeSpec & { queue: number }>
	implements CardHandle<T>
{
	public readonly id: CardId
	private readonly db: MintayDrizzleDB
	private collectionId: CardId
	private readonly cardStateSerializer: Serializer<unknown, T["cardState"]>
	private readonly cardDataSerializer: Serializer<unknown, T["cardData"]>
	private readonly cardEventSerializer: Serializer<unknown, T["cardEvent"]>
	private readonly cardExtractor: CardEngineExtractor<T>

	constructor({
		id,
		db,
		cardStateSerializer,
		cardDataSerializer,
		cardEventSerializer,
		collectionId,
		cardExtractor,
	}: {
		id: CardId
		db: MintayDrizzleDB
		cardStateSerializer: Serializer<unknown, T["cardState"]>
		cardDataSerializer: Serializer<unknown, T["cardData"]>
		cardEventSerializer: Serializer<unknown, T["cardEvent"]>
		collectionId: CardId
		cardExtractor: CardEngineExtractor<T>
	}) {
		this.id = id
		this.db = db
		this.collectionId = collectionId
		this.cardStateSerializer = cardStateSerializer
		this.cardDataSerializer = cardDataSerializer
		this.cardEventSerializer = cardEventSerializer
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
	private readonly fetchCard = async (tx: MintayDrizzleDBTx) => {
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
		tx: MintayDrizzleDBTx,
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
			? this.cardStateSerializer.deserialize(latestStateRes.state)
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
		tx: MintayDrizzleDBTx,
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
	private readonly getExistingCard = async (tx: MintayDrizzleDBTx) => {
		const card = await this.fetchCard(tx)
		if (!card) throw new Error("Card not found")
		return card
	}

	/**
	 * Updates card metadata based on state and data
	 */
	private readonly updateCardMetadata = async (
		tx: MintayDrizzleDBTx,
		data: T["cardData"],
		state: T["cardState"] | null = null,
	): Promise<void> => {
		const { priority, queue, stats } = this.extractCardMetadata(state, data)

		await tx
			.update(cardsTable)
			.set({
				cardData: this.cardDataSerializer.serialize(data),
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
		callback: (tx: MintayDrizzleDBTx, card: CardRecord) => Promise<R>,
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
		tx: MintayDrizzleDBTx,
		data: T["cardData"],
	): Promise<void> => {
		await this.validateCollectionExists(tx)

		const { priority, queue, stats } = this.extractCardMetadata(null, data)

		await tx
			.insert(cardsTable)
			.values({
				id: this.getCardIdAsNumber(),
				collectionId: this.getCollectionIdAsNumber(),
				cardData: this.cardDataSerializer.serialize(data),
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
		tx: MintayDrizzleDBTx,
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
			const deserialized = this.cardDataSerializer.deserialize(
				card.cardData,
			)
			const updatedData = { ...deserialized, ...partial }
			const latestState = await this.fetchLatestState(tx)

			await this.updateCardMetadata(tx, updatedData, latestState)
		})
	}

	public readonly read = async (): Promise<T["cardData"] | null> => {
		const card = await this.db
			.select()
			.from(cardsTable)
			.where(eq(cardsTable.id, this.getCardIdAsNumber()))
			.get()
		if (!card) return null
		return this.cardDataSerializer.deserialize(card.cardData)
	}

	public readonly mustRead = async (): Promise<T["cardData"]> => {
		const data = await this.read()
		if (data === null) throw new Error("Card not found")
		return data
	}

	public readonly readState = async (): Promise<T["cardState"] | null> => {
		return await this.db.transaction(async (tx) => {
			return await this.fetchLatestState(tx)
		})
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

	/**
	 * Recomputes and updates all card metadata fields (priority, queue, lapses, repeats)
	 * based on the current card data and latest state from events.
	 * This is useful for manually refreshing computed properties when implementation of extractor has changed.
	 */
	public readonly recomputeMetadata = async (): Promise<void> => {
		await this.withExistingCard(async (tx, card) => {
			const cardData = this.cardDataSerializer.deserialize(card.cardData)
			const latestState = await this.fetchLatestState(tx)
			await this.updateCardMetadata(tx, cardData, latestState)
		})
	}

	public readonly getEventCount = async (): Promise<number> => {
		return await this.withExistingCard(async (tx) => {
			const result = await tx
				.select({
					count: count(),
				})
				.from(cardEventsTable)
				.where(eq(cardEventsTable.cardId, this.getCardIdAsNumber()))
				.get()

			return result?.count ?? 0
		})
	}

	public readonly getEvents = async (params?: {
		offset?: number
		limit?: number
	}): Promise<T["cardEvent"][]> => {
		return await this.withExistingCard(async (tx) => {
			if (params?.offset !== undefined && params.offset < 0) {
				throw new Error("Offset cannot be negative")
			}
			if (
				params?.offset !== undefined &&
				!Number.isFinite(params.offset)
			) {
				throw new Error("Offset must be a finite number")
			}
			if (params?.limit !== undefined && params.limit < 0) {
				throw new Error("Limit cannot be negative")
			}
			if (params?.limit !== undefined && !Number.isFinite(params.limit)) {
				throw new Error("Limit must be a finite number")
			}

			const events = await tx
				.select({
					event: cardEventsTable.event,
				})
				.from(cardEventsTable)
				.where(eq(cardEventsTable.cardId, this.getCardIdAsNumber()))
				.orderBy(asc(cardEventsTable.ordinalNumber))
				.offset(params?.offset ?? 0)
				.limit(params?.limit ?? Number.MAX_SAFE_INTEGER)
				.all()

			return events.map((event) =>
				this.cardEventSerializer.deserialize(event.event),
			)
		})
	}
}
