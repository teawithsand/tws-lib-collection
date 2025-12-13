import { useTransResolver } from "@/app/app.hooks"
import { AbookEntry, WithId } from "@teawithsand/booklibr"
import { Badge, Box, Group, Stack, Text, Title } from "@teawithsand/mlui"
import styles from "./SourceInfoSection.module.scss"

export interface SourceInfoSectionProps {
	readonly entry: WithId<AbookEntry>
}

export const SourceInfoSection = ({ entry }: SourceInfoSectionProps) => {
	const { resolve } = useTransResolver()
	const { data } = entry.data

	return (
		<Box className={styles.infoSection}>
			<Title order={5} mb="xs">
				{resolve((t) => t.abook.entries.preview.sourceInfo)}
			</Title>
			<Stack gap="xs">
				<Group justify="space-between">
					<Text size="sm" c="dimmed">
						{resolve((t) => t.abook.entries.preview.sourceType)}:
					</Text>
					<Badge variant="outline">
						{data.source.type.toUpperCase()}
					</Badge>
				</Group>
				{data.source.type === "upload" && (
					<>
						{data.source.uploadFileName && (
							<Group justify="space-between">
								<Text size="sm" c="dimmed">
									{resolve(
										(t) =>
											t.abook.entries.preview
												.uploadFileName,
									)}
									:
								</Text>
								<Text size="sm" className={styles.fileName}>
									{data.source.uploadFileName}
								</Text>
							</Group>
						)}
						{data.source.uploadFileMime && (
							<Group justify="space-between">
								<Text size="sm" c="dimmed">
									{resolve(
										(t) => t.abook.entries.preview.mimeType,
									)}
									:
								</Text>
								<Text size="sm">
									{data.source.uploadFileMime}
								</Text>
							</Group>
						)}
					</>
				)}
				{data.source.type === "url" && data.source.url && (
					<Group justify="space-between">
						<Text size="sm" c="dimmed">
							{resolve((t) => t.abook.entries.preview.url)}:
						</Text>
						<Text
							size="sm"
							className={styles.urlText}
							component="a"
							href={data.source.url}
							target="_blank"
							rel="noopener noreferrer"
						>
							{resolve((t) => t.abook.entries.preview.openLink)}
						</Text>
					</Group>
				)}
			</Stack>
		</Box>
	)
}
