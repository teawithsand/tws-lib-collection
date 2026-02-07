import { useTransResolver } from "@/app/app.hooks"
import { IconTrash, IconUpload } from "@tabler/icons-react"
import { useAtomValue, useSetAtom } from "@teawithsand/fstate"
import {
	ActionIcon,
	Box,
	Button,
	FileInput,
	Group,
	Stack,
	Text,
} from "@teawithsand/mlui"
import {
	AbookEntryUploadTab,
	useAbookEntryUploadBehavior,
} from "../AbookEntryUploadBehavior"
import styles from "../AbookEntryUpload.module.scss"

export const AbookEntryUploadFilesTab = () => {
	const { resolve } = useTransResolver()
	const behavior = useAbookEntryUploadBehavior()
	const files = useAtomValue(behavior.files)
	const isUploading = useAtomValue(behavior.isUploading)
	const setFiles = useSetAtom(behavior.setFiles)
	const removeFile = useSetAtom(behavior.removeFile)
	const setActiveTab = useSetAtom(behavior.setActiveTab)

	const totalSize = files.reduce((sum, file) => sum + file.size, 0)
	const filesSummary =
		files.length === 0
			? resolve((t) => t.abook.create.form.filesPlaceholder)
			: resolve((t) => t.abook.create.form.filesSelected(files.length))

	return (
		<Stack gap="md" className={styles["abook-entry-upload__tab"]}>
			<FileInput
				label={resolve((t) => t.abook.create.form.filesLabel)}
				placeholder={resolve((t) => t.abook.create.form.filesPlaceholder)}
				value={files}
				onChange={(nextFiles) => {
					setFiles(nextFiles ?? [])
				}}
				disabled={isUploading}
				multiple
				accept="audio/*,image/*"
				leftSection={<IconUpload size="1rem" />}
				clearable
			/>

			<Group gap="xs" align="center" wrap="wrap">
				<Text size="sm" c="dimmed">
					{filesSummary}
				</Text>
				{files.length > 0 && (
					<>
						<Text size="sm" c="dimmed">
							|
						</Text>
						<Text size="sm" c="dimmed">
							{resolve((t) =>
								t.abook.addFilesWizard.uploadTab.newFilesSize(
									totalSize,
								),
							)}
						</Text>
					</>
				)}
			</Group>

			{files.length > 0 && (
				<Box className={styles["abook-entry-upload__file-list"]}>
					<div className={styles["abook-entry-upload__file-list-grid"]}>
						{files.map((file, index) => (
							<div
								key={`${file.name}-${index}`}
								className={
									styles["abook-entry-upload__file-item"]
								}
							>
								<div
									className={
										styles["abook-entry-upload__file-meta"]
									}
								>
									<Text size="sm" fw={500}>
										{file.name}
									</Text>
									<Text size="xs" c="dimmed">
										{resolve((t) =>
											t.util.formatSize(file.size),
										)}
									</Text>
								</div>
								<ActionIcon
									variant="light"
									color="red"
									disabled={isUploading}
									onClick={() => removeFile(index)}
									title={resolve((t) => t.common.remove)}
									aria-label={resolve((t) => t.common.remove)}
								>
									<IconTrash size={16} />
								</ActionIcon>
							</div>
						))}
					</div>
				</Box>
			)}

			<Box className={styles["abook-entry-upload__floating-actions"]}>
				<Button
					fullWidth
					onClick={() => setActiveTab(AbookEntryUploadTab.UPLOAD)}
					disabled={files.length === 0 || isUploading}
				>
					Confirm
				</Button>
			</Box>
		</Stack>
	)
}
