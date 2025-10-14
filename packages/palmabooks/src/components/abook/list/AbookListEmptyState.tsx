import { useTransResolver } from "@/app/app.hooks"
import { Stack, Text } from "@teawithsand/mlui"
import styles from "./abookListEmptyState.module.scss"

export const AbookListEmptyState = () => {
	const { resolve } = useTransResolver()

	return (
		<div className={styles.container}>
			<Stack
				align="center"
				gap="md"
				py="xl"
				className={styles.emptyState}
			>
				<Text size="lg" c="dimmed">
					{resolve((t) => t.abook.list.emptyState.noAudiobooks)}
				</Text>
				<Text size="sm" c="dimmed">
					{resolve((t) => t.abook.list.emptyState.createFirst)}
				</Text>
			</Stack>
		</div>
	)
}
