import { useApp } from "@/app/app.hooks"
import { IconUpload } from "@tabler/icons-react"
import { Id } from "@teawithsand/booklibr"
import { useAtomValue } from "@teawithsand/fstate"
import { Button, Card, Stack, Text } from "@teawithsand/mlui"
import { useState } from "react"
import { AbookFileUploadModal } from "./AbookFileUploadModal"
import styles from "./AbookUploadButton.module.scss"

export interface AbookUploadButtonProps {
	abookId: Id
	variant?: "button" | "card"
	size?: "sm" | "md" | "lg"
}

/**
 * A simple button/card component that opens the file upload modal for an audiobook.
 * This is useful for integrating upload functionality into existing pages.
 */
export const AbookUploadButton: React.FC<AbookUploadButtonProps> = ({
	abookId,
	variant = "button",
	size = "md",
}) => {
	const [isModalOpen, setIsModalOpen] = useState(false)
	const app = useApp()

	const abookAtoms = app.abookStoreService.getAbook(abookId)
	const abook = useAtomValue(abookAtoms.data)

	const handleOpenModal = () => {
		setIsModalOpen(true)
	}

	const handleCloseModal = () => {
		setIsModalOpen(false)
	}

	if (!abook) {
		return null
	}

	if (variant === "card") {
		return (
			<>
				<Card
					p="md"
					withBorder
					className={styles.uploadCard}
					onClick={handleOpenModal}
				>
					<Stack align="center" gap="sm">
						<IconUpload size={32} color="blue" />
						<div className={styles.uploadContent}>
							<Text size="sm" fw={500}>
								Upload Files
							</Text>
							<Text size="xs" c="dimmed">
								Add files to this audiobook
							</Text>
						</div>
					</Stack>
				</Card>

				<AbookFileUploadModal
					abookId={abookId}
					opened={isModalOpen}
					onClose={handleCloseModal}
				/>
			</>
		)
	}

	return (
		<>
			<Button
				leftSection={<IconUpload size={16} />}
				onClick={handleOpenModal}
				size={size}
			>
				Upload Files
			</Button>

			<AbookFileUploadModal
				abookId={abookId}
				opened={isModalOpen}
				onClose={handleCloseModal}
			/>
		</>
	)
}
