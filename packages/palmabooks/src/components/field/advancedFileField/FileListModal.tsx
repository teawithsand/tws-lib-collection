import { useTransResolver } from "@/app/app.hooks"
import { IconFile, IconX } from "@tabler/icons-react"
import {
	ActionIcon,
	Box,
	Card,
	Group,
	MluiBreakpoint,
	Modal,
	ScrollArea,
	Stack,
	Text,
	useBreakpoint,
} from "@teawithsand/mlui"
import { AdvancedFileFieldEntry } from "./AdvancedFileField"
import styles from "./AdvancedFileField.module.scss"

export interface FileListModalProps {
	opened: boolean
	onClose: () => void
	files: AdvancedFileFieldEntry[]
	onRemoveFile: (fileId: string) => void
	disabled?: boolean
}

export const FileListModal: React.FC<FileListModalProps> = ({
	opened,
	onClose,
	files,
	onRemoveFile,
	disabled = false,
}) => {
	const { resolve } = useTransResolver()
	const breakpoint = useBreakpoint()
	const isMobile = breakpoint.isAtMost(MluiBreakpoint.MD)

	const totalSize = files.reduce((sum, file) => sum + file.file.size, 0)

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title={resolve((t) => t.fileUpload.files)}
			fullScreen={isMobile}
			centered
		>
			{files.length === 0 ? (
				<Box p="xl" style={{ textAlign: "center" }}>
					<Text size="md" c="dimmed">
						{resolve((t) => t.fileUpload.placeholder)}
					</Text>
				</Box>
			) : (
				<Stack gap="md">
					<Group justify="space-between">
						<Text size="sm" fw={500}>
							{resolve((t) =>
								t.fileUpload.filesSelected(files.length),
							)}
						</Text>
						<Text size="sm" c="dimmed">
							{resolve((t) => t.fileUpload.total)}:{" "}
							{resolve((t) => t.util.formatSize(totalSize))}
						</Text>
					</Group>

					<ScrollArea
						h={400}
						type="auto"
						scrollbarSize={8}
						scrollHideDelay={1000}
					>
						<Stack gap="xs">
							{files.map((uploadedFile) => (
								<Card key={uploadedFile.id} p="sm" withBorder>
									<Group wrap="nowrap">
										<IconFile size={32} stroke={1.5} />

										<Box className={styles.fileItem}>
											<Text size="sm" fw={500} truncate>
												{uploadedFile.file.name}
											</Text>
											<Text size="xs" c="dimmed">
												{resolve((t) =>
													t.util.formatSize(
														uploadedFile.file.size,
													),
												)}
											</Text>
										</Box>

										<ActionIcon
											variant="subtle"
											color="red"
											onClick={() =>
												onRemoveFile(uploadedFile.id)
											}
											disabled={disabled}
										>
											<IconX size={16} />
										</ActionIcon>
									</Group>
								</Card>
							))}
						</Stack>
					</ScrollArea>
				</Stack>
			)}
		</Modal>
	)
}
