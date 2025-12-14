import { useTransResolver } from "@/app/app.hooks"
import { Abook, AbookEntry } from "@teawithsand/booklibr"
import { Modal } from "@teawithsand/mlui"
import { AbookEntryDeleteErrorContent } from "./AbookEntryDeleteErrorContent"
import styles from "./AbookEntryDeleteModal.module.scss"
import { AbookEntryDeleteModalContent } from "./AbookEntryDeleteModalContent"
import { AbookEntryDeleteNoEntryContent } from "./AbookEntryDeleteNoEntryContent"
import { AbookEntryDeleteSuccessContent } from "./AbookEntryDeleteSuccessContent"

export interface AbookEntryDeleteModalProps {
	readonly opened: boolean
	readonly onClose: () => void
	readonly abook: Abook | null
	readonly entry: AbookEntry | null
	readonly onDelete: () => void | Promise<void>
	readonly isDeleting?: boolean
	readonly deleteError?: string | null
	readonly deleteSuccess?: boolean
}

/**
 * Modal component for deleting audiobook entries.
 * Shows a confirmation dialog with entry details and handles the deletion process.
 * Uses mobile-first design principles.
 * Composed of smaller content components for each state.
 */
export const AbookEntryDeleteModal = ({
	opened,
	onClose,
	abook,
	entry,
	onDelete,
	isDeleting = false,
	deleteError = null,
	deleteSuccess = false,
}: AbookEntryDeleteModalProps) => {
	const { resolve } = useTransResolver()

	const handleClose = () => {
		if (!isDeleting) {
			onClose()
		}
	}

	const renderContent = () => {
		if (!entry || !abook) {
			return <AbookEntryDeleteNoEntryContent onClose={handleClose} />
		}

		if (deleteSuccess) {
			return <AbookEntryDeleteSuccessContent />
		}

		if (deleteError) {
			return (
				<AbookEntryDeleteErrorContent
					error={deleteError}
					onClose={handleClose}
					onRetry={onDelete}
				/>
			)
		}

		return (
			<AbookEntryDeleteModalContent
				abook={abook}
				entry={entry}
				onClose={handleClose}
				onDelete={onDelete}
				isDeleting={isDeleting}
			/>
		)
	}

	return (
		<Modal
			opened={opened}
			onClose={handleClose}
			title={
				deleteSuccess
					? null
					: resolve((t) => t.abook.entries.delete.modalTitle)
			}
			centered
			size="md"
			className={styles["abook-entry-delete-modal"]}
			closeOnClickOutside={!isDeleting}
			closeOnEscape={!isDeleting}
		>
			{renderContent()}
		</Modal>
	)
}
