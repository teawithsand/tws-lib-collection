import { useApp } from "@/app"
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
import {
	IconAlertCircle,
	IconCheck,
	IconLogin,
	IconUpload,
} from "@tabler/icons-react"
import { useAtomValue, useSetAtom } from "@teawithsand/fstate"
import { MintayId } from "@teawithsand/mintay-core"
import { useCallback, useState } from "react"
import { Link } from "react-router"
import { Routes } from "../../../router/routes"
import styles from "./CollectionUploadModal.module.scss"

interface CollectionUploadModalProps {
	readonly opened: boolean
	readonly onClose: () => void
	readonly collectionId: MintayId
	readonly collectionTitle?: string
}

/**
 * Modal component for uploading collections to the backend.
 * Handles authentication check and provides upload functionality.
 */
export const CollectionUploadModal = ({
	opened,
	onClose,
	collectionId,
	collectionTitle,
}: CollectionUploadModalProps) => {
	const app = useApp()
	const authState = useAtomValue(app.backendService.authState)
	const saveCollection = useSetAtom(app.backendService.saveCollection)

	const [isUploading, setIsUploading] = useState(false)
	const [uploadError, setUploadError] = useState<string | null>(null)
	const [uploadSuccess, setUploadSuccess] = useState(false)

	const handleUpload = useCallback(async () => {
		if (!authState.isAuthenticated) {
			return
		}

		setIsUploading(true)
		setUploadError(null)
		setUploadSuccess(false)

		try {
			// Export collection to backend format using the service from DI
			const backendCollectionData =
				await app.collectionImportExport.exportCollection(collectionId)

			// Upload to backend using BackendService
			await saveCollection(backendCollectionData)

			setUploadSuccess(true)
		} catch (error) {
			console.error("Failed to upload collection:", error)
			setUploadError(
				error instanceof Error
					? error.message
					: "An unexpected error occurred while uploading the collection",
			)
		} finally {
			setIsUploading(false)
		}
	}, [
		authState.isAuthenticated,
		collectionId,
		app.collectionImportExport,
		saveCollection,
	])

	const handleClose = useCallback(() => {
		if (!isUploading) {
			setUploadError(null)
			setUploadSuccess(false)
			onClose()
		}
	}, [isUploading, onClose])

	const renderContent = () => {
		if (!authState.isAuthenticated) {
			return (
				<Stack gap="md">
					<Alert
						icon={<IconLogin size="1rem" />}
						title="Authentication Required"
						color="blue"
					>
						<Text size="sm">
							You must be logged in to upload collections to the
							backend.
						</Text>
					</Alert>

					<Group justify="center" gap="md">
						<Button
							component={Link}
							to={Routes.login.navigate()}
							variant="filled"
							leftSection={<IconLogin size={16} />}
							onClick={handleClose}
						>
							Login
						</Button>
						<Button
							component={Link}
							to={Routes.register.navigate()}
							variant="light"
							onClick={handleClose}
						>
							Register
						</Button>
					</Group>
				</Stack>
			)
		}

		if (uploadSuccess) {
			return (
				<Stack gap="md" align="center">
					<IconCheck size={48} color="green" />
					<Title order={3} ta="center">
						Upload Successful!
					</Title>
					<Text size="sm" c="dimmed" ta="center">
						Your collection has been successfully uploaded to the
						backend.
					</Text>
					<Button onClick={handleClose} variant="light">
						Close
					</Button>
				</Stack>
			)
		}

		return (
			<Stack gap="md">
				<div>
					<Title order={3} mb="xs">
						Upload Collection to Backend
					</Title>
					<Text size="sm" c="dimmed">
						{collectionTitle ? (
							<>
								Upload "<strong>{collectionTitle}</strong>" to
								the backend server for sharing and backup.
							</>
						) : (
							"Upload this collection to the backend server for sharing and backup."
						)}
					</Text>
				</div>

				{uploadError && (
					<Alert
						icon={<IconAlertCircle size="1rem" />}
						title="Upload Failed"
						color="red"
					>
						<Text size="sm">{uploadError}</Text>
					</Alert>
				)}

				<Group justify="flex-end" gap="md">
					<Button
						variant="subtle"
						onClick={handleClose}
						disabled={isUploading}
					>
						Cancel
					</Button>
					<Button
						leftSection={
							isUploading ? (
								<Loader size={16} />
							) : (
								<IconUpload size={16} />
							)
						}
						onClick={handleUpload}
						loading={isUploading}
						disabled={isUploading}
					>
						{isUploading ? "Uploading..." : "Upload Collection"}
					</Button>
				</Group>
			</Stack>
		)
	}

	return (
		<Modal
			opened={opened}
			onClose={handleClose}
			title={uploadSuccess ? null : "Upload Collection"}
			centered
			size="md"
			className={styles["collection-upload-modal"]}
			closeOnClickOutside={!isUploading}
			closeOnEscape={!isUploading}
		>
			{renderContent()}
		</Modal>
	)
}
