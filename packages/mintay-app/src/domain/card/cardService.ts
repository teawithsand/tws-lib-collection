import { AppCardData, AppMintayTypeSpec, WithMintayId } from "@/mintay"
import { atom, atomWithRefresh, loadable } from "@teawithsand/fstate"
import { CardStore, MintayId } from "@teawithsand/mintay-core"

/**
 * Service for managing card operations with reactive state management.
 * Wraps CardStore from mintay-core and provides atom-based reactive interfaces.
 */
export class CardService {
	public readonly cardStore: CardStore<AppMintayTypeSpec>

	constructor({ cardStore }: { cardStore: CardStore<AppMintayTypeSpec> }) {
		this.cardStore = cardStore
	}

	/**
	 * Gets a card handle with reactive operations for a specific card ID.
	 * Returns atoms for data access, updates, deletion, and creation.
	 */
	public readonly getCard = (cardId: MintayId) => {
		const cardDataAtom = atomWithRefresh(async () => {
			const card = await this.cardStore.getCardById(cardId)
			return card ? await card.read() : null
		})

		const cardDataLoadable = loadable(cardDataAtom)

		const updateCard = atom(null, async (_get, set, data: AppCardData) => {
			const card = await this.cardStore.getCardById(cardId)
			if (!card) {
				throw new Error(`Card with id ${cardId} not found`)
			}
			await card.save(data)
			set(cardDataAtom)
		})

		const deleteCard = atom(null, async () => {
			const card = await this.cardStore.getCardById(cardId)
			if (card) {
				await card.delete()
			}
		})

		const existsCard = atom(null, async () => {
			const card = await this.cardStore.getCardById(cardId)
			return card ? await card.exists() : false
		})

		return {
			data: atom((get) => get(cardDataAtom)),
			dataWithId: atom(
				async (get) =>
					({
						id: cardId,
						data: await get(cardDataAtom),
					}) satisfies WithMintayId<AppCardData | null>,
			),
			dataLoadable: cardDataLoadable,
			update: updateCard,
			delete: deleteCard,
			exists: existsCard,
			refresh: atom(null, (_get, set) => {
				set(cardDataAtom)
			}),
		}
	}

	/**
	 * Checks if a card exists by its ID.
	 */
	public readonly cardExists = atom(
		null,
		async (_get, _set, cardId: MintayId) => {
			const card = await this.cardStore.getCardById(cardId)
			return card ? await card.exists() : false
		},
	)
}
