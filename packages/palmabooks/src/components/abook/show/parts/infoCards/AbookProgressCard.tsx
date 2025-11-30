import { useTransResolver } from "@/app/app.hooks"
import { Abook, WithId } from "@teawithsand/booklibr"
import { Card, Progress, Stack, Text } from "@teawithsand/mlui"
import styles from "../../abookShow.module.scss"

export interface AbookProgressCardProps {
	readonly abook: WithId<Abook>
}

export const AbookProgressCard = ({ abook }: AbookProgressCardProps) => {
	const { resolve } = useTransResolver()

	const calculateProgress = () => {
		const position = abook.data.data.header.position
		const totalDuration = abook.data.aggregate.totalDurationMillis

		if (
			!position ||
			totalDuration <= 0 ||
			position.globalOffsetMillis < 0
		) {
			return 0
		}

		const progress = (position.globalOffsetMillis / totalDuration) * 100
		return Math.min(Math.max(progress, 0), 100) // Clamp between 0 and 100
	}

	const progressPercentage = calculateProgress()

	return (
		<Card className={styles.unitCard} padding="md" shadow="sm" withBorder>
			<Stack gap="xs">
				<Text fw={500} size="sm">
					{resolve((t) => t.abook.preview.stats.progress)}
				</Text>
				<Progress
					value={progressPercentage}
					size="sm"
					radius="xs"
					color={progressPercentage === 0 ? "gray" : "blue"}
				/>
				<Text size="xs" c="dimmed">
					{progressPercentage === 0
						? resolve((t) => t.abook.preview.stats.notStarted)
						: `${progressPercentage.toFixed(1)}%`}
				</Text>
			</Stack>
		</Card>
	)
}
