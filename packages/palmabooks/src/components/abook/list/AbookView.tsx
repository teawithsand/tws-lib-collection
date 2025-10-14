import { useTransResolver } from "@/app/app.hooks"
import { Abook, WithId } from "@teawithsand/booklibr"
import { Badge, Card, Group, Stack, Text, Title } from "@teawithsand/mlui"
import styles from "./AbookView.module.scss"

interface AbookViewProps {
	readonly abook: WithId<Abook>
}

/**
 * Component for displaying a single audiobook item with minimal styling.
 * Shows title, description, duration, and entry count in a card layout.
 */
export const AbookView = ({ abook }: AbookViewProps) => {
	const { resolve } = useTransResolver()
	const { data: abookData } = abook
	const { header } = abookData.data
	const { aggregate } = abookData

	const formatDate = (timestamp: number) => {
		return new Date(timestamp).toLocaleDateString()
	}

	const hasPosition = header.position !== null
	const duration = resolve((t) =>
		t.abook.view.formatDuration(aggregate.totalDurationMillis),
	)
	const createdAt = formatDate(header.createdAt.toNumberMillis())

	return (
		<Card
			shadow="sm"
			padding="md"
			radius="md"
			withBorder
			className={styles.card}
		>
			<Stack gap="sm">
				<div className={styles.header}>
					<Title order={3} className={styles.title}>
						{header.metadata.title}
					</Title>
					{hasPosition && (
						<Badge size="sm" variant="dot" color="blue">
							{resolve((t) => t.abook.view.inProgress)}
						</Badge>
					)}
				</div>

				{header.metadata.description && (
					<Text
						size="sm"
						c="dimmed"
						lineClamp={2}
						className={styles.description}
					>
						{header.metadata.description}
					</Text>
				)}

				<Group
					justify="space-between"
					gap="xs"
					className={styles.footer}
				>
					<Group gap="xs">
						<Badge size="xs" variant="light" color="gray">
							{resolve((t) =>
								t.abook.view.entryCount(aggregate.totalEntries),
							)}
						</Badge>
						<Badge size="xs" variant="light" color="teal">
							{duration}
						</Badge>
					</Group>
					<Text size="xs" c="dimmed">
						{createdAt}
					</Text>
				</Group>

				{header.metadata.privateUserNote && (
					<Text
						size="xs"
						fs="italic"
						c="dimmed"
						className={styles.note}
					>
						{resolve((t) => t.abook.view.notePrefix)}{" "}
						{header.metadata.privateUserNote}
					</Text>
				)}
			</Stack>
		</Card>
	)
}
