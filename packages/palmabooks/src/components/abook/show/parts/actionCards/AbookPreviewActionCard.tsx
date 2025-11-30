import { IconEye } from "@tabler/icons-react"
import { Abook, WithId } from "@teawithsand/booklibr"
import { Card, Stack, Text } from "@teawithsand/mlui"
import styles from "../../abookShow.module.scss"

export interface AbookPreviewActionCardProps {
	readonly abook: WithId<Abook>
	readonly onPreview?: () => void
}

export const AbookPreviewActionCard = ({
	onPreview,
}: AbookPreviewActionCardProps) => {
	return (
		<Card
			className={styles.actionCard}
			padding="md"
			shadow="sm"
			withBorder
			onClick={onPreview}
			style={{ cursor: onPreview ? "pointer" : "default" }}
		>
			<Stack gap="xs" align="center">
				<IconEye size={32} color="var(--mantine-color-green-6)" />
				<Text fw={500} size="sm" ta="center" c="green">
					Preview Files
				</Text>
			</Stack>
		</Card>
	)
}
