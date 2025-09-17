/**
 * Component that displays metadata for abook entries based on their disposition.
 *
 * - For PLAYABLE_AUDIO: Shows duration from audio metadata
 * - For COVER_IMAGE: Shows dimensions from image metadata
 * - For unknown dispositions: Shows generic file info
 * - Always shows basic file info (size, type, modification date)
 */

import { useTransResolver } from "@/app/app.hooks"
import {
	AbookEntryDisposition,
	BlobMetadataResultType,
} from "@teawithsand/booklibr"
import { Group, Text } from "@teawithsand/mlui"
import { AbookEntryDisplayItem } from "./types"

interface AbookEntryMetadataDisplayProps {
	readonly item: AbookEntryDisplayItem
}

export const AbookEntryMetadataDisplay = ({
	item,
}: AbookEntryMetadataDisplayProps) => {
	const { resolve } = useTransResolver()

	const metadata = item.entry.data.aggregate.metadata?.metadata

	const renderBasicInfo = () => (
		<>
			{item.fileSize && (
				<Text size="xs">
					<Text span fw={500}>
						{resolve((t) => t.fileList.size)}:
					</Text>{" "}
					{resolve((t) => t.util.formatSize(item.fileSize))}
				</Text>
			)}
			{item.type && (
				<Text size="xs">
					<Text span fw={500}>
						{resolve((t) => t.fileList.type)}:
					</Text>{" "}
					{item.type}
				</Text>
			)}
			{item.lastModified && (
				<Text size="xs">
					<Text span fw={500}>
						{resolve((t) => t.fileList.modified)}:
					</Text>{" "}
					{resolve((t) => t.util.time.formatDate(item.lastModified!))}
				</Text>
			)}
		</>
	)

	// If no metadata, show just basic info
	if (!metadata) {
		return (
			<Group gap="lg" wrap="wrap">
				{renderBasicInfo()}
			</Group>
		)
	}

	const renderAudioMetadata = () => {
		if (metadata.audio.type === BlobMetadataResultType.SUCCESS) {
			const durationMillis = metadata.audio.metadata.duration
			const durationSeconds = durationMillis / 1000

			const formatDuration = (seconds: number): string => {
				const hours = Math.floor(seconds / 3600)
				const mins = Math.floor((seconds % 3600) / 60)
				const secs = Math.floor(seconds % 60)

				if (hours > 0) {
					return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
				}
				return `${mins}:${secs.toString().padStart(2, "0")}`
			}

			return (
				<Text size="xs">
					<Text span fw={500}>
						Duration:
					</Text>{" "}
					{formatDuration(durationSeconds)}
				</Text>
			)
		}
		return (
			<Text size="xs" c="dimmed">
				<Text span fw={500}>
					Duration:
				</Text>{" "}
				Unable to extract
			</Text>
		)
	}

	const renderImageMetadata = () => {
		if (metadata.image.type === BlobMetadataResultType.SUCCESS) {
			const { width, height } = metadata.image.metadata
			return (
				<Text size="xs">
					<Text span fw={500}>
						Dimensions:
					</Text>{" "}
					{width} × {height} px
				</Text>
			)
		}
		return (
			<Text size="xs" c="dimmed">
				<Text span fw={500}>
					Dimensions:
				</Text>{" "}
				Unable to extract
			</Text>
		)
	}

	const renderDispositionSpecificMetadata = () => {
		switch (item.disposition) {
			case AbookEntryDisposition.PLAYABLE_AUDIO:
				return renderAudioMetadata()
			case AbookEntryDisposition.COVER_IMAGE:
				return renderImageMetadata()
			default:
				return (
					<Text size="xs" c="dimmed">
						<Text span fw={500}>
							File Type:
						</Text>{" "}
						Unknown disposition
					</Text>
				)
		}
	}

	return (
		<Group gap="lg" wrap="wrap">
			{renderBasicInfo()}
			{renderDispositionSpecificMetadata()}
		</Group>
	)
}
