import { useApp } from "@/app"
import { AppCollectionData, WithMintayId } from "@/mintay"
import {
	Alert,
	Button,
	Group,
	Loader,
	Modal,
	Stack,
	Text,
	Title,
} from "@mantine/core"
import { IconAlertTriangle, IconCheck, IconTrash } from "@tabler/icons-react"
import { useSetAtom } from "@teawithsand/fstate"
import { useCallback, useState } from "react"
import styles from "./CollectionDeleteModal.module.scss"

interface CollectionDeleteModalProps {
	readonly opened: boolean
	readonly onClose: () => void
	readonly collection: WithMintayId<AppCollectionData> | null
	readonly onDeleted?: () => void
}

/**
 * Modal component for deleting collections.
 * Shows a confirmation dialog with collection details and handles the deletion process.
 */
export const CollectionDeleteModal = ({
	opened,
	onClose,
	collection,
	onDeleted,
}: CollectionDeleteModalProps) => {
	const app = useApp()
	const refreshCollectionsList = useSetAtom(
		app.collectionService.refreshCollectionsList,
	)

	const [isDeleting, setIsDeleting] = useState(false)
	const [deleteError, setDeleteError] = useState<string | null>(null)
	const [deleteSuccess, setDeleteSuccess] = useState(false)

	const handleDelete = useCallback(async () => {
		if (!collection) {
			return
		}

		setIsDeleting(true)
		setDeleteError(null)
		setDeleteSuccess(false)

		try {
			const collectionHandle = app.collectionService.collectionStore.get(
				collection.id,
			)
			await collectionHandle.delete()

			// Refresh the collections list after successful deletion
			refreshCollectionsList()

			setDeleteSuccess(true)

			// Call onDeleted callback if provided
			if (onDeleted) {
				onDeleted()
			}
		} catch (error) {
			console.error("Failed to delete collection:", error)
			setDeleteError(
				error instanceof Error
					? error.message
					: "An unexpected error occurred while deleting the collection",
			)
		} finally {
			setIsDeleting(false)
		}
	}, [collection, app.collectionService, onDeleted, refreshCollectionsList])

	const handleClose = useCallback(() => {
		if (!isDeleting) {
			setDeleteError(null)
			setDeleteSuccess(false)
			onClose()
		}
	}, [isDeleting, onClose])

	const renderContent = () => {
		// Don't render if no collection provided
		if (!collection) {
			return (
				<Stack gap="md" align="center">
					<Alert
						icon={<IconAlertTriangle size="1rem" />}
						title="No Collection Selected"
						color="orange"
					>
						<Text size="sm">
							No collection selected for deletion.
						</Text>
					</Alert>
					<Button onClick={handleClose} variant="light">
						Close
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
						Collection Deleted!
					</Title>
					<Text size="sm" c="dimmed" ta="center">
						The collection has been successfully deleted.
					</Text>
					<Button onClick={handleClose} variant="light">
						Close
					</Button>
				</Stack>
			)
		}

		// Show main deletion confirmation interface
		return (
			<Stack gap="md">
				<div>
					<Title order={3} mb="xs">
						Delete Collection
					</Title>
					<Text size="sm" c="dimmed">
						Are you sure you want to delete this collection? This
						action cannot be undone.
					</Text>
				</div>

				<div className={styles["collection-info"]}>
					<Stack gap="xs">
						<Group justify="space-between">
							<Text fw={500} size="sm">
								Title:
							</Text>
							<Text size="sm">{collection.data.title}</Text>
						</Group>
						{collection.data.description && (
							<Group justify="space-between" align="flex-start">
								<Text fw={500} size="sm">
									Description:
								</Text>
								<Text
									size="sm"
									ta="right"
									style={{ maxWidth: "200px" }}
								>
									{collection.data.description}
								</Text>
							</Group>
						)}
						<Group justify="space-between">
							<Text fw={500} size="sm">
								Created:
							</Text>
							<Text size="sm">
								{new Date(
									collection.data.createdAt,
								).toLocaleDateString()}
							</Text>
						</Group>
					</Stack>
				</div>

				<Alert
					icon={<IconAlertTriangle size="1rem" />}
					title="Warning"
					color="red"
					className={styles["warning-alert"]}
				>
					<Text size="sm">
						This will permanently delete the collection and all its
						cards. This action cannot be undone.
					</Text>
				</Alert>

				{deleteError && (
					<Alert
						icon={<IconAlertTriangle size="1rem" />}
						title="Deletion Failed"
						color="red"
					>
						<Text size="sm">{deleteError}</Text>
					</Alert>
				)}

				<Group
					justify="flex-end"
					gap="md"
					className={styles["button-group"]}
				>
					<Button
						variant="subtle"
						onClick={handleClose}
						disabled={isDeleting}
					>
						Cancel
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
						onClick={handleDelete}
						loading={isDeleting}
						disabled={isDeleting}
						className={styles["delete-button"]}
					>
						{isDeleting ? "Deleting..." : "Delete Collection"}
					</Button>
				</Group>
			</Stack>
		)
	}

	return (
		<Modal
			opened={opened}
			onClose={handleClose}
			title={deleteSuccess ? null : "Delete Collection"}
			centered
			size="md"
			className={styles["collection-delete-modal"]}
			closeOnClickOutside={!isDeleting}
			closeOnEscape={!isDeleting}
		>
			{renderContent()}
		</Modal>
	)
}
