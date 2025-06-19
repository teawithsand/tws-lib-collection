import { Serializer } from "@teawithsand/reserd"
import { and, asc, desc, eq, inArray, max } from "drizzle-orm"
import { MintayDrizzleDB, MintayDrizzleDBTx } from "../db"
import { cardEventsTable, cardsTable } from "../db/schema"
import { CardEngineExtractor } from "../defines/extractor"
import { MintayId, MintayIdUtil } from "../defines/id"
import { CardStateReducer } from "../defines/reducer/defines"
import { TypeSpec } from "../defines/typeSpec"
import { EngineStore } from "./defines"

export class DrizzleEngineStore<T extends TypeSpec & { queue: number }>
	implements EngineStore<T>
{
	private reducer: CardStateReducer<T["cardEvent"], T["cardState"]>
	private extractor: CardEngineExtractor<T>
	private db: MintayDrizzleDB
	private readonly cardStateSerializer: Serializer<unknown, T["cardState"]>
	private readonly cardEventSerializer: Serializer<unknown, T["cardEvent"]>
	private readonly cardDataSerializer: Serializer<unknown, T["cardData"]>
	private readonly collectionId: number

	constructor({
		db,
		reducer,
		extractor,
		cardStateSerializer,
		cardEventSerializer,
		cardDataSerializer,
		collectionId,
	}: {
		db: MintayDrizzleDB
		reducer: CardStateReducer<T["cardEvent"], T["cardState"]>
		extractor: CardEngineExtractor<T>
		cardStateSerializer: Serializer<unknown, T["cardState"]>
		cardEventSerializer: Serializer<unknown, T["cardEvent"]>
		cardDataSerializer: Serializer<unknown, T["cardData"]>
		collectionId: MintayId
	}) {
		this.db = db
		this.reducer = reducer
		this.extractor = extractor
		this.cardStateSerializer = cardStateSerializer
		this.cardEventSerializer = cardEventSerializer
		this.cardDataSerializer = cardDataSerializer
		this.collectionId = MintayIdUtil.toNumber(collectionId)
	}

	public readonly push = async (
		id: MintayId,
		event: T["cardEvent"],
	): Promise<void> => {
		const parsedId = MintayIdUtil.toNumber(id)

		await this.db.transaction(async (tx) => {
			const lastEvent = await this.getLastCardEvent(parsedId, tx)

			const prevState = lastEvent
				? this.cardStateSerializer.deserialize(lastEvent.state)
				: this.reducer.getDefaultState()
			const newState = this.reducer.fold(prevState, event)

			const collectionId = lastEvent
				? lastEvent.collectionId
				: this.collectionId

			const ordinalNumber = await this.getNextOrdinalNumber(tx)

			await tx.insert(cardEventsTable).values({
				cardId: parsedId,
				collectionId,
				event: this.cardEventSerializer.serialize(event),
				state: this.cardStateSerializer.serialize(newState),
				ordinalNumber,
			})

			await this.updateCardAfterModify(newState, parsedId, tx)
		})
	}

	public readonly popCard = async (id: MintayId): Promise<void> => {
		const parsedId = MintayIdUtil.toNumber(id)

		await this.db.transaction(async (tx) => {
			const lastEvent = await this.getLastCardEvent(parsedId, tx)

			if (!lastEvent) {
				return
			}

			await this.popEventAndUpdate(lastEvent.id, parsedId, tx)
		})
	}

	public readonly pop = async (): Promise<void> => {
		await this.db.transaction(async (tx) => {
			const lastEvent = await this.getLastCollectionEvent(tx)

			if (!lastEvent) {
				return
			}

			await this.popEventAndUpdate(lastEvent.id, lastEvent.cardId, tx)
		})
	}

	public readonly getTopCard = async (
		queues?: T["queue"][],
	): Promise<MintayId | null> => {
		const whereCondition = queues
			? and(
					eq(cardsTable.collectionId, this.collectionId),
					inArray(cardsTable.queue, queues),
				)
			: eq(cardsTable.collectionId, this.collectionId)

		const result = await this.db
			.select({
				id: cardsTable.id,
			})
			.from(cardsTable)
			.where(whereCondition)
			.orderBy(asc(cardsTable.priority))
			.limit(1)
			.get()

		return result?.id ?? null
	}

	public readonly getCardData = async (
		id: MintayId,
	): Promise<T["cardState"]> => {
		const parsedId = MintayIdUtil.toNumber(id)

		const lastEvent = await this.db.transaction(async (tx) => {
			return await this.getLastCardEvent(parsedId, tx)
		})

		if (!lastEvent) {
			return this.reducer.getDefaultState()
		}

		return this.cardStateSerializer.deserialize(lastEvent.state)
	}

	private readonly getLastCardEvent = async (
		cardId: number,
		tx: MintayDrizzleDBTx,
	) => {
		return await tx
			.select()
			.from(cardEventsTable)
			.where(
				and(
					eq(cardEventsTable.cardId, cardId),
					eq(cardEventsTable.collectionId, this.collectionId),
				),
			)
			.orderBy(desc(cardEventsTable.ordinalNumber))
			.limit(1)
			.get()
	}

	private readonly getLastCollectionEvent = async (tx: MintayDrizzleDBTx) => {
		return await tx
			.select()
			.from(cardEventsTable)
			.where(eq(cardEventsTable.collectionId, this.collectionId))
			.orderBy(desc(cardEventsTable.ordinalNumber))
			.limit(1)
			.get()
	}

	private readonly getNextOrdinalNumber = async (tx: MintayDrizzleDBTx) => {
		const ordinalNumberRes = await tx
			.select({
				ordinalNumber: max(cardEventsTable.ordinalNumber),
			})
			.from(cardEventsTable)
			.where(eq(cardEventsTable.collectionId, this.collectionId))
			.limit(1)
			.get()

		return (ordinalNumberRes?.ordinalNumber ?? -1) + 1
	}

	private readonly popEventAndUpdate = async (
		eventId: number,
		cardId: number,
		tx: MintayDrizzleDBTx,
	) => {
		await tx
			.delete(cardEventsTable)
			.where(eq(cardEventsTable.id, eventId))
			.execute()

		const previousEvent = await this.getLastCardEvent(cardId, tx)

		const newState = previousEvent?.state
			? this.cardStateSerializer.deserialize(previousEvent.state)
			: null

		await this.updateCardAfterModify(newState, cardId, tx)
	}

	private readonly updateCardAfterModify = async (
		state: T["cardState"] | null,
		id: number,
		tx: MintayDrizzleDBTx,
	) => {
		const card = await tx
			.select()
			.from(cardsTable)
			.where(eq(cardsTable.id, id))
			.get()

		if (!card)
			throw new Error(
				`Card with id ${id} not found; But it should exist. This should be unreachable.`,
			)

		const cardData = this.cardDataSerializer.deserialize(card.cardData)

		const queue = this.extractor.getQueue(state, cardData)
		const priority = this.extractor.getPriority(state, cardData)
		const stats = this.extractor.getStats(state, cardData)

		await tx
			.update(cardsTable)
			.set({
				queue,
				priority,
				lapses: stats.lapses,
				repeats: stats.repeats,
			})
			.where(eq(cardsTable.id, id))
			.execute()
	}
}
