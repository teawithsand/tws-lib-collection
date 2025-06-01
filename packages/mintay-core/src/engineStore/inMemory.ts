import { CardStateReducer } from "../defines/reducer/defines"
import { CardId, CardIdUtil } from "../defines/typings/cardId"
import {
	CardDataExtractor,
	CardStateExtractor,
} from "../defines/typings/defines"
import { StorageTypeSpec } from "../defines/typings/typeSpec"
import { InMemoryDb } from "../inMemoryDb/db"
import { EngineStore } from "./defines"

export class InMemoryEngineStore<T extends StorageTypeSpec>
	implements EngineStore<T>
{
	private readonly db: InMemoryDb<T>
	private readonly reducer: CardStateReducer<T["cardEvent"], T["cardState"]>
	private readonly stateExtractor: CardStateExtractor<T>
	private readonly dataExtractor: CardDataExtractor<T>
	private readonly lastPushedCardIds: CardId[] = []
	private readonly collectionId: CardId

	constructor({
		reducer,
		stateExtractor,
		dataExtractor,
		db,
		collectionId,
	}: {
		reducer: CardStateReducer<T["cardEvent"], T["cardState"]>
		stateExtractor: CardStateExtractor<T>
		dataExtractor: CardDataExtractor<T>
		db: InMemoryDb<T>
		collectionId: CardId
	}) {
		this.reducer = reducer
		this.stateExtractor = stateExtractor
		this.dataExtractor = dataExtractor
		this.db = db
		this.collectionId = collectionId
	}

	private readonly getCard = (id: CardId) => {
		const card = this.db.getCardById(id)
		if (!card) throw new Error(`Card not found: ${id}`)
		if (card.collection !== this.collectionId) {
			throw new Error(
				`Card ${CardIdUtil.toString(id)} does not belong to collection ${CardIdUtil.toString(this.collectionId)}`,
			)
		}
		return card
	}

	public readonly pop = async (): Promise<void> => {
		while (this.lastPushedCardIds.length > 0) {
			const lastPushedCardId =
				this.lastPushedCardIds[this.lastPushedCardIds.length - 1]!
			const card = this.db.getCardById(lastPushedCardId)

			if (!card || card.collection !== this.collectionId) {
				this.lastPushedCardIds.pop()
				continue
			}

			if (card.states.length > 0) {
				card.states.pop()
				this.db.upsertCard(lastPushedCardId, card)
				this.lastPushedCardIds.pop()
				return
			} else {
				this.lastPushedCardIds.pop()
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
		queues?: T["queue"][],
	): Promise<CardId | null> => {
		if (queues && queues.length === 0) {
			return null
		}
		let topCard: CardId | null = null
		let lowestPriority = Infinity
		for (const cardId of this.db.getAllCardIds()) {
			const card = this.db.getCardById(cardId)
			if (!card || card.collection !== this.collectionId) {
				continue
			}

			let priority: number
			if (card.states.length === 0) {
				// Use data extractor for cards with no events
				priority = this.dataExtractor.getDiscoveryPriority(card.data)
			} else {
				const state = card.states[card.states.length - 1]!.state
				priority = this.stateExtractor.getPriority(state)
				if (
					queues &&
					!queues.some(
						(queue) =>
							this.stateExtractor.getQueue(state) === queue,
					)
				) {
					continue
				}
			}

			if (priority < lowestPriority) {
				lowestPriority = priority
				topCard = cardId
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
