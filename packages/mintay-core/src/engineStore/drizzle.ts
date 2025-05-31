import { and, desc, eq, inArray, max } from "drizzle-orm"
import { MintayDrizzleDB, MintayDrizzleDBTx } from "../db"
import { cardEventsTable, cardsTable } from "../db/schema"
import { CardStateReducer } from "../defines/reducer/defines"
import { CardId, CardIdUtil } from "../defines/typings/cardId"
import { CardStateExtractor } from "../defines/typings/defines"
import { TypeSpecSerializer } from "../defines/typings/serializer"
import { StorageTypeSpec } from "../defines/typings/typeSpec"
import { EngineStore } from "./defines"

export class DrizzleEngineStore<T extends StorageTypeSpec, Queue extends number>
	implements EngineStore<T, Queue>
{
	private reducer: CardStateReducer<T["cardEvent"], T["cardState"]>
	private extractor: CardStateExtractor<T["cardState"], Queue>
	private db: MintayDrizzleDB
	private serializer: TypeSpecSerializer<T>
	private readonly collectionId: number

	constructor({
		db,
		reducer,
		priorityExtractor,
		serializer,
		collectionId,
	}: {
		db: MintayDrizzleDB
		reducer: CardStateReducer<T["cardEvent"], T["cardState"]>
		priorityExtractor: CardStateExtractor<T["cardState"], Queue>
		serializer: TypeSpecSerializer<T>
		collectionId: CardId
	}) {
		this.db = db
		this.reducer = reducer
		this.extractor = priorityExtractor
		this.serializer = serializer
		this.collectionId = CardIdUtil.toNumber(collectionId)
	}

	public readonly push = async (
		id: CardId,
		event: T["cardEvent"],
	): Promise<void> => {
		const parsedId = CardIdUtil.toNumber(id)

		await this.db.transaction(async (tx) => {
			const lastEvent = await tx
				.select()
				.from(cardEventsTable)
				.where(
					and(
						eq(cardEventsTable.cardId, parsedId),
						eq(cardEventsTable.collectionId, this.collectionId),
					),
				)
				.orderBy(desc(cardEventsTable.ordinalNumber))
				.limit(1)
				.get()

			const prevState = lastEvent
				? this.serializer.deserializeState(lastEvent.state)
				: this.reducer.getDefaultState()
			const newState = this.reducer.fold(prevState, event)

			const collectionId = lastEvent
				? lastEvent.collectionId
				: this.collectionId

			const ordinalNumberRes = await tx
				.select({
					ordinalNumber: max(cardEventsTable.ordinalNumber),
				})
				.from(cardEventsTable)
				.where(eq(cardEventsTable.collectionId, this.collectionId))
				.limit(1)
				.get()

			const ordinalNumber = (ordinalNumberRes?.ordinalNumber ?? -1) + 1

			const queue = this.extractor.getQueue(newState)
			const priority = this.extractor.getPriority(newState)

			await tx.insert(cardEventsTable).values({
				cardId: parsedId,
				collectionId,
				event: this.serializer.serializeEvent(event),
				state: this.serializer.serializeState(newState),
				ordinalNumber,
			})

			await tx
				.update(cardsTable)
				.set({
					queue,
					priority,
				})
				.where(eq(cardsTable.id, parsedId))
				.execute()
		})
	}

	public readonly popCard = async (id: CardId): Promise<void> => {
		const parsedId = CardIdUtil.toNumber(id)

		await this.db.transaction(async (tx) => {
			const lastEvent = await tx
				.select()
				.from(cardEventsTable)
				.where(
					and(
						eq(cardEventsTable.cardId, parsedId),
						eq(cardEventsTable.collectionId, this.collectionId),
					),
				)
				.orderBy(desc(cardEventsTable.ordinalNumber))
				.limit(1)
				.get()

			if (!lastEvent) {
				return
			}

			await tx
				.delete(cardEventsTable)
				.where(eq(cardEventsTable.id, lastEvent.id))
				.execute()

			const previousEvent = await tx
				.select()
				.from(cardEventsTable)
				.where(
					and(
						eq(cardEventsTable.cardId, parsedId),
						eq(cardEventsTable.collectionId, this.collectionId),
					),
				)
				.orderBy(desc(cardEventsTable.ordinalNumber))
				.limit(1)
				.get()

			const newState = previousEvent?.state
				? this.serializer.deserializeState(previousEvent.state)
				: this.reducer.getDefaultState()

			await this.updateCardAfterModify(newState, parsedId, tx)
		})
	}

	public readonly pop = async (): Promise<void> => {
		await this.db.transaction(async (tx) => {
			const lastEvent = await tx
				.select()
				.from(cardEventsTable)
				.where(eq(cardEventsTable.collectionId, this.collectionId))
				.orderBy(desc(cardEventsTable.ordinalNumber))
				.limit(1)
				.get()

			if (!lastEvent) {
				return
			}

			await tx
				.delete(cardEventsTable)
				.where(eq(cardEventsTable.id, lastEvent.id))
				.execute()

			const previousEvent = await tx
				.select()
				.from(cardEventsTable)
				.where(
					and(
						eq(cardEventsTable.cardId, lastEvent.cardId),
						eq(cardEventsTable.collectionId, this.collectionId),
					),
				)
				.orderBy(desc(cardEventsTable.ordinalNumber))
				.limit(1)
				.get()

			const newState = previousEvent?.state
				? this.serializer.deserializeState(previousEvent.state)
				: this.reducer.getDefaultState()

			await this.updateCardAfterModify(newState, lastEvent.cardId, tx)
		})
	}

	public readonly getTopCard = async (
		queues?: Queue[],
	): Promise<CardId | null> => {
		if (!queues) {
			const result = await this.db
				.select()
				.from(cardEventsTable)
				.innerJoin(
					cardsTable,
					and(
						eq(cardEventsTable.cardId, cardsTable.id),
						eq(cardEventsTable.collectionId, this.collectionId),
					),
				)
				.orderBy(desc(cardsTable.priority))
				.limit(1)
				.get()

			return result?.card_events.id ?? null
		} else {
			const result = await this.db
				.select()
				.from(cardEventsTable)
				.innerJoin(
					cardsTable,
					and(
						eq(cardEventsTable.cardId, cardsTable.id),
						eq(cardEventsTable.collectionId, this.collectionId),
					),
				)
				.where(inArray(cardsTable.queue, queues))
				.orderBy(desc(cardsTable.priority))
				.limit(1)
				.get()

			return result?.card_events.id ?? null
		}
	}

	public readonly getCardData = async (
		id: CardId,
	): Promise<T["cardState"]> => {
		const parsedId = CardIdUtil.toNumber(id)

		const lastEvent = await this.db
			.select()
			.from(cardEventsTable)
			.where(
				and(
					eq(cardEventsTable.cardId, parsedId),
					eq(cardEventsTable.collectionId, this.collectionId),
				),
			)
			.orderBy(desc(cardEventsTable.ordinalNumber))
			.limit(1)
			.get()

		if (!lastEvent) {
			return this.reducer.getDefaultState()
		}

		return this.serializer.deserializeState(lastEvent.state)
	}

	private readonly updateCardAfterModify = async (
		state: T["cardState"],
		id: number,
		tx: MintayDrizzleDBTx,
	) => {
		const queue = this.extractor.getQueue(state)
		const priority = this.extractor.getPriority(state)

		const stats = this.extractor.getStats(state)

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
