import { useApp } from "@/app/app.hooks"
import { NotFoundPageContent } from "@/components/pageContent/notFound"
import { IconArrowLeft } from "@tabler/icons-react"
import { Id } from "@teawithsand/booklibr"
import { useAtomValue } from "@teawithsand/fstate"
import {
	ActionIcon,
	Container,
	Group,
	LoadingOverlay,
	Stack,
	Text,
} from "@teawithsand/mlui"
import { useCallback, useState } from "react"
import { AbookFileUploadForm } from "../form"

export interface AutonomousAbookUploadFilesProps {
	abookId: Id
	onNavigateBack?: () => void
	onUploadComplete?: () => void
}

export const AutonomousAbookUploadFiles: React.FC<
	AutonomousAbookUploadFilesProps
> = ({ abookId, onNavigateBack, onUploadComplete }) => {
	const app = useApp()
	const [isUploading, setIsUploading] = useState(false)

	const abookAtoms = app.abookStoreService.getAbook(abookId)
	const abookLoadable = useAtomValue(abookAtoms.dataLoadable)

	const handleUploadComplete = useCallback(() => {
		setIsUploading(false)
		onUploadComplete?.()
	}, [onUploadComplete])

	const handleCancel = useCallback(() => {
		onNavigateBack?.()
	}, [onNavigateBack])

	const handleBackClick = useCallback(() => {
		if (!isUploading) {
			onNavigateBack?.()
		}
	}, [onNavigateBack, isUploading])

	if (abookLoadable.state === "loading") {
		return (
			<Container size="lg" py="xl">
				<LoadingOverlay visible />
			</Container>
		)
	}

	if (abookLoadable.state === "hasError" || !abookLoadable.data) {
		return <NotFoundPageContent />
	}

	return (
		<Container size="lg" py="xl">
			<Stack gap="lg">
				<Group>
					{onNavigateBack && (
						<ActionIcon
							onClick={handleBackClick}
							variant="light"
							size="lg"
							disabled={isUploading}
						>
							<IconArrowLeft size={20} />
						</ActionIcon>
					)}
					<div>
						<Text size="xl" fw={700}>
							Upload Files
						</Text>
						<Text size="sm" c="dimmed">
							Add content to "
							{abookLoadable.data.data.header.metadata.title}"
						</Text>
					</div>
				</Group>

				<AbookFileUploadForm
					abookId={abookId}
					onUploadComplete={handleUploadComplete}
					onCancel={handleCancel}
				/>
			</Stack>
		</Container>
	)
}
