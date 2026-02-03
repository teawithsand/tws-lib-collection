import { useTransResolver } from "@/app/app.hooks"
import { Button, Group, Modal, Stack, Text } from "@teawithsand/mlui"

export interface AbookEntrySelectionDeleteModalProps {
	readonly opened: boolean
	readonly onClose: () => void
	readonly onConfirm: () => void
	readonly selectedCount: number
}

/**
 * Modal for confirming deletion of selected audiobook entries.
 */
export const AbookEntrySelectionDeleteModal = ({
	opened,
	onClose,
	onConfirm,
	selectedCount,
}: AbookEntrySelectionDeleteModalProps) => {
	const { resolve } = useTransResolver()

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title={resolve((t) => t.abook.entries.selectionDeleteModal.title)}
			centered
			size="md"
		>
			<Stack gap="md">
				<Text size="sm">
					{resolve((t) =>
						t.abook.entries.selectionDeleteModal.message(
							selectedCount,
						),
					)}
				</Text>
				<Group justify="flex-end" gap="sm">
					<Button variant="light" onClick={onClose}>
						{resolve(
							(t) =>
								t.abook.entries.selectionDeleteModal
									.cancelButton,
						)}
					</Button>
					<Button color="red" onClick={onConfirm}>
						{resolve(
							(t) =>
								t.abook.entries.selectionDeleteModal
									.deleteButton,
						)}
					</Button>
				</Group>
			</Stack>
		</Modal>
	)
}
