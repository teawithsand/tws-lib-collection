import { AppCardData, WithMintayId } from "@/mintay"
import { Card, Text, Title, useMantineColorScheme } from "@mantine/core"
import MarkdownPreview from "@uiw/react-markdown-preview"
import styles from "./CollectionLearn.module.scss"

interface CollectionLearnCardProps {
	readonly card: WithMintayId<AppCardData>
	readonly isQuestion?: boolean
	readonly title: string
	readonly bgColor?: string
}

/**
 * Component for displaying a single card with question or answer content
 */
export const CollectionLearnCard = ({
	card,
	isQuestion = true,
	title,
	bgColor = "gray.0",
}: CollectionLearnCardProps) => {
	const { colorScheme } = useMantineColorScheme()
	const content = isQuestion
		? card.data.questionContent
		: card.data.answerContent
	const emptyMessage = isQuestion
		? "No question provided"
		: "No answer provided"

	return (
		<div className={isQuestion ? styles.question : styles.answer}>
			<Title order={3} mb="sm">
				{title}
			</Title>
			<Card
				withBorder
				p="md"
				bg={bgColor}
				className={
					isQuestion
						? styles.question__content
						: styles.answer__content
				}
			>
				{content ? (
					<MarkdownPreview
						source={content}
						wrapperElement={{
							"data-color-mode":
								colorScheme === "auto" ? "light" : colorScheme,
						}}
					/>
				) : (
					<Text size="sm" c="dimmed">
						{emptyMessage}
					</Text>
				)}
			</Card>
		</div>
	)
}
