import { useTransResolver } from "@/app/app.hooks"
import { IconAlertTriangle, IconTrash } from "@tabler/icons-react"
import { Abook, AbookEntry } from "@teawithsand/booklibr"
import { Alert, Button, Group, Loader, Stack, Text } from "@teawithsand/mlui"
import styles from "./AbookEntryDeleteModal.module.scss"

export interface AbookEntryDeleteModalContentProps {
	readonly abook: Abook
	readonly entry: AbookEntry
	readonly onClose: () => void
	readonly onDelete: () => void | Promise<void>
	readonly isDeleting: boolean
}

/**
 * Confirmation content for deleting an entry.
 * Shows entry details, warning, and action buttons.
 */
export const AbookEntryDeleteModalContent = ({
	abook,
	entry,
	onClose,
	onDelete,
	isDeleting,
}: AbookEntryDeleteModalContentProps) => {
	const { resolve } = useTransResolver()

	return (
		<Stack gap="md">
			<div className={styles["entry-info"]}>
				<Text size="lg" fw={500}>
					{entry.data.name ||
						resolve((t) => t.abook.entries.show.noName)}
				</Text>
				<Text size="sm" c="dimmed">
					{resolve((t) => t.abook.entries.delete.fromAbook)}{" "}
					{abook.data.header.metadata.title ||
						resolve((t) => t.abook.show.noTitle)}
				</Text>
			</div>

			<Text size="sm">
				{resolve((t) => t.abook.entries.delete.confirmationMessage)}
			</Text>

			<Alert
				icon={<IconAlertTriangle size="1rem" />}
				color="red"
				className={styles["warning-alert"]}
			>
				<Text size="sm">
					{resolve((t) => t.abook.entries.delete.warningMessage)}
				</Text>
			</Alert>

			<Group
				justify="space-between"
				gap="md"
				className={styles["button-group"]}
			>
				<Button
					variant="subtle"
					onClick={onClose}
					disabled={isDeleting}
				>
					{resolve((t) => t.abook.entries.delete.cancelButton)}
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
						? resolve((t) => t.abook.entries.delete.deleting)
						: resolve((t) => t.abook.entries.delete.deleteButton)}
				</Button>
			</Group>
		</Stack>
	)
}
