import { useTransResolver } from "@/app/app.hooks"
import { IconTrash } from "@tabler/icons-react"
import {
	Abook,
	AbookEntry,
	AbookEntryDisposition,
	BlobMetadataResultType,
	WithId,
} from "@teawithsand/booklibr"
import { Button, Group, Modal, Stack, Text } from "@teawithsand/mlui"
import styles from "./AbookEntryShowModal.module.scss"
import { DispositionBadge } from "./preview/DispositionBadge"
import { FileInfoSection } from "./preview/FileInfoSection"
import { PreviewHeader } from "./preview/PreviewHeader"
import { SourceInfoSection } from "./preview/SourceInfoSection"
import { TimestampsSection } from "./preview/TimestampsSection"

export interface AbookEntryShowModalProps {
	readonly opened: boolean
	readonly onClose: () => void
	readonly abook: WithId<Abook | null>
	readonly entry: WithId<AbookEntry | null>
	readonly onDeleteClick?: () => void
}

/**
 * Modal component for showing audiobook entry details.
 * Shows entry information including disposition, metadata, and file details.
 * Includes delete functionality with confirmation modal.
 * Uses mobile-first design principles.
 */
export const AbookEntryShowModal = ({
	opened,
	onClose,
	abook,
	entry,
	onDeleteClick,
}: AbookEntryShowModalProps) => {
	const { resolve } = useTransResolver()

	if (!entry.data) {
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
				<PreviewHeader entry={entry as WithId<AbookEntry>} />

				<DispositionBadge disposition={data.disposition} />

				<FileInfoSection
					entry={entry as WithId<AbookEntry>}
					duration={duration}
				/>

				<SourceInfoSection entry={entry as WithId<AbookEntry>} />

				<TimestampsSection entry={entry as WithId<AbookEntry>} />

				<Group justify="space-between" gap="md" mt="md">
					<Button
						color="red"
						variant="light"
						leftSection={<IconTrash size={16} />}
						onClick={() => {
							if (abook.data && entry.data && onDeleteClick) {
								onDeleteClick()
							}
						}}
						disabled={!abook.data || !entry.data || !onDeleteClick}
					>
						Delete
					</Button>
					<Button onClick={onClose} variant="filled">
						{resolve((t) => t.abook.entries.preview.closeButton)}
					</Button>
				</Group>
			</Stack>
		</Modal>
	)
}
