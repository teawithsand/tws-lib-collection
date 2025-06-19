import { CardEngineExtractor } from "../defines/extractor"
import { MintayId, MintayIdUtil } from "../defines/id"
import { CardStateReducer } from "../defines/reducer/defines"
import { TypeSpec } from "../defines/typeSpec"
import { InMemoryDb } from "../inMemoryDb/db"
import { EngineStore } from "./defines"

export class InMemoryEngineStore<T extends TypeSpec> implements EngineStore<T> {
	private readonly db: InMemoryDb<T>
	private readonly reducer: CardStateReducer<T["cardEvent"], T["cardState"]>
	private readonly stateExtractor: CardEngineExtractor<T>
	private readonly lastPushedCardIds: MintayId[] = []
	private readonly collectionId: MintayId

	constructor({
		reducer,
		extractor,
		db,
		collectionId,
	}: {
		reducer: CardStateReducer<T["cardEvent"], T["cardState"]>
		extractor: CardEngineExtractor<T>
		db: InMemoryDb<T>
		collectionId: MintayId
	}) {
		this.reducer = reducer
		this.stateExtractor = extractor
		this.db = db
		this.collectionId = collectionId
	}

	private readonly getCard = (id: MintayId) => {
		const card = this.db.getCardById(id)
		if (!card) throw new Error(`Card not found: ${id}`)
		this.validateCardBelongsToCollection(card, id)
		return card
	}

	private readonly validateCardBelongsToCollection = (
		card: { collection: MintayId },
		id: MintayId,
	) => {
		if (card.collection !== this.collectionId) {
			throw new Error(
				`Card ${MintayIdUtil.toString(id)} does not belong to collection ${MintayIdUtil.toString(this.collectionId)}`,
			)
		}
	}

	private readonly getCurrentState = (card: {
		states: Array<{ state: T["cardState"] }>
	}) => {
		return card.states.length > 0
			? card.states[card.states.length - 1]!.state
			: this.reducer.getDefaultState()
	}

	private readonly isCardInCollection = (cardId: MintayId) => {
		const card = this.db.getCardById(cardId)
		return card && card.collection === this.collectionId
	}

	private readonly removeLastCardIdFromStack = () => {
		this.lastPushedCardIds.pop()
	}

	public readonly pop = async (): Promise<void> => {
		while (this.lastPushedCardIds.length > 0) {
			const lastPushedCardId =
				this.lastPushedCardIds[this.lastPushedCardIds.length - 1]!

			const card = this.db.getCardById(lastPushedCardId)

			if (!card || !this.isCardInCollection(lastPushedCardId)) {
				this.removeLastCardIdFromStack()
				continue
			}

			if (card.states.length > 0) {
				card.states.pop()
				this.db.upsertCard(lastPushedCardId, card!)
				this.removeLastCardIdFromStack()
				return
			} else {
				this.removeLastCardIdFromStack()
			}
		}
	}

	public readonly push = async (
		id: MintayId,
		event: T["cardEvent"],
	): Promise<void> => {
		const card = this.getCard(id)
		const prevState = this.getCurrentState(card)
		const newState = this.reducer.fold(prevState, event)
		const newStates = [...card.states, { event, state: newState }]
		this.db.upsertCard(id, { ...card, states: newStates })
		this.lastPushedCardIds.push(id)
	}

	public readonly popCard = async (id: MintayId): Promise<void> => {
		const card = this.getCard(id)
		if (card.states.length === 0) {
			return
		}
		const newStates = card.states.slice(0, -1)
		this.db.upsertCard(id, { ...card, states: newStates })
	}

	public readonly getTopCard = async (
		queues?: T["queue"][],
	): Promise<MintayId | null> => {
		if (queues && queues.length === 0) {
			return null
		}
		let topCard: MintayId | null = null
		let lowestPriority = Infinity
		for (const cardId of this.db.getAllCardIds()) {
			const card = this.db.getCardById(cardId)
			if (!card || !this.isCardInCollection(cardId)) {
				continue
			}

			const state = this.getCurrentState(card)
			const data = card.data

			const priority = this.stateExtractor.getPriority(state, data)
			const queue = this.stateExtractor.getQueue(state, data)

			if (
				queues &&
				!queues.some((queueCandidate) => queue === queueCandidate)
			) {
				continue
			}

			if (priority < lowestPriority) {
				lowestPriority = priority
				topCard = cardId
			}
		}
		return topCard
	}

	public readonly getCardData = async (
		id: MintayId,
	): Promise<T["cardState"]> => {
		const card = this.getCard(id)
		return this.getCurrentState(card)
	}
}
