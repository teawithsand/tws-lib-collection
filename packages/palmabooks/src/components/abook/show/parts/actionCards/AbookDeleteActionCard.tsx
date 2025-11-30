import { IconTrash } from "@tabler/icons-react"
import { Abook, WithId } from "@teawithsand/booklibr"
import { Card, Stack, Text } from "@teawithsand/mlui"
import styles from "../../abookShow.module.scss"

export interface AbookDeleteActionCardProps {
	readonly abook: WithId<Abook>
	readonly onDelete?: () => void
}

export const AbookDeleteActionCard = ({
	onDelete,
}: AbookDeleteActionCardProps) => {
	return (
		<Card
			className={styles.actionCard}
			padding="md"
			shadow="sm"
			withBorder
			onClick={onDelete}
			style={{ cursor: onDelete ? "pointer" : "default" }}
		>
			<Stack gap="xs" align="center">
				<IconTrash size={32} color="var(--mantine-color-red-6)" />
				<Text fw={500} size="sm" ta="center" c="red">
					Delete Audiobook
				</Text>
			</Stack>
		</Card>
	)
}
