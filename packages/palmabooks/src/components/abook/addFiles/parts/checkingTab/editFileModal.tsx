import { useSetAtom } from "@teawithsand/fstate"
import { Button, Modal, Stack, TextInput } from "@teawithsand/mlui"
import { useEffect, useState } from "react"
import {
	AbookAddFilesWizardDisplayEntry,
	useAbookAddFileWizardBehavior,
} from "../../behavior"

export type EditFileModalProps = {
	file: AbookAddFilesWizardDisplayEntry | null
	opened: boolean
	onClose: () => void
}

export const EditFileModal = (props: EditFileModalProps) => {
	const { file, opened, onClose } = props
	const behavior = useAbookAddFileWizardBehavior()
	const modifyFile = useSetAtom(behavior.modifyFile)

	const [fileName, setFileName] = useState("")
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (opened && file) {
			setFileName(file.fileName)
			setError(null)
		}
	}, [opened, file])

	const handleSave = () => {
		if (!file) return

		const trimmed = fileName.trim()
		if (!trimmed) {
			setError("File name cannot be empty")
			return
		}

		modifyFile(file.id, (draft) => {
			draft.fileName = trimmed
			return draft
		})

		onClose()
	}

	const handleCancel = () => {
		setError(null)
		onClose()
	}

	if (!file) return null

	return (
		<Modal
			opened={opened}
			onClose={handleCancel}
			title="Edit File Name"
			size="md"
		>
			<Stack gap="md">
				<TextInput
					label="File Name"
					placeholder="Enter file name"
					value={fileName}
					onChange={(event) => {
						setFileName(event.currentTarget.value)
						if (error) setError(null)
					}}
					error={error}
					data-autofocus
				/>

				<div
					style={{
						display: "flex",
						justifyContent: "flex-end",
						gap: "var(--mantine-spacing-sm)",
					}}
				>
					<Button variant="subtle" onClick={handleCancel}>
						Cancel
					</Button>
					<Button onClick={handleSave}>Save</Button>
				</div>
			</Stack>
		</Modal>
	)
}
