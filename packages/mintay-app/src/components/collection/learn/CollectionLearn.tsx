import { AppCardData, WithMintayId } from "@/mintay"
import { Card, Stack } from "@mantine/core"
import { MintayAnswer, MintayId } from "@teawithsand/mintay-core"
import { useCallback, useState } from "react"
import styles from "./CollectionLearn.module.scss"
import { CollectionLearnActions } from "./CollectionLearnActions"
import { CollectionLearnCard } from "./CollectionLearnCard"
import { CollectionLearnEmptyState } from "./CollectionLearnEmptyState"
import { CollectionLearnErrorState } from "./CollectionLearnErrorState"
import { CollectionLearnLoadingState } from "./CollectionLearnLoadingState"

interface CollectionLearnProps {
	readonly getNextCard: () => Promise<WithMintayId<AppCardData> | null>
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
	const [currentCard, setCurrentCard] =
		useState<WithMintayId<AppCardData> | null>(null)
	const [showAnswer, setShowAnswer] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<Error | null>(null)

	const loadNextCard = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		try {
			const cardData = await getNextCard()
			if (cardData) {
				setCurrentCard(cardData)
				setShowAnswer(false)
			} else {
				setCurrentCard(null)
			}
		} catch (err) {
			setError(
				err instanceof Error
					? err
					: new Error("An unexpected error occurred"),
			)
			setCurrentCard(null)
		} finally {
			setIsLoading(false)
		}
	}, [getNextCard])

	const handleAnswer = useCallback(
		async (answer: MintayAnswer) => {
			if (!currentCard) return

			setIsLoading(true)
			setError(null)
			try {
				await submitAnswer(currentCard.id, answer)
				await loadNextCard()
			} catch (err) {
				setError(
					err instanceof Error
						? err
						: new Error("Failed to process answer"),
				)
			} finally {
				setIsLoading(false)
			}
		},
		[currentCard, submitAnswer, loadNextCard],
	)

	const handleShowAnswer = useCallback(() => {
		setShowAnswer(true)
	}, [])

	const handleStartLearning = useCallback(() => {
		loadNextCard()
	}, [loadNextCard])

	const handleRetry = useCallback(() => {
		setError(null)
		loadNextCard()
	}, [loadNextCard])

	if (error) {
		return <CollectionLearnErrorState error={error} onRetry={handleRetry} />
	}

	if (isLoading && !currentCard) {
		return <CollectionLearnLoadingState />
	}

	if (!currentCard) {
		return (
			<CollectionLearnEmptyState
				isLoading={isLoading}
				onStartLearning={handleStartLearning}
			/>
		)
	}

	return (
		<div className={styles.container}>
			<Card shadow="sm" padding="lg" radius="md" withBorder>
				<Stack gap="lg">
					<CollectionLearnCard
						card={currentCard}
						isQuestion={true}
						title="Question"
						bgColor="gray.0"
					/>

					{showAnswer && (
						<CollectionLearnCard
							card={currentCard}
							isQuestion={false}
							title="Answer"
							bgColor="blue.0"
						/>
					)}

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
