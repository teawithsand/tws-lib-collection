import { useApp } from "@/app"
import { BackendCollectionData } from "@/domain/backend/backendCollectionData"
import { Routes } from "@/router/routes"
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
	IconDownload,
	IconFolderPlus,
} from "@tabler/icons-react"
import { useCallback, useState } from "react"
import { useNavigate } from "react-router"
import styles from "./CollectionDownloadModal.module.scss"

interface CollectionDownloadModalProps {
	readonly opened: boolean
	readonly onClose: () => void
	readonly backendCollectionData: BackendCollectionData | null
}

/**
 * Modal component for downloading backend collections to local storage.
 * Handles importing collections from backend format and navigating to the new collection.
 */
export const CollectionDownloadModal = ({
	opened,
	onClose,
	backendCollectionData,
}: CollectionDownloadModalProps) => {
	const app = useApp()
	const navigate = useNavigate()

	const [isDownloading, setIsDownloading] = useState(false)
	const [downloadError, setDownloadError] = useState<string | null>(null)
	const [downloadSuccess, setDownloadSuccess] = useState(false)
	const [newCollectionId, setNewCollectionId] = useState<string | null>(null)

	const handleDownload = useCallback(async () => {
		if (!backendCollectionData) {
			return
		}

		setIsDownloading(true)
		setDownloadError(null)
		setDownloadSuccess(false)

		try {
			// Import collection to local storage using the service from DI
			const collectionId =
				await app.collectionImportExport.importCollection(
					backendCollectionData,
				)

			setNewCollectionId(collectionId.toString())
			setDownloadSuccess(true)
		} catch (error) {
			console.error("Failed to download collection:", error)
			setDownloadError(
				error instanceof Error
					? error.message
					: "An unexpected error occurred while downloading the collection",
			)
		} finally {
			setIsDownloading(false)
		}
	}, [backendCollectionData, app.collectionImportExport])

	const handleViewCollection = useCallback(() => {
		if (newCollectionId) {
			navigate(Routes.collectionDetail.navigate(newCollectionId))
			onClose()
		}
	}, [newCollectionId, navigate, onClose])

	const handleClose = useCallback(() => {
		if (!isDownloading) {
			setDownloadError(null)
			setDownloadSuccess(false)
			setNewCollectionId(null)
			onClose()
		}
	}, [isDownloading, onClose])

	const renderContent = () => {
		// Don't render if no data provided
		if (!backendCollectionData) {
			return (
				<Stack gap="md" align="center">
					<Alert
						icon={<IconAlertCircle size="1rem" />}
						title="No Collection Data"
						color="orange"
					>
						<Text size="sm">
							No collection data provided for download.
						</Text>
					</Alert>
					<Button onClick={handleClose} variant="light">
						Close
					</Button>
				</Stack>
			)
		}

		// Show download success message
		if (downloadSuccess) {
			return (
				<Stack gap="md" align="center">
					<IconCheck size={48} color="green" />
					<Title order={3} ta="center">
						Download Successful!
					</Title>
					<Text size="sm" c="dimmed" ta="center">
						The collection has been successfully downloaded and
						saved to your local storage.
					</Text>
					<Group gap="md" justify="center">
						<Button
							leftSection={<IconFolderPlus size={16} />}
							onClick={handleViewCollection}
							variant="filled"
						>
							View Collection
						</Button>
						<Button onClick={handleClose} variant="light">
							Close
						</Button>
					</Group>
				</Stack>
			)
		}

		// Show main download interface
		return (
			<Stack gap="md">
				<div>
					<Title order={3} mb="xs">
						Download Collection
					</Title>
					<Text size="sm" c="dimmed">
						Download "
						<strong>
							{backendCollectionData.collection.title}
						</strong>
						" to your local storage.
					</Text>
				</div>

				<div className={styles["collection-info"]}>
					<Stack gap="xs">
						<Group justify="space-between">
							<Text fw={500} size="sm">
								Title:
							</Text>
							<Text size="sm">
								{backendCollectionData.collection.title}
							</Text>
						</Group>
						{backendCollectionData.collection.description && (
							<Group justify="space-between" align="flex-start">
								<Text fw={500} size="sm">
									Description:
								</Text>
								<Text
									size="sm"
									ta="right"
									style={{ maxWidth: "200px" }}
								>
									{
										backendCollectionData.collection
											.description
									}
								</Text>
							</Group>
						)}
						<Group justify="space-between">
							<Text fw={500} size="sm">
								Cards:
							</Text>
							<Text size="sm">
								{backendCollectionData.cards.length}
							</Text>
						</Group>
					</Stack>
				</div>

				{downloadError && (
					<Alert
						icon={<IconAlertCircle size="1rem" />}
						title="Download Failed"
						color="red"
					>
						<Text size="sm">{downloadError}</Text>
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
						disabled={isDownloading}
					>
						Cancel
					</Button>
					<Button
						leftSection={
							isDownloading ? (
								<Loader size={16} />
							) : (
								<IconDownload size={16} />
							)
						}
						onClick={handleDownload}
						loading={isDownloading}
						disabled={isDownloading}
						className={styles["download-button"]}
					>
						{isDownloading
							? "Downloading..."
							: "Download Collection"}
					</Button>
				</Group>
			</Stack>
		)
	}

	return (
		<Modal
			opened={opened}
			onClose={handleClose}
			title={downloadSuccess ? null : "Download Collection"}
			centered
			size="md"
			className={styles["collection-download-modal"]}
			closeOnClickOutside={!isDownloading}
			closeOnEscape={!isDownloading}
		>
			{renderContent()}
		</Modal>
	)
}
