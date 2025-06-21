import { Markdown } from "@/components/markdown"
import { AppCardData } from "@/mintay"
import { Badge, Card, Group, Text, Title } from "@mantine/core"
import { MintayCardState, MintayId } from "@teawithsand/mintay-core"
import styles from "./CollectionLearn.module.scss"

type CardWithState = {
	readonly id: MintayId
	readonly data: AppCardData
	readonly state: MintayCardState
}

interface CollectionLearnCardProps {
	readonly card: CardWithState
}

/**
 * Formats scheduled days into a human-readable interval string
 */
const formatInterval = (scheduledDays: number): string => {
	if (scheduledDays < 1) {
		return "< 1 day"
	}
	if (scheduledDays === 1) {
		return "1 day"
	}
	if (scheduledDays < 30) {
		return `${Math.round(scheduledDays)} days`
	}
	if (scheduledDays < 365) {
		const months = Math.round(scheduledDays / 30)
		return months === 1 ? "1 month" : `${months} months`
	}
	const years = Math.round(scheduledDays / 365)
	return years === 1 ? "1 year" : `${years} years`
}

/**
 * Component for displaying the question content of a card
 */
export const CollectionLearnCard = ({ card }: CollectionLearnCardProps) => {
	const content = card.data.questionContent
	const emptyMessage = "No question provided"

	return (
		<div className={styles.question}>
			<Group justify="space-between" align="center" mb="sm">
				<Title order={3}>Question</Title>
				{card.state.fsrs.scheduledDays > 0 && (
					<Badge variant="light" color="blue" size="sm">
						Interval:{" "}
						{formatInterval(card.state.fsrs.scheduledDays)}
					</Badge>
				)}
			</Group>
			<Card
				withBorder
				p="md"
				bg="gray.0"
				className={styles.question__content}
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
