import { Markdown } from "@/components/markdown"
import { AppCardData } from "@/mintay"
import { Card, Text, Title } from "@mantine/core"
import { MintayCardState, MintayId } from "@teawithsand/mintay-core"
import styles from "./CollectionLearn.module.scss"

type CardWithState = {
	readonly id: MintayId
	readonly data: AppCardData
	readonly state: MintayCardState
}

interface CollectionLearnAnswerProps {
	readonly card: CardWithState
}

/**
 * Component for displaying the answer content of a card
 */
export const CollectionLearnAnswer = ({ card }: CollectionLearnAnswerProps) => {
	const content = card.data.answerContent
	const emptyMessage = "No answer provided"

	return (
		<div className={styles.answer}>
			<Title order={3} mb="sm">
				Answer
			</Title>
			<Card
				withBorder
				p="md"
				bg="blue.0"
				className={styles.answer__content}
			>
				{content ? (
					<Markdown source={content} />
				) : (
					<Text size="sm" c="dimmed">
						{emptyMessage}
					</Text>
				)}
			</Card>
		</div>
	)
}
