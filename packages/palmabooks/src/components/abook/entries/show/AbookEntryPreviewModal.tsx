import { useTransResolver } from "@/app/app.hooks"
import {
	AbookEntry,
	AbookEntryDisposition,
	BlobMetadataResultType,
	WithId,
} from "@teawithsand/booklibr"
import { Button, Group, Modal, Stack, Text } from "@teawithsand/mlui"
import styles from "./AbookEntryPreviewModal.module.scss"
import { DispositionBadge } from "./preview/DispositionBadge"
import { FileInfoSection } from "./preview/FileInfoSection"
import { PreviewHeader } from "./preview/PreviewHeader"
import { SourceInfoSection } from "./preview/SourceInfoSection"
import { TimestampsSection } from "./preview/TimestampsSection"

export interface AbookEntryPreviewModalProps {
	readonly opened: boolean
	readonly onClose: () => void
	readonly entry: WithId<AbookEntry> | null
}

/**
 * Modal component for previewing audiobook entry details.
 * Shows entry information including disposition, metadata, and file details.
 * Uses mobile-first design principles.
 */
export const AbookEntryPreviewModal = ({
	opened,
	onClose,
	entry,
}: AbookEntryPreviewModalProps) => {
	const { resolve } = useTransResolver()

	if (!entry) {
		return (
			<Modal
				opened={opened}
				onClose={onClose}
				title={resolve((t) => t.abook.entries.preview.title)}
				centered
				size="md"
				classNames={{ body: styles.modalBody }}
			>
				<Stack gap="md" align="center">
					<Text size="sm" c="dimmed">
						{resolve((t) => t.abook.entries.preview.noEntry)}
					</Text>
					<Button onClick={onClose} variant="light">
						{resolve((t) => t.abook.entries.preview.closeButton)}
					</Button>
				</Stack>
			</Modal>
		)
	}

	const { data, aggregate } = entry.data
	const audioMetadata = aggregate.metadata?.metadata.audio
	const duration =
		data.disposition === AbookEntryDisposition.PLAYABLE_AUDIO &&
		audioMetadata?.type === BlobMetadataResultType.SUCCESS
			? audioMetadata.metadata.duration
			: null

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title={resolve((t) => t.abook.entries.preview.title)}
			centered
			size="md"
			classNames={{ body: styles.modalBody }}
		>
			<Stack gap="lg">
				<PreviewHeader entry={entry} />

				<DispositionBadge disposition={data.disposition} />

				<FileInfoSection entry={entry} duration={duration} />

				<SourceInfoSection entry={entry} />

				<TimestampsSection entry={entry} />

				<Group justify="flex-end" gap="md" mt="md">
					<Button onClick={onClose} variant="filled">
						{resolve((t) => t.abook.entries.preview.closeButton)}
					</Button>
				</Group>
			</Stack>
		</Modal>
	)
}
