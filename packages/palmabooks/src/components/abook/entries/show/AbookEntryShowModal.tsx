import { useTransResolver } from "@/app/app.hooks"
import { AutonomousGlobalErrorFallback } from "@/components/globalErrorFallback"
import { IconTrash } from "@tabler/icons-react"
import {
	Abook,
	AbookEntry,
	AbookEntryDisposition,
	BlobMetadataResultType,
	WithId,
} from "@teawithsand/booklibr"
import {
	Button,
	ErrorBoundary,
	Group,
	LoadingFallbackVariant,
	LoadingSuspenseBoundary,
	Modal,
	Stack,
	Text,
} from "@teawithsand/mlui"
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
	readonly entry: WithId<AbookEntry> | null
	readonly onDeleteClick?: () => void
}

type AbookEntryShowModalContentProps = Omit<AbookEntryShowModalProps, "opened">

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
	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title={
				<LoadingSuspenseBoundary
					variant={LoadingFallbackVariant.Inline}
				>
					<AbookEntryShowModalTitle />
				</LoadingSuspenseBoundary>
			}
			centered
			size="md"
			classNames={{ body: styles.modalBody }}
		>
			<LoadingSuspenseBoundary variant={LoadingFallbackVariant.Inline}>
				<ErrorBoundary fallback={<AutonomousGlobalErrorFallback />}>
					<AbookEntryShowModalContent
						onClose={onClose}
						abook={abook}
						entry={entry}
						onDeleteClick={onDeleteClick}
					/>
				</ErrorBoundary>
			</LoadingSuspenseBoundary>
		</Modal>
	)
}

const AbookEntryShowModalTitle = () => {
	const { resolve } = useTransResolver()
	return <>{resolve((t) => t.abook.entries.preview.title)}</>
}

const AbookEntryShowModalContent = ({
	onClose,
	abook,
	entry,
	onDeleteClick,
}: AbookEntryShowModalContentProps) => {
	const { resolve } = useTransResolver()

	if (!entry) {
		return (
			<Stack gap="md" align="center">
				<Text size="sm" c="dimmed">
					{resolve((t) => t.abook.entries.preview.noEntry)}
				</Text>
				<Button onClick={onClose} variant="light">
					{resolve((t) => t.abook.entries.preview.closeButton)}
				</Button>
			</Stack>
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
		<Stack gap="lg">
			<PreviewHeader entry={entry} />

			<DispositionBadge disposition={data.disposition} />

			<FileInfoSection entry={entry} duration={duration} />

			<SourceInfoSection entry={entry} />

			<TimestampsSection entry={entry} />

			<Group justify="space-between" gap="md" mt="md">
				<Button
					color="red"
					variant="light"
					leftSection={<IconTrash size={16} />}
					onClick={() => {
						if (abook.data && onDeleteClick) {
							onDeleteClick()
						}
					}}
					disabled={!abook.data || !onDeleteClick}
				>
					{resolve((t) => t.abook.entries.delete.deleteButton)}
				</Button>
				<Button onClick={onClose} variant="filled">
					{resolve((t) => t.abook.entries.preview.closeButton)}
				</Button>
			</Group>
		</Stack>
	)
}
