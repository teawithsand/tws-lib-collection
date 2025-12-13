import { useTransResolver } from "@/app/app.hooks"
import { AbookEntry, WithId } from "@teawithsand/booklibr"
import { Box, Group, Stack, Text, Title } from "@teawithsand/mlui"
import styles from "./FileInfoSection.module.scss"

export interface FileInfoSectionProps {
	readonly entry: WithId<AbookEntry>
	readonly duration: number | null
}

export const FileInfoSection = ({ entry, duration }: FileInfoSectionProps) => {
	const { resolve } = useTransResolver()
	const { aggregate } = entry.data

	return (
		<Box className={styles.infoSection}>
			<Title order={5} mb="xs">
				{resolve((t) => t.abook.entries.preview.fileInfo)}
			</Title>
			<Stack gap="xs">
				<Group justify="space-between">
					<Text size="sm" c="dimmed">
						{resolve((t) => t.abook.entries.preview.fileSize)}:
					</Text>
					<Text size="sm">
						{resolve((t) =>
							t.util.formatSize(aggregate.blobSize ?? undefined),
						)}
					</Text>
				</Group>
				{duration !== null && (
					<Group justify="space-between">
						<Text size="sm" c="dimmed">
							{resolve((t) => t.abook.entries.preview.duration)}:
						</Text>
						<Text size="sm">
							{resolve((t) =>
								t.util.formatDuration(duration as number),
							)}
						</Text>
					</Group>
				)}
			</Stack>
		</Box>
	)
}
