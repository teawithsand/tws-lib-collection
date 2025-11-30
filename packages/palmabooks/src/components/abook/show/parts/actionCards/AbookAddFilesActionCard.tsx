import { IconPlus } from "@tabler/icons-react"
import { Abook, WithId } from "@teawithsand/booklibr"
import { Card, Stack, Text } from "@teawithsand/mlui"
import styles from "../../abookShow.module.scss"

export interface AbookAddFilesActionCardProps {
	readonly abook: WithId<Abook>
	readonly onAddFiles?: () => void
}

export const AbookAddFilesActionCard = ({
	onAddFiles,
}: AbookAddFilesActionCardProps) => {
	return (
		<Card
			className={styles.actionCard}
			padding="md"
			shadow="sm"
			withBorder
			onClick={onAddFiles}
			style={{ cursor: onAddFiles ? "pointer" : "default" }}
		>
			<Stack gap="xs" align="center">
				<IconPlus size={32} color="var(--mantine-color-orange-6)" />
				<Text fw={500} size="sm" ta="center" c="orange">
					Add Files
				</Text>
			</Stack>
		</Card>
	)
}
