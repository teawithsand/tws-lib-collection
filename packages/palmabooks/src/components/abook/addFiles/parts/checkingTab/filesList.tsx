import { Stack } from "@teawithsand/mlui"
import { useState } from "react"
import { AbookAddFilesWizardDisplayEntry } from "../../behavior"
import { EditFileModal } from "./editFileModal"
import { FileItem } from "./fileItem"

export const FilesList = (props: {
	files: AbookAddFilesWizardDisplayEntry[]
}) => {
	const [editingFile, setEditingFile] =
		useState<AbookAddFilesWizardDisplayEntry | null>(null)

	return (
		<Stack gap="sm">
			{props.files.map((file) => (
				<FileItem key={file.id} file={file} onEdit={setEditingFile} />
			))}
			<EditFileModal
				file={editingFile}
				opened={editingFile !== null}
				onClose={() => setEditingFile(null)}
			/>
		</Stack>
	)
}
