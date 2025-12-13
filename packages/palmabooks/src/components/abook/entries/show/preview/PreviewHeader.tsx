import { useTransResolver } from "@/app/app.hooks"
import { AbookEntry, WithId } from "@teawithsand/booklibr"
import { Box, Group, Text, ThemeIcon, Title } from "@teawithsand/mlui"
import { getDispositionColor, getDispositionIcon } from "./dispositionUtils"
import styles from "./PreviewHeader.module.scss"

export interface PreviewHeaderProps {
	readonly entry: WithId<AbookEntry>
}

export const PreviewHeader = ({ entry }: PreviewHeaderProps) => {
	const { resolve } = useTransResolver()
	const { data } = entry.data

	return (
		<Group gap="md" align="flex-start" wrap="nowrap">
			<ThemeIcon
				size="xl"
				radius="md"
				color={getDispositionColor(data.disposition)}
				className={styles.icon}
			>
				{getDispositionIcon(data.disposition)}
			</ThemeIcon>
			<Box style={{ flex: 1, minWidth: 0 }}>
				<Title order={3} className={styles.title}>
					{data.name ||
						resolve((t) => t.abook.entries.preview.untitled)}
				</Title>
				<Text size="xs" c="dimmed" className={styles.ordinal}>
					{resolve((t) => t.abook.entries.preview.ordinal)}:{" "}
					{data.ordinalNumber}
				</Text>
			</Box>
		</Group>
	)
}
