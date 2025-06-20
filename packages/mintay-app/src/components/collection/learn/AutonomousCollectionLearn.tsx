import { useApp } from "@/app"
import { AppCardData } from "@/mintay"
import {
	FsrsParameters,
	MintayAnswer,
	MintayCardEvent,
	MintayCardEventType,
	MintayCardState,
	MintayId,
} from "@teawithsand/mintay-core"
import { useCallback, useMemo } from "react"
import { CollectionLearn } from "./CollectionLearn"
import { DEFAULT_FSRS_PARAMETERS } from "./constants"

interface AutonomousCollectionLearnProps {
	readonly collectionId: MintayId
	readonly fsrsParameters?: FsrsParameters
}

type CardWithState = {
	readonly id: MintayId
	readonly data: AppCardData
	readonly state: MintayCardState
}

/**
 * Autonomous component for collection learning that manages its own state
 * and integrates with the mintay core engine store.
 *
 * @example
 * ```tsx
 * // Basic usage with default FSRS parameters
 * <AutonomousCollectionLearn collectionId="collection-123" />
 *
 * // Custom FSRS parameters for different learning preferences
 * const customParams = {
 *   requestRetention: 0.85, // 85% retention rate
 *   maximumInterval: 30000, // ~82 years in days
 *   w: [...], // Custom weights
 *   enableFuzz: false,
 *   enableShortTerm: true,
 * }
 * <AutonomousCollectionLearn
 *   collectionId="collection-123"
 *   fsrsParameters={customParams}
 * />
 * ```
 */
export const AutonomousCollectionLearn = ({
	collectionId,
	fsrsParameters = DEFAULT_FSRS_PARAMETERS,
}: AutonomousCollectionLearnProps) => {
	const app = useApp()

	const engineStore = useMemo(() => {
		return app.mintay.getEngineStore(collectionId, fsrsParameters)
	}, [app.mintay, collectionId, fsrsParameters])

	const getCardData = useCallback(
		async (cardId: MintayId): Promise<CardWithState | null> => {
			const cardHandle = await app.mintay.cardStore.getCardById(cardId)
			if (!cardHandle) {
				return null
			}

			const cardData = await cardHandle.read()
			if (!cardData) {
				return null
			}

			// Get the card state from the engine store
			const cardState = await engineStore.getCardData(cardId)

			return {
				id: cardId,
				data: cardData,
				state: cardState,
			}
		},
		[app.mintay.cardStore, engineStore],
	)

	const getNextCard = useCallback(async (): Promise<CardWithState | null> => {
		const nextCardId = await engineStore.getTopCard()
		if (!nextCardId) {
			return null
		}
		return await getCardData(nextCardId)
	}, [engineStore, getCardData])

	const submitAnswer = useCallback(
		async (cardId: MintayId, answer: MintayAnswer) => {
			const event: MintayCardEvent = {
				type: MintayCardEventType.ANSWER,
				answer,
				timestamp: Date.now(),
			}
			await engineStore.push(cardId, event)
		},
		[engineStore],
	)

	return (
		<CollectionLearn
			getNextCard={getNextCard}
			submitAnswer={submitAnswer}
		/>
	)
}
