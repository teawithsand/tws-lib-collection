import { ActionIcon, Badge, Card, Group, Loader, Text } from "@mantine/core"
import { IconEdit, IconEye, IconFileText } from "@tabler/icons-react"
import { Link } from "react-router"
import { useTransResolver } from "../../../app"
import { WithMintayId } from "../../../mintay"
import { AppCardData } from "../../../mintay/card/card"
import { Routes } from "../../../router/routes"
import styles from "./CardList.module.scss"

interface CardListProps {
	readonly cards: WithMintayId<AppCardData>[]
	readonly isLoading?: boolean
	readonly collectionId?: string
}

/**
 * Component for displaying a list of cards with optional collection context
 * Shows cards in a responsive grid layout with actions for viewing and editing
 */
export const CardList = ({ cards, isLoading, collectionId }: CardListProps) => {
	const { resolve } = useTransResolver()

	if (isLoading) {
		return (
			<div className={styles["card-list__loading"]}>
				<Loader size="xl" />
			</div>
		)
	}

	if (cards.length === 0) {
		return (
			<div className={styles["card-list__empty-state"]}>
				<IconFileText
					size={48}
					className={styles["card-list__empty-state-icon"]}
				/>
				<div className={styles["card-list__empty-state-title"]}>
					No Cards Available
				</div>
				<Text
					size="sm"
					className={styles["card-list__empty-state-text"]}
				>
					This collection doesn't have any cards yet.
				</Text>
			</div>
		)
	}

	return (
		<div className={styles["card-list__container"]}>
			<div className={styles["card-list__grid"]}>
				{cards.map((cardWithId) => (
					<Card
						key={cardWithId.id}
						className={styles["card-list__card-item"]}
						shadow="sm"
						padding="lg"
						radius="md"
						withBorder
					>
						<div className={styles["card-list__card-header"]}>
							<div>
								<Text
									className={`${styles["card-list__card-title"]} ${styles["card-list__card-title--truncated"]}`}
									fw={600}
									size="sm"
								>
									{cardWithId.data.questionContent ||
										"Untitled Card"}
								</Text>
								<Text size="xs" c="dimmed">
									ID: {cardWithId.id}
								</Text>
							</div>
							<Group gap="xs">
								<ActionIcon
									component={Link}
									to={
										collectionId
											? Routes.collectionDetail.navigate(
													collectionId,
												) + `#card-${cardWithId.id}`
											: "#"
									}
									variant="light"
									size="sm"
									aria-label="View card"
								>
									<IconEye size={16} />
								</ActionIcon>
								<ActionIcon
									component={Link}
									to={
										collectionId
											? Routes.editCollection.navigate(
													collectionId,
												) + `#card-${cardWithId.id}`
											: "#"
									}
									variant="light"
									size="sm"
									aria-label="Edit card"
								>
									<IconEdit size={16} />
								</ActionIcon>
							</Group>
						</div>

						<div className={styles["card-list__card-content"]}>
							<Text
								size="sm"
								c="dimmed"
								className={`${styles["card-list__card-content--truncated"]}`}
							>
								{cardWithId.data.answerContent ||
									"No answer provided"}
							</Text>
						</div>

						<div className={styles["card-list__card-footer"]}>
							<div className={styles["card-list__card-meta"]}>
								<Badge
									variant="light"
									color={
										cardWithId.data.discoveryPriority > 0
											? "blue"
											: "gray"
									}
									size="sm"
								>
									{resolve((t) =>
										t.card.form.discoveryPriority(),
									)}
									: {cardWithId.data.discoveryPriority}
								</Badge>
							</div>
							<Text size="xs" c="dimmed">
								Updated:{" "}
								{new Date(
									cardWithId.data.updatedAt,
								).toLocaleDateString()}
							</Text>
						</div>
					</Card>
				))}
			</div>
		</div>
	)
}
