import { useTransResolver } from "@/app/app.hooks"
import { AbookEntry, WithId } from "@teawithsand/booklibr"
import { Box, Group, Stack, Text, Title } from "@teawithsand/mlui"
import styles from "./TimestampsSection.module.scss"

export interface TimestampsSectionProps {
	readonly entry: WithId<AbookEntry>
}

export const TimestampsSection = ({ entry }: TimestampsSectionProps) => {
	const { resolve } = useTransResolver()
	const { data } = entry.data

	return (
		<Box className={styles.infoSection}>
			<Title order={5} mb="xs">
				{resolve((t) => t.abook.entries.preview.timestamps)}
			</Title>
			<Stack gap="xs">
				<Group justify="space-between">
					<Text size="sm" c="dimmed">
						{resolve((t) => t.abook.entries.preview.createdAt)}:
					</Text>
					<Text size="sm">
						{new Date(
							data.createdAt.toNumberMillis(),
						).toLocaleString()}
					</Text>
				</Group>
				{data.source.type === "upload" && (
					<Group justify="space-between">
						<Text size="sm" c="dimmed">
							{resolve((t) => t.abook.entries.preview.uploadedAt)}
							:
						</Text>
						<Text size="sm">
							{new Date(
								data.source.uploadedAt.toNumberMillis(),
							).toLocaleString()}
						</Text>
					</Group>
				)}
			</Stack>
		</Box>
	)
}
