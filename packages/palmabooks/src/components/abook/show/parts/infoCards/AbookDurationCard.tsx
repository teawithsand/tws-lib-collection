import { useTransResolver } from "@/app/app.hooks"
import { Abook, WithId } from "@teawithsand/booklibr"
import { Card, Text } from "@teawithsand/mlui"
import styles from "../../abookShow.module.scss"

export interface AbookDurationCardProps {
	readonly abook: WithId<Abook>
}

export const AbookDurationCard = ({ abook }: AbookDurationCardProps) => {
	const { resolve } = useTransResolver()

	const formatDurationWithFallback = (milliseconds: number) => {
		if (milliseconds <= 0 || milliseconds === -1) {
			return resolve((t) => t.abook.view.unknown)
		}

		return resolve((t) => t.abook.view.formatDuration(milliseconds))
	}

	return (
		<Card className={styles.unitCard} padding="md" shadow="sm" withBorder>
			<Text fw={500} size="sm" mb="xs">
				{resolve((t) => t.abook.preview.stats.duration)}
			</Text>
			<Text size="sm" c="dimmed">
				{formatDurationWithFallback(
					abook.data.aggregate.totalDurationMillis,
				)}
			</Text>
		</Card>
	)
}
