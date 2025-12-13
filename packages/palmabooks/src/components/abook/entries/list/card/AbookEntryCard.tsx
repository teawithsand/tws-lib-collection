import { useTransResolver } from "@/app/app.hooks"
import {
	IconClock,
	IconFileMusic,
	IconFileText,
	IconPhoto,
	IconQuestionMark,
} from "@tabler/icons-react"
import {
	AbookEntry,
	AbookEntryDisposition,
	BlobMetadataResultType,
	WithId,
} from "@teawithsand/booklibr"
import { Card, Group, Stack, Text, ThemeIcon } from "@teawithsand/mlui"
import { ReactNode } from "react"
import styles from "./AbookEntryCard.module.scss"

export interface AbookEntryCardProps {
	readonly entry: WithId<AbookEntry>
}

const getDispositionIcon = (disposition: AbookEntryDisposition): ReactNode => {
	switch (disposition) {
		case AbookEntryDisposition.PLAYABLE_AUDIO:
			return <IconFileMusic size={20} />
		case AbookEntryDisposition.COVER_IMAGE:
			return <IconPhoto size={20} />
		case AbookEntryDisposition.DESCRIPTION:
			return <IconFileText size={20} />
		case AbookEntryDisposition.UNKNOWN:
		default:
			return <IconQuestionMark size={20} />
	}
}

const getDispositionColor = (disposition: AbookEntryDisposition): string => {
	switch (disposition) {
		case AbookEntryDisposition.PLAYABLE_AUDIO:
			return "blue"
		case AbookEntryDisposition.COVER_IMAGE:
			return "grape"
		case AbookEntryDisposition.DESCRIPTION:
			return "cyan"
		case AbookEntryDisposition.UNKNOWN:
		default:
			return "gray"
	}
}

const formatFileSize = (bytes: number | null | undefined): string => {
	if (!bytes || bytes <= 0) return "Unknown"

	const units = ["B", "KB", "MB", "GB"]
	let size = bytes
	let unitIndex = 0

	while (size >= 1024 && unitIndex < units.length - 1) {
		size /= 1024
		unitIndex++
	}

	return `${size.toFixed(1)} ${units[unitIndex]}`
}

const formatDuration = (milliseconds: number | null | undefined): string => {
	if (!milliseconds || milliseconds <= 0) return "Unknown"

	const totalSeconds = Math.floor(milliseconds / 1000)
	const hours = Math.floor(totalSeconds / 3600)
	const minutes = Math.floor((totalSeconds % 3600) / 60)
	const seconds = totalSeconds % 60

	if (hours > 0) {
		return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
	}
	return `${minutes}:${String(seconds).padStart(2, "0")}`
}

/**
 * Individual audiobook entry card component for list display.
 * Mobile-first design with disposition icon and metadata.
 */
export const AbookEntryCard = ({ entry }: AbookEntryCardProps) => {
	const { resolve } = useTransResolver()
	const { data, aggregate } = entry.data

	const audioMetadata = aggregate.metadata?.metadata.audio
	const duration =
		data.disposition === AbookEntryDisposition.PLAYABLE_AUDIO &&
		audioMetadata?.type === BlobMetadataResultType.SUCCESS
			? audioMetadata.metadata.duration
			: null

	return (
		<Card padding="md" shadow="sm" withBorder className={styles.card}>
			<Group gap="md" align="flex-start" wrap="nowrap">
				<ThemeIcon
					size="lg"
					radius="md"
					color={getDispositionColor(data.disposition)}
					className={styles.icon}
				>
					{getDispositionIcon(data.disposition)}
				</ThemeIcon>

				<Stack gap="xs" style={{ flex: 1, minWidth: 0 }}>
					<Group justify="space-between" wrap="nowrap">
						<Text fw={600} lineClamp={1} className={styles.name}>
							{data.name || resolve((t) => t.abook.view.unknown)}
						</Text>
						<Text size="xs" c="dimmed" className={styles.ordinal}>
							#{data.ordinalNumber}
						</Text>
					</Group>

					<Group gap="md" wrap="wrap">
						{aggregate.blobSize !== null && (
							<Group gap="xs">
								<Text size="xs" c="dimmed">
									{formatFileSize(aggregate.blobSize)}
								</Text>
							</Group>
						)}

						{duration && (
							<Group gap="xs">
								<IconClock size={14} />
								<Text size="xs" c="dimmed">
									{formatDuration(duration)}
								</Text>
							</Group>
						)}
					</Group>
				</Stack>
			</Group>
		</Card>
	)
}
