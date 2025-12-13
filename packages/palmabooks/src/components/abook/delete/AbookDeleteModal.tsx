import { useTransResolver } from "@/app/app.hooks"
import { IconAlertTriangle, IconCheck, IconTrash } from "@tabler/icons-react"
import { Abook } from "@teawithsand/booklibr"
import {
	Alert,
	Button,
	Group,
	Loader,
	Modal,
	Stack,
	Text,
	Title,
} from "@teawithsand/mlui"
import styles from "./AbookDeleteModal.module.scss"

export interface AbookDeleteModalProps {
	readonly opened: boolean
	readonly onClose: () => void
	readonly abook: Abook | null
	readonly onDelete: () => void | Promise<void>
	readonly isDeleting?: boolean
	readonly deleteError?: string | null
	readonly deleteSuccess?: boolean
}

/**
 * Modal component for deleting audiobooks.
 * Shows a confirmation dialog with audiobook details and handles the deletion process.
 */
export const AbookDeleteModal = ({
	opened,
	onClose,
	abook,
	onDelete,
	isDeleting = false,
	deleteError = null,
	deleteSuccess = false,
}: AbookDeleteModalProps) => {
	const { resolve } = useTransResolver()

	const handleClose = () => {
		if (!isDeleting) {
			onClose()
		}
	}

	const renderContent = () => {
		if (!abook) {
			return (
				<Stack gap="md" align="center">
					<Alert
						icon={<IconAlertTriangle size="1rem" />}
						title={resolve((t) => t.abook.delete.errorTitle)}
						color="orange"
					>
						<Text size="sm">
							{resolve((t) => t.abook.delete.noAbookSelected)}
						</Text>
					</Alert>
					<Button onClick={handleClose} variant="light">
						{resolve((t) => t.abook.delete.closeButton)}
					</Button>
				</Stack>
			)
		}

		// Show deletion success message
		if (deleteSuccess) {
			return (
				<Stack gap="md" align="center">
					<IconCheck size={48} color="green" />
					<Title order={3} ta="center">
						{resolve((t) => t.abook.delete.successTitle)}
					</Title>
					<Text size="sm" c="dimmed" ta="center">
						{resolve((t) => t.abook.delete.successMessage)}
					</Text>
					<Text size="xs" c="dimmed" ta="center">
						Redirecting to home page...
					</Text>
				</Stack>
			)
		}

		// Show deletion error
		if (deleteError) {
			return (
				<Stack gap="md">
					<Alert
						icon={<IconAlertTriangle size="1rem" />}
						title={resolve((t) => t.abook.delete.errorTitle)}
						color="red"
					>
						<Text size="sm">{deleteError}</Text>
					</Alert>
					<Group justify="flex-end" gap="md">
						<Button onClick={handleClose} variant="light">
							{resolve((t) => t.abook.delete.closeButton)}
						</Button>
						<Button
							color="red"
							leftSection={<IconTrash size={16} />}
							onClick={onDelete}
						>
							{resolve((t) => t.abook.delete.deleteButton)}
						</Button>
					</Group>
				</Stack>
			)
		}

		// Show confirmation dialog
		return (
			<Stack gap="md">
				<div className={styles["abook-info"]}>
					<Text size="lg" fw={500}>
						{abook.data.header.metadata.title ||
							resolve((t) => t.abook.show.noTitle)}
					</Text>
					{abook.aggregate && (
						<Text size="sm" c="dimmed">
							{abook.aggregate.totalEntries}{" "}
							{abook.aggregate.totalEntries === 1
								? "entry"
								: "entries"}
						</Text>
					)}
				</div>

				<Text size="sm">
					{resolve((t) => t.abook.delete.confirmationMessage)}
				</Text>

				<Alert
					icon={<IconAlertTriangle size="1rem" />}
					color="red"
					className={styles["warning-alert"]}
				>
					<Text size="sm">
						{resolve((t) => t.abook.delete.warningMessage)}
					</Text>
				</Alert>

				<Group
					justify="space-between"
					gap="md"
					className={styles["button-group"]}
				>
					<Button
						variant="subtle"
						onClick={handleClose}
						disabled={isDeleting}
					>
						{resolve((t) => t.abook.delete.cancelButton)}
					</Button>
					<Button
						color="red"
						leftSection={
							isDeleting ? (
								<Loader size={16} />
							) : (
								<IconTrash size={16} />
							)
						}
						onClick={onDelete}
						loading={isDeleting}
						disabled={isDeleting}
						className={styles["delete-button"]}
					>
						{isDeleting
							? resolve((t) => t.abook.delete.deleting)
							: resolve((t) => t.abook.delete.deleteButton)}
					</Button>
				</Group>
			</Stack>
		)
	}

	return (
		<Modal
			opened={opened}
			onClose={handleClose}
			title={
				deleteSuccess ? null : resolve((t) => t.abook.delete.modalTitle)
			}
			centered
			size="md"
			className={styles["abook-delete-modal"]}
			closeOnClickOutside={!isDeleting}
			closeOnEscape={!isDeleting}
		>
			{renderContent()}
		</Modal>
	)
}
