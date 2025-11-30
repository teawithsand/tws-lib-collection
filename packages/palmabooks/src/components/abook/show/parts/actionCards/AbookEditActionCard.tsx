import { IconEdit } from "@tabler/icons-react"
import { Abook, WithId } from "@teawithsand/booklibr"
import { Card, Stack, Text } from "@teawithsand/mlui"
import styles from "../../abookShow.module.scss"

export interface AbookEditActionCardProps {
	readonly abook: WithId<Abook>
	readonly onEdit?: () => void
}

export const AbookEditActionCard = ({ onEdit }: AbookEditActionCardProps) => {
	return (
		<Card
			className={styles.actionCard}
			padding="md"
			shadow="sm"
			withBorder
			onClick={onEdit}
			style={{ cursor: onEdit ? "pointer" : "default" }}
		>
			<Stack gap="xs" align="center">
				<IconEdit size={32} color="var(--mantine-color-blue-6)" />
				<Text fw={500} size="sm" ta="center" c="blue">
					Edit Metadata
				</Text>
			</Stack>
		</Card>
	)
}
