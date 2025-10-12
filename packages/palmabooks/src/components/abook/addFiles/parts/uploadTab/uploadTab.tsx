import { useTransResolver } from "@/app/app.hooks"
import { AbookHandle } from "@teawithsand/booklibr"
import { useAtomValue, useSetAtom } from "@teawithsand/fstate"
import { inPlace } from "@teawithsand/lngext"
import { Button, Center, Space, Text } from "@teawithsand/mlui"
import {
	AbookAddFilesWizardEntry,
	useAbookAddFileWizardBehavior,
} from "../../behavior"
import { AbookAddFilesWizardUploadProgress } from "./progress"

const Inner = ({
	files,
	onUploadStart,
}: {
	files: AbookAddFilesWizardEntry[]
	onUploadStart: () => void
}) => {
	const { resolve } = useTransResolver()
	const sumSize = inPlace(() => {
		if (!files.length) return 0
		let s = 0
		for (const f of files) {
			s += f.file.size
		}
		return s
	})

	return (
		<div>
			<Center>
				<Text size="xl">
					{resolve((t) => t.abook.addFilesWizard.uploadTab.prompt)}
				</Text>
			</Center>
			<Space h="lg" />
			<Text size="md">
				{resolve((t) =>
					t.abook.addFilesWizard.uploadTab.newFilesSize(sumSize),
				)}
			</Text>
			<Space h="lg" />
			<AbookAddFilesWizardUploadProgress />
			<Space h="lg" />
			<Button
				fullWidth={true}
				onClick={() => {
					onUploadStart()
				}}
			>
				{resolve((t) => t.abook.addFilesWizard.uploadTab.uploadButton)}
			</Button>
		</div>
	)
}

export const AbookAddFilesWizardUploadingTab = () => {
	const behavior = useAbookAddFileWizardBehavior()
	const { resolve } = useTransResolver()

	const files = useAtomValue(behavior.filesToUpload)
	const startUpload = useSetAtom(behavior.upload.startUpload)

	if (!files.length) {
		return (
			<>{resolve((t) => t.abook.addFilesWizard.uploadTab.emptyState)}</>
		)
	} else {
		return (
			<Inner
				files={files}
				onUploadStart={() => {
					startUpload(null as unknown as AbookHandle, files)
				}}
			/>
		)
	}
}
