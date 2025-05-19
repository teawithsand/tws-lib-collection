import { CardStateReducer } from "../defines/reducer/defines"
import { CardId } from "../defines/typings/cardId"
import { CardStateExtractor } from "../defines/typings/defines"
import { StorageTypeSpec } from "../defines/typings/typeSpec"
import { InMemoryDb } from "../inMemoryDb/db"
import { EngineStore } from "./defines"

export class InMemoryEngineStore<
	T extends StorageTypeSpec,
	Queue extends string | number,
> implements EngineStore<T, Queue>
{
	private readonly db: InMemoryDb<T>
	private readonly reducer: CardStateReducer<T["cardEvent"], T["cardState"]>
	private readonly priorityExtractor: CardStateExtractor<
		T["cardState"],
		Queue
	>
	private readonly lastPushedCardIds: CardId[] = []

	constructor({
		reducer,
		priorityExtractor,
		db,
	}: {
		reducer: CardStateReducer<T["cardEvent"], T["cardState"]>
		priorityExtractor: CardStateExtractor<T["cardState"], Queue>
		db: InMemoryDb<T>
	}) {
		this.reducer = reducer
		this.priorityExtractor = priorityExtractor
		this.db = db
	}

	private readonly getCard = (id: CardId) => {
		const card = this.db.getCardById(id)
		if (!card) throw new Error("Card not found")
		return card
	}

	public readonly pop = async (): Promise<void> => {
		if (this.lastPushedCardIds.length > 0) {
			const lastPushedCardId = this.lastPushedCardIds.pop()!
			const card = this.getCard(lastPushedCardId)
			if (card.states.length === 0) {
				throw new Error("Unreachable")
			}
			card.states.pop()
			if (card.states.length === 0) {
				this.db.upsertCard(lastPushedCardId, { ...card, states: [] })
			} else {
				this.db.upsertCard(lastPushedCardId, card)
			}
		}
	}

	public readonly push = async (
		id: CardId,
		event: T["cardEvent"],
	): Promise<void> => {
		const card = this.getCard(id)
		const prevState =
			card.states.length > 0
				? card.states[card.states.length - 1]!.state
				: this.reducer.getDefaultState()
		const newState = this.reducer.fold(prevState, event)
		const newStates = [...card.states, { event, state: newState }]
		this.db.upsertCard(id, { ...card, states: newStates })
		this.lastPushedCardIds.push(id)
	}

	public readonly popCard = async (id: CardId): Promise<void> => {
		const card = this.getCard(id)
		if (card.states.length === 0) {
			return
		}
		const newStates = card.states.slice(0, -1)
		this.db.upsertCard(id, { ...card, states: newStates })
	}

	public readonly getTopCard = async (
		queues?: Queue[],
	): Promise<CardId | null> => {
		if (queues && queues.length === 0) {
			return null
		}
		let topCard: CardId | null = null
		let highestPriority = -Infinity
		for (const cardId of this.db.getAllCardIds()) {
			const card = this.db.getCardById(cardId)
			if (!card || card.states.length === 0) {
				continue
			}
			const state = card.states[card.states.length - 1]!.state
			const priority = this.priorityExtractor.getPriority(state)
			if (priority > highestPriority) {
				if (
					!queues ||
					queues.some(
						(queue) =>
							this.priorityExtractor.getQueue(state) === queue,
					)
				) {
					highestPriority = priority
					topCard = cardId
				}
			}
		}
		return topCard
	}

	public readonly getCardData = async (
		id: CardId,
	): Promise<T["cardState"]> => {
		const card = this.getCard(id)
		if (card.states.length === 0) {
			return this.reducer.getDefaultState()
		}
		return card.states[card.states.length - 1]!.state
	}
}
