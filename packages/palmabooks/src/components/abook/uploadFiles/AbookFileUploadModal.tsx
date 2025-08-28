import { useTransResolver } from "@/app/app.hooks"
import { IconUpload, IconX } from "@tabler/icons-react"
import { Id } from "@teawithsand/booklibr"
import { Group, Modal, Text } from "@teawithsand/mlui"
import { useCallback } from "react"
import { AbookFileUploadForm } from "../form"

export interface AbookFileUploadModalProps {
	abookId: Id
	opened: boolean
	onClose: () => void
}

export const AbookFileUploadModal: React.FC<AbookFileUploadModalProps> = ({
	abookId,
	opened,
	onClose,
}) => {
	const { resolve } = useTransResolver()

	const handleUploadComplete = useCallback(() => {
		onClose()
	}, [onClose])

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title={
				<Group gap="sm">
					<IconUpload size={20} />
					<Text size="lg" fw={600}>
						{resolve((t) => t.fileUpload.label)}
					</Text>
				</Group>
			}
			size="lg"
			closeButtonProps={{
				children: <IconX size={16} />,
			}}
		>
			<AbookFileUploadForm
				abookId={abookId}
				onUploadComplete={handleUploadComplete}
				onCancel={onClose}
			/>
		</Modal>
	)
}
