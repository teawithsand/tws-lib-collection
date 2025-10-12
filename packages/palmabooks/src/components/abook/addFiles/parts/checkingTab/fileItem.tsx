import { IconEdit } from "@tabler/icons-react"
import { useSetAtom } from "@teawithsand/fstate"
import { ActionIcon, Checkbox, Text } from "@teawithsand/mlui"
import {
	AbookAddFilesWizardDisplayEntry,
	useAbookAddFileWizardBehavior,
} from "../../behavior"
import styles from "./fileItem.module.scss"

export type FileItemProps = {
	file: AbookAddFilesWizardDisplayEntry
	onEdit: (file: AbookAddFilesWizardDisplayEntry) => void
}

export const FileItem = (props: FileItemProps) => {
	const { file, onEdit } = props
	const behavior = useAbookAddFileWizardBehavior()
	const modifyFile = useSetAtom(behavior.modifyFile)

	const hasNameConflict =
		file.isEnabled &&
		(file.isNameTakenInAddSet || file.isNameTakenInPreExistingSet)

	return (
		<div
			key={file.id}
			className={`${styles.file}${hasNameConflict ? ` ${styles["file--error"]}` : ""}`}
		>
			<Checkbox
				checked={file.isEnabled}
				onChange={(event) => {
					modifyFile(file.id, (draft) => {
						draft.isEnabled = event.currentTarget.checked
						return draft
					})
				}}
				aria-label={`Toggle ${file.fileName}`}
			/>
			<div className={styles.file__content}>
				<Text size="sm" lineClamp={2} className={styles.file__name}>
					{file.fileName}
				</Text>
				{hasNameConflict && (
					<Text size="xs" className={styles.file__error}>
						{file.isNameTakenInAddSet &&
						file.isNameTakenInPreExistingSet
							? "Duplicate name in both sets"
							: file.isNameTakenInAddSet
								? "Duplicate name in selection"
								: "Name already exists"}
					</Text>
				)}
			</div>
			<ActionIcon
				variant="subtle"
				size="sm"
				onClick={() => {
					onEdit(file)
				}}
				aria-label={`Edit ${file.fileName}`}
			>
				<IconEdit size={16} />
			</ActionIcon>
		</div>
	)
}
