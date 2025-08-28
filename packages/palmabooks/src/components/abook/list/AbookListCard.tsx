import { useTransResolver } from "@/app/app.hooks"
import { Routes } from "@/router/routes"
import { IconBook, IconClock, IconHeadphones } from "@tabler/icons-react"
import type { Abook, WithId } from "@teawithsand/booklibr"
import { Badge, Card, Group, Link, Stack, Text, Title } from "@teawithsand/mlui"
import { useMemo } from "react"
import styles from "./AbookListCard.module.scss"

export interface AbookListCardProps {
	abook: WithId<Abook>
}

export const AbookListCard = ({ abook }: AbookListCardProps) => {
	const { resolve } = useTransResolver()

	const entryCountText = useMemo(() => {
		const count = abook.data.aggregate.totalEntries
		return resolve((t) => t.abooks.list.entryCountText(count))
	}, [abook.data.aggregate.totalEntries, resolve])

	const durationText = useMemo(() => {
		const durationMillis = abook.data.aggregate.totalDurationMillis
		return resolve((t) => t.util.time.formatDuration(durationMillis))
	}, [abook.data.aggregate.totalDurationMillis, resolve])

	const abookShowLink = Routes.abookShow.navigate(abook.id.toString())
	const createdDate = resolve((t) =>
		t.util.time.formatDate(abook.data.data.header.createdAt),
	)
	const statusText =
		abook.data.aggregate.totalEntries > 1
			? resolve((t) => t.abooks.list.statusMultiPart)
			: resolve((t) => t.abooks.list.statusSingle)

	return (
		<Card
			padding="xl"
			radius="lg"
			withBorder
			shadow="sm"
			component={Link}
			to={abookShowLink}
			className={styles.card}
		>
			<Stack gap="md">
				<Group justify="space-between" align="flex-start">
					<Group
						align="flex-start"
						gap="md"
						className={styles.mainContent}
					>
						<div className={styles.iconWrapper}>
							<IconBook size={40} className={styles.bookIcon} />
						</div>

						<Stack gap="xs" className={styles.contentStack}>
							<Title order={3} className={styles.title}>
								{abook.data.data.header.metadata.title}
							</Title>

							{abook.data.data.header.metadata.description && (
								<Text
									size="sm"
									c="dimmed"
									className={styles.description}
									lineClamp={2}
								>
									{
										abook.data.data.header.metadata
											.description
									}
								</Text>
							)}
						</Stack>
					</Group>

					<Badge
						variant="light"
						color="blue"
						size="sm"
						className={styles.statusBadge}
					>
						{statusText}
					</Badge>
				</Group>

				<Group
					justify="space-between"
					align="center"
					className={styles.footer}
				>
					<Group gap="lg" className={styles.stats}>
						<Group gap="xs" className={styles.statItem}>
							<IconHeadphones
								size={16}
								className={styles.statIcon}
							/>
							<Text size="sm" className={styles.statText}>
								{entryCountText}
							</Text>
						</Group>

						<Group gap="xs" className={styles.statItem}>
							<IconClock size={16} className={styles.statIcon} />
							<Text size="sm" className={styles.statText}>
								{durationText}
							</Text>
						</Group>
					</Group>

					<Text size="xs" c="dimmed" className={styles.createdDate}>
						{createdDate}
					</Text>
				</Group>
			</Stack>
		</Card>
	)
}
