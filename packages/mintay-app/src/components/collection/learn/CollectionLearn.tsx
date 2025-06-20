import { AppCardData } from "@/mintay"
import { Card, Stack } from "@mantine/core"
import {
	MintayAnswer,
	MintayCardState,
	MintayId,
} from "@teawithsand/mintay-core"
import { useCallback, useEffect, useState } from "react"
import styles from "./CollectionLearn.module.scss"
import { CollectionLearnActions } from "./CollectionLearnActions"
import { CollectionLearnAnswer } from "./CollectionLearnAnswer"
import { CollectionLearnCard } from "./CollectionLearnCard"
import { CollectionLearnEmptyState } from "./CollectionLearnEmptyState"
import { CollectionLearnLoadingState } from "./CollectionLearnLoadingState"

type CardWithState = {
	readonly id: MintayId
	readonly data: AppCardData
	readonly state: MintayCardState
}

interface CollectionLearnProps {
	readonly getNextCard: () => Promise<CardWithState | null>
	readonly submitAnswer: (
		cardId: MintayId,
		answer: MintayAnswer,
	) => Promise<void>
}

/**
 * Component for learning cards using the FSRS spaced repetition algorithm.
 * Allows users to study cards and rate their performance.
 */
export const CollectionLearn = ({
	getNextCard,
	submitAnswer,
}: CollectionLearnProps) => {
	const [currentCard, setCurrentCard] = useState<CardWithState | null>(null)
	const [showAnswer, setShowAnswer] = useState(false)
	const [isLoading, setIsLoading] = useState(false)

	const loadNextCard = useCallback(async () => {
		setIsLoading(true)
		try {
			const cardData = await getNextCard()
			if (cardData) {
				setCurrentCard(cardData)
				setShowAnswer(false)
			} else {
				setCurrentCard(null)
			}
		} finally {
			setIsLoading(false)
		}
	}, [getNextCard])

	const handleAnswer = useCallback(
		async (answer: MintayAnswer) => {
			if (!currentCard) return

			setIsLoading(true)
			try {
				await submitAnswer(currentCard.id, answer)
				await loadNextCard()
			} finally {
				setIsLoading(false)
			}
		},
		[currentCard, submitAnswer, loadNextCard],
	)

	const handleShowAnswer = useCallback(() => {
		setShowAnswer(true)
	}, [])

	// Auto-start learning when component mounts
	useEffect(() => {
		loadNextCard()
	}, [loadNextCard])

	if (isLoading && !currentCard) {
		return <CollectionLearnLoadingState />
	}

	if (!currentCard) {
		return <CollectionLearnEmptyState isLoading={isLoading} />
	}

	return (
		<div className={styles.container}>
			<Card shadow="sm" padding="lg" radius="md" withBorder>
				<Stack gap="lg">
					<CollectionLearnCard card={currentCard} />

					{showAnswer && <CollectionLearnAnswer card={currentCard} />}

					<CollectionLearnActions
						showAnswer={showAnswer}
						isLoading={isLoading}
						onShowAnswer={handleShowAnswer}
						onAnswer={handleAnswer}
					/>
				</Stack>
			</Card>
		</div>
	)
}
