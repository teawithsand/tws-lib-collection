import { useTransResolver } from "@/app/app.hooks"
import { Routes } from "@/router/routes"
import { IconBook } from "@tabler/icons-react"
import type { Abook, WithId } from "@teawithsand/booklibr"
import { Card, Group, Link, Stack, Text, Title } from "@teawithsand/mlui"
import { useMemo } from "react"
import styles from "./AbookListCard.module.scss"

export interface AbookListCardProps {
	abook: WithId<Abook>
}

/**
 * Card component for displaying individual audiobook information.
 */
export const AbookListCard = ({ abook }: AbookListCardProps) => {
	const { resolve } = useTransResolver()

	const entryCountText = useMemo(() => {
		const count = abook.data.aggregate.totalEntries
		return resolve((t) => t.abooks.list.entryCountText(count))
	}, [abook.data.aggregate.totalEntries, resolve])

	const durationText = useMemo(() => {
		const durationMillis = abook.data.aggregate.totalDurationMillis
		return resolve((t) => t.abooks.list.formatDuration(durationMillis))
	}, [abook.data.aggregate.totalDurationMillis, resolve])

	const abookShowLink = Routes.abookShow.navigate(abook.id.toString())

	return (
		<Card
			padding="lg"
			radius="md"
			withBorder
			component={Link}
			to={abookShowLink}
			className={styles.card}
		>
			<Group align="flex-start" wrap="nowrap">
				<IconBook size={32} color="var(--mantine-color-blue-6)" />
				<Stack gap="xs" className={styles.stack}>
					<Title order={4}>
						{abook.data.data.header.metadata.title}
					</Title>
					<Text size="sm" c="dimmed">
						{abook.data.data.header.metadata.description}
					</Text>
					<Group gap="xs">
						<Text size="xs" c="dimmed">
							{entryCountText}
						</Text>
						<Text size="xs" c="dimmed">
							•
						</Text>
						<Text size="xs" c="dimmed">
							{durationText}
						</Text>
					</Group>
				</Stack>
			</Group>
		</Card>
	)
}
