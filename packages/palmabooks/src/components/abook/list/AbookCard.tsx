import { useTransResolver } from "@/app/app.hooks"
import { Routes } from "@/router"
import { Abook, WithId } from "@teawithsand/booklibr"
import { Card, Group, Image, Link, Stack, Text, Title } from "@teawithsand/mlui"
import styles from "./AbookCard.module.scss"

export interface AbookCardProps {
	readonly abook: WithId<Abook>
	// TODO(teaiwthsand): here add property for image to display as book cover to replace placebear.com
}

/**
 * Individual audiobook card component for list display.
 */
export const AbookCard = ({ abook }: AbookCardProps) => {
	const { resolve } = useTransResolver()

	const totalDuration = abook.data.aggregate.totalDurationMillis
	const hasValidDuration = totalDuration !== undefined && totalDuration >= 0

	return (
		<Card
			component={Link}
			to={Routes.abookShow.navigate(String(abook.id))}
			padding="lg"
			shadow="sm"
			withBorder
			className={styles.card}
		>
			<Group gap="md" align="flex-start" wrap="nowrap">
				<Image
					src="https://placebear.com/200/300"
					alt={
						abook.data.data.header.metadata.title ||
						resolve((t) => t.abook.view.audiobookCoverAlt)
					}
					w={120}
					h={120}
					className={styles.image}
				/>
				<Stack gap="sm" style={{ flex: 1, minWidth: 0 }}>
					<Title order={3} lineClamp={2} className={styles.title}>
						{abook.data.data.header.metadata.title ||
							resolve((t) => t.abook.view.unknown)}
					</Title>

					<Text size="sm" c="dimmed" lineClamp={2}>
						{abook.data.data.header.metadata.description ||
							resolve((t) => t.abook.view.noDescription)}
					</Text>

					<Text size="xs" c="dimmed">
						{resolve((t) =>
							t.abook.view.entryCount(
								abook.data.aggregate.totalEntries ?? 0,
							),
						)}
						{hasValidDuration && (
							<>
								{" • "}
								{resolve((t) =>
									t.abook.view.formatDuration(totalDuration),
								)}
							</>
						)}
					</Text>
				</Stack>
			</Group>
		</Card>
	)
}
