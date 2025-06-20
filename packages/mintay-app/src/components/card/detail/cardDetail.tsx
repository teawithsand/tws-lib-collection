import { AppCardData, WithMintayId } from "@/mintay"
import { Routes } from "@/router/routes"
import {
	ActionIcon,
	Badge,
	Card,
	Divider,
	Group,
	Stack,
	Text,
	Title,
} from "@mantine/core"
import { useColorScheme } from "@mantine/hooks"
import { IconCards, IconEdit } from "@tabler/icons-react"
import { Atom, useAtomValue } from "@teawithsand/fstate"
import MarkdownPreview from "@uiw/react-markdown-preview"
import { Link } from "react-router"
import styles from "./cardDetail.module.scss"

interface CardDetailProps {
	readonly cardAtom: Atom<Promise<WithMintayId<AppCardData>>>
	readonly collectionId: string
}

/**
 * Component for displaying detailed information about a single card
 */
export const CardDetail = ({ cardAtom, collectionId }: CardDetailProps) => {
	const cardData = useAtomValue(cardAtom)
	const rawColorScheme = useColorScheme()
	// Swap dark/light since the markdown library expects opposite values
	const colorScheme = rawColorScheme === "dark" ? "light" : "dark"

	const { data: card, id } = cardData

	const formattedCreatedAt = new Date(card.createdAt).toLocaleDateString()
	const formattedUpdatedAt = new Date(card.updatedAt).toLocaleDateString()

	return (
		<div className={styles.container}>
			<Card shadow="sm" padding="lg" radius="md" withBorder>
				<Stack gap="md">
					<Group justify="space-between" align="flex-start">
						<div>
							<Title order={2} className={styles.title}>
								Card Details
							</Title>
							<Text
								size="sm"
								c="dimmed"
								className={styles.globalId}
							>
								ID: {card.globalId}
							</Text>
						</div>
						<Group gap="xs">
							<ActionIcon
								component={Link}
								to={Routes.collectionDetail.navigate(
									collectionId,
								)}
								variant="light"
								size="lg"
								aria-label="Go to collection"
							>
								<IconCards size={18} />
							</ActionIcon>
							<ActionIcon
								component={Link}
								to={Routes.editCollectionCard.navigate(
									collectionId,
									id.toString(),
								)}
								variant="light"
								size="lg"
								aria-label="Edit card"
							>
								<IconEdit size={18} />
							</ActionIcon>
						</Group>
					</Group>

					<div>
						<Text fw={500} size="sm" mb="xs">
							Question
						</Text>
						<Card
							withBorder
							padding="md"
							className={styles.content}
						>
							{card.questionContent ? (
								<MarkdownPreview
									source={card.questionContent}
									wrapperElement={{
										"data-color-mode": colorScheme,
									}}
								/>
							) : (
								<Text size="sm" c="dimmed">
									No question provided
								</Text>
							)}
						</Card>
					</div>

					<Divider />

					<div>
						<Text fw={500} size="sm" mb="xs">
							Answer
						</Text>
						<Card
							withBorder
							padding="md"
							className={styles.content}
						>
							{card.answerContent ? (
								<MarkdownPreview
									source={card.answerContent}
									wrapperElement={{
										"data-color-mode": colorScheme,
									}}
								/>
							) : (
								<Text size="sm" c="dimmed">
									No answer provided
								</Text>
							)}
						</Card>
					</div>

					<Group>
						<Badge
							leftSection={<IconCards size={12} />}
							variant="light"
							color="green"
						>
							Card
						</Badge>
					</Group>

					<Group gap="xl">
						<div>
							<Text
								size="xs"
								c="dimmed"
								tt="uppercase"
								fw={700}
								mb="xs"
							>
								Discovery Priority
							</Text>
							<Text size="sm">{card.discoveryPriority}</Text>
						</div>
						<div>
							<Text
								size="xs"
								c="dimmed"
								tt="uppercase"
								fw={700}
								mb="xs"
							>
								Created
							</Text>
							<Text size="sm">{formattedCreatedAt}</Text>
						</div>
						<div>
							<Text
								size="xs"
								c="dimmed"
								tt="uppercase"
								fw={700}
								mb="xs"
							>
								Last Updated
							</Text>
							<Text size="sm">{formattedUpdatedAt}</Text>
						</div>
					</Group>
				</Stack>
			</Card>
		</div>
	)
}
