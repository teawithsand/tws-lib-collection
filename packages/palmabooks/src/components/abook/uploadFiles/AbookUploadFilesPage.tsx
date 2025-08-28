import { useApp } from "@/app/app.hooks"
import { IconArrowLeft } from "@tabler/icons-react"
import { Id } from "@teawithsand/booklibr"
import { useAtomValue } from "@teawithsand/fstate"
import {
	ActionIcon,
	Alert,
	AppBarMutators,
	AppBarPredefinedMutatorPriorities,
	Button,
	Container,
	Group,
	LoadingOverlay,
	Stack,
	Text,
	useAppBarMutator,
} from "@teawithsand/mlui"
import { useCallback } from "react"
import { AbookFileUploadForm } from "../form"

export interface AbookUploadFilesPageProps {
	abookId: Id
	onUploadComplete?: () => void
	onCancel?: () => void
	onNavigateBack?: () => void
}

export const AbookUploadFilesPage: React.FC<AbookUploadFilesPageProps> = ({
	abookId,
	onUploadComplete,
	onCancel,
	onNavigateBack,
}) => {
	const app = useApp()

	const abookAtoms = app.abookStoreService.getAbook(abookId)
	const abookLoadable = useAtomValue(abookAtoms.dataLoadable)

	useAppBarMutator(
		AppBarMutators.ARROW_BACK_MUTATOR,
		AppBarPredefinedMutatorPriorities.PAGE,
		app.appBarService,
	)

	const handleUploadComplete = useCallback(() => {
		onUploadComplete?.()
	}, [onUploadComplete])

	const handleCancel = useCallback(() => {
		onCancel?.()
	}, [onCancel])

	const handleBackClick = useCallback(() => {
		onNavigateBack?.()
	}, [onNavigateBack])

	if (abookLoadable.state === "loading") {
		return (
			<Container size="lg" py="xl">
				<LoadingOverlay visible />
			</Container>
		)
	}

	if (abookLoadable.state === "hasError" || !abookLoadable.data) {
		return (
			<Container size="lg" py="xl">
				<Stack align="center" gap="lg">
					<Alert color="red" title="Error">
						{abookLoadable.state === "hasError" &&
						abookLoadable.error
							? String(abookLoadable.error)
							: "Audiobook not found"}
					</Alert>
					<Group>
						<Button
							onClick={handleBackClick}
							leftSection={<IconArrowLeft size={16} />}
							variant="light"
							disabled={!onNavigateBack}
						>
							Back to Audiobooks
						</Button>
					</Group>
				</Stack>
			</Container>
		)
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
