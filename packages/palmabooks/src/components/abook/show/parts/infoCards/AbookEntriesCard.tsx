import { useTransResolver } from "@/app/app.hooks"
import { Abook, WithId } from "@teawithsand/booklibr"
import { Card, Text } from "@teawithsand/mlui"
import styles from "../../abookShow.module.scss"

export interface AbookEntriesCardProps {
	readonly abook: WithId<Abook>
}

export const AbookEntriesCard = ({ abook }: AbookEntriesCardProps) => {
	const { resolve } = useTransResolver()

	return (
		<Card className={styles.unitCard} padding="md" shadow="sm" withBorder>
			<Text fw={500} size="sm" mb="xs">
				{resolve((t) => t.abook.preview.stats.entries)}
			</Text>
			<Text size="sm" c="dimmed">
				{resolve((t) =>
					t.abook.view.entryCount(abook.data.aggregate.totalEntries),
				)}
			</Text>
		</Card>
	)
}
