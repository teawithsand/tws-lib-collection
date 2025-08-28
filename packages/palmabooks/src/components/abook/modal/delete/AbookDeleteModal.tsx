import { useTransResolver } from "@/app/app.hooks"
import { IconAlertTriangle, IconTrash } from "@tabler/icons-react"
import {
	Alert,
	Button,
	Group,
	Loader,
	Modal,
	Stack,
	Text,
} from "@teawithsand/mlui"
import { useCallback, useState } from "react"

/**
 * Generic audiobook delete confirmation modal.
 *
 * This is a reusable modal component that accepts an action function as a prop.
 * It handles the UI for confirmation but delegates the actual deletion logic
 * to the parent component through the `onConfirmDelete` prop.
 *
 * Use this when you need custom deletion logic or want to handle notifications
 * and navigation differently.
 */
interface AbookDeleteModalProps {
	readonly opened: boolean
	readonly onClose: () => void
	readonly abookTitle: string | null
	readonly onConfirmDelete: () => Promise<void>
}

export function AbookDeleteModal({
	opened,
	onClose,
	abookTitle,
	onConfirmDelete,
}: AbookDeleteModalProps) {
	const { resolve } = useTransResolver()

	const [isLoading, setIsLoading] = useState(false)

	const handleDelete = useCallback(async () => {
		setIsLoading(true)
		try {
			await onConfirmDelete()
			onClose()
		} catch {
			// Let the parent handle error
		} finally {
			setIsLoading(false)
		}
	}, [onConfirmDelete, onClose])

	const handleClose = useCallback(() => {
		if (!isLoading) {
			onClose()
		}
	}, [isLoading, onClose])

	const displayTitle =
		abookTitle && abookTitle !== ""
			? abookTitle
			: resolve((t) => t.abooks.deleteModal.fallbackTitle)

	return (
		<Modal
			opened={opened}
			onClose={handleClose}
			title={resolve((t) => t.abooks.deleteModal.title)}
			size="lg"
		>
			<Stack>
				<Text>
					{resolve((t) =>
						t.abooks.deleteModal.confirmationMessage(displayTitle),
					)}
				</Text>

				<Alert
					icon={<IconAlertTriangle size={16} />}
					title={resolve((t) => t.abooks.deleteModal.warningTitle)}
					color="yellow"
				>
					<Text size="sm">
						{resolve((t) => t.abooks.deleteModal.warningMessage)}
					</Text>
				</Alert>

				<Group justify="flex-end" mt="md">
					<Button
						variant="default"
						onClick={handleClose}
						disabled={isLoading}
					>
						{resolve((t) => t.common.cancel)}
					</Button>

					<Button
						color="red"
						onClick={handleDelete}
						disabled={isLoading}
						leftSection={
							isLoading ? (
								<Loader size={16} />
							) : (
								<IconTrash size={16} />
							)
						}
					>
						{resolve((t) =>
							isLoading
								? t.abooks.deleteModal.deleteButtonDeleting
								: t.abooks.deleteModal.deleteButton,
						)}
					</Button>
				</Group>
			</Stack>
		</Modal>
	)
}
