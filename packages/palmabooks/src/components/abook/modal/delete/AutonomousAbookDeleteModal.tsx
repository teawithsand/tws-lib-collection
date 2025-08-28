import { useApp, useTransResolver } from "@/app/app.hooks"
import { Routes } from "@/router/routes"
import { IconAlertTriangle, IconTrash } from "@tabler/icons-react"
import { useAtomCallback } from "@teawithsand/fstate"
import {
	Alert,
	Button,
	Group,
	Loader,
	Modal,
	Stack,
	Text,
	useMantineNotifications,
	useNavigation,
} from "@teawithsand/mlui"
import { useCallback, useState } from "react"

const LOG_TAG = "AutonomousAbookDeleteModal"

/**
 * Autonomous audiobook delete modal with built-in deletion logic.
 *
 * This component handles the complete deletion flow internally, including:
 * - Calling the abook store service to delete the audiobook
 * - Showing success/error notifications
 * - Navigating to the books list after successful deletion
 * - Proper error logging
 *
 * Use this when you want a complete, self-contained deletion experience
 * without needing to handle the deletion logic in the parent component.
 */
interface AutonomousAbookDeleteModalProps {
	readonly opened: boolean
	readonly onClose: () => void
	readonly abookId: string | null
	readonly abookTitle: string | null
}

export function AutonomousAbookDeleteModal({
	opened,
	onClose,
	abookId,
	abookTitle,
}: AutonomousAbookDeleteModalProps) {
	const { resolve } = useTransResolver()
	const app = useApp()
	const { navigate } = useNavigation()

	const notifications = useMantineNotifications()

	const [isLoading, setIsLoading] = useState(false)

	const handleDelete = useAtomCallback(
		useCallback(
			async (_get, set) => {
				if (!abookId) return

				setIsLoading(true)
				try {
					const abookAtom = app.abookStoreService.getAbook(abookId)
					await set(abookAtom.delete)

					onClose()

					// Navigate immediately with success notification
					notifications.show({
						title: resolve(
							(t) => t.abooks.deleteModal.successMessage,
						),
						message: resolve(
							(t) => t.abooks.deleteModal.successDescription,
						),
						color: "green",
					})
					navigate(Routes.books.navigate())
				} catch (error) {
					app.logger.error(
						LOG_TAG,
						"Failed to delete audiobook:",
						error,
					)

					notifications.show({
						title: resolve(
							(t) => t.abooks.deleteModal.deleteFailedTitle,
						),
						message: resolve(
							(t) => t.abooks.deleteModal.errorMessage,
						),
						color: "red",
					})
				} finally {
					setIsLoading(false)
				}
			},
			[abookId, app, navigate, notifications, onClose, resolve],
		),
	)

	const handleClose = useCallback(() => {
		if (!isLoading) {
			onClose()
		}
	}, [isLoading, onClose])

	return (
		<Modal
			opened={opened}
			onClose={handleClose}
			title={resolve((t) =>
				abookId
					? t.abooks.deleteModal.title
					: t.abooks.deleteModal.noAudiobookSelectedTitle,
			)}
			size="sm"
		>
			<Stack>
				{abookId ? (
					<>
						<Text>
							{resolve((t) =>
								t.abooks.deleteModal.confirmationMessage(
									abookTitle || "",
								),
							)}
						</Text>

						<Alert
							icon={<IconAlertTriangle size={16} />}
							title={resolve(
								(t) => t.abooks.deleteModal.warningTitle,
							)}
							color="yellow"
						>
							<Text size="sm">
								{resolve(
									(t) => t.abooks.deleteModal.warningMessage,
								)}
							</Text>
						</Alert>
					</>
				) : (
					<Text>
						{resolve(
							(t) =>
								t.abooks.deleteModal.noAudiobookSelectedMessage,
						)}
					</Text>
				)}

				<Group justify="flex-end" mt="md">
					<Button
						variant="default"
						onClick={handleClose}
						disabled={isLoading}
					>
						{resolve((t) => t.common.cancel)}
					</Button>

					{abookId && (
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
					)}
				</Group>
			</Stack>
		</Modal>
	)
}
