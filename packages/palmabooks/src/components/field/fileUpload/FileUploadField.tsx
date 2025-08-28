import { useTransResolver } from "@/app/app.hooks"
import {
	IconCloudUpload,
	IconFile,
	IconFolder,
	IconX,
} from "@tabler/icons-react"
import { generateUuid } from "@teawithsand/lngext"
import {
	ActionIcon,
	Box,
	Button,
	Card,
	Group,
	Progress,
	Stack,
	Text,
	UnstyledButton,
} from "@teawithsand/mlui"
import { useCallback, useRef, useState } from "react"
import styles from "./FileUploadField.module.scss"

export interface UploadedFile {
	file: File
	id: string
}

export interface FileUploadFieldProps {
	files: UploadedFile[]
	onFilesChange: (files: UploadedFile[]) => void
	accept?: string
	multiple?: boolean
	allowDirectories?: boolean
	disabled?: boolean
	label?: string
	description?: string
	placeholder?: string
	error?: string
}

export const FileUploadField: React.FC<FileUploadFieldProps> = ({
	files,
	onFilesChange,
	accept,
	multiple = true,
	allowDirectories = true,
	disabled = false,
	label,
	description,
	placeholder,
	error,
}) => {
	const [isDragOver, setIsDragOver] = useState(false)
	const [isUploading, setIsUploading] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const directoryInputRef = useRef<HTMLInputElement>(null)
	const { resolve } = useTransResolver()

	const totalSize = files.reduce((sum, file) => sum + file.file.size, 0)

	const processFiles = useCallback(
		async (fileList: FileList | File[]) => {
			if (disabled) return

			setIsUploading(true)
			const newFiles: UploadedFile[] = []

			for (let i = 0; i < fileList.length; i++) {
				const file = Array.isArray(fileList)
					? fileList[i]
					: fileList.item(i)
				if (!file) continue

				const uploadedFile: UploadedFile = {
					file,
					id: generateUuid(),
				}

				newFiles.push(uploadedFile)
			}

			if (multiple) {
				onFilesChange([...files, ...newFiles])
			} else {
				onFilesChange(newFiles.slice(0, 1))
			}

			setIsUploading(false)
		},
		[files, onFilesChange, multiple, disabled],
	)

	const handleFileInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const fileList = e.target.files
			if (fileList) {
				processFiles(fileList)
			}
			// Reset input value to allow selecting the same file again
			e.target.value = ""
		},
		[processFiles],
	)

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		setIsDragOver(true)
	}, [])

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		setIsDragOver(false)
	}, [])

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault()
			e.stopPropagation()
			setIsDragOver(false)

			const droppedFiles: File[] = []

			if (e.dataTransfer.files) {
				for (let i = 0; i < e.dataTransfer.files.length; i++) {
					const file = e.dataTransfer.files.item(i)
					if (file) droppedFiles.push(file)
				}
			}

			if (allowDirectories && e.dataTransfer.items) {
				const processEntry = async (
					entry: FileSystemEntry,
				): Promise<File[]> => {
					const files: File[] = []

					if (entry.isFile) {
						const fileEntry = entry as FileSystemFileEntry
						return new Promise((resolve) => {
							fileEntry.file((file) => resolve([file]))
						})
					} else if (entry.isDirectory) {
						const dirEntry = entry as FileSystemDirectoryEntry
						const reader = dirEntry.createReader()

						return new Promise((resolve) => {
							reader.readEntries(async (entries) => {
								for (const childEntry of entries) {
									const childFiles =
										await processEntry(childEntry)
									files.push(...childFiles)
								}
								resolve(files)
							})
						})
					}

					return files
				}

				const processAllEntries = async () => {
					const allFiles: File[] = []

					for (let i = 0; i < e.dataTransfer.items.length; i++) {
						const item = e.dataTransfer.items[i]
						if (item.kind === "file") {
							const entry = item.webkitGetAsEntry()
							if (entry) {
								const entryFiles = await processEntry(entry)
								allFiles.push(...entryFiles)
							}
						}
					}

					processFiles([...droppedFiles, ...allFiles])
				}

				processAllEntries()
			} else {
				processFiles(droppedFiles)
			}
		},
		[processFiles, allowDirectories],
	)

	const removeFile = useCallback(
		(fileId: string) => {
			onFilesChange(files.filter((f) => f.id !== fileId))
		},
		[files, onFilesChange],
	)

	const openFileDialog = useCallback(() => {
		fileInputRef.current?.click()
	}, [])

	const openDirectoryDialog = useCallback(() => {
		directoryInputRef.current?.click()
	}, [])

	return (
		<div className={styles.container}>
			{(label ?? resolve((t) => t.fileUpload.label)) && (
				<Text size="sm" fw={500} mb="xs">
					{label ?? resolve((t) => t.fileUpload.label)}
				</Text>
			)}

			{(description ?? resolve((t) => t.fileUpload.description)) && (
				<Text size="xs" c="dimmed" mb="sm">
					{description ?? resolve((t) => t.fileUpload.description)}
				</Text>
			)}

			<input
				ref={fileInputRef}
				type="file"
				accept={accept}
				multiple={multiple}
				onChange={handleFileInputChange}
				className={styles.hiddenInput}
				disabled={disabled}
			/>
			{allowDirectories && (
				<input
					ref={directoryInputRef}
					type="file"
					// @ts-expect-error - webkitdirectory is not in TypeScript types but is supported
					webkitdirectory=""
					multiple
					onChange={handleFileInputChange}
					className={styles.hiddenInput}
					disabled={disabled}
				/>
			)}

			<Card
				className={`${styles.dropzone} ${isDragOver ? styles.dragOver : ""} ${
					disabled ? styles.disabled : ""
				}`}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				p="xl"
			>
				<UnstyledButton
					onClick={openFileDialog}
					className={styles.dropzoneButton}
					disabled={disabled}
				>
					<Stack align="center" gap="md">
						<IconCloudUpload size={48} stroke={1.5} />
						<div>
							<Text size="lg" fw={500}>
								{files.length === 0
									? (placeholder ??
										resolve(
											(t) => t.fileUpload.placeholder,
										))
									: resolve((t) =>
											t.fileUpload.filesSelected(
												files.length,
											),
										)}
							</Text>
							<Text size="sm" c="dimmed" mt="xs">
								{resolve((t) => t.fileUpload.clickToBrowse)}
							</Text>
						</div>
					</Stack>
				</UnstyledButton>
			</Card>

			{allowDirectories && (
				<Group mt="sm" gap="xs">
					<Button
						variant="light"
						leftSection={<IconFolder size={16} />}
						onClick={openDirectoryDialog}
						disabled={disabled}
						size="sm"
					>
						{resolve((t) => t.fileUpload.uploadFolder)}
					</Button>
				</Group>
			)}

			{files.length > 0 && (
				<Stack mt="md" gap="xs">
					<Group justify="space-between">
						<Text size="sm" fw={500}>
							{resolve((t) => t.fileUpload.files)} ({files.length}
							)
						</Text>
						<Text size="sm" c="dimmed">
							{resolve((t) => t.fileUpload.total)}:{" "}
							{resolve((t) => t.util.formatSize(totalSize))}
						</Text>
					</Group>

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
											{uploadedFile.file.type &&
												` • ${uploadedFile.file.type}`}
										</Text>
									</Box>

									<ActionIcon
										variant="subtle"
										color="red"
										onClick={() =>
											removeFile(uploadedFile.id)
										}
										disabled={disabled}
									>
										<IconX size={16} />
									</ActionIcon>
								</Group>
							</Card>
						))}
					</Stack>
				</Stack>
			)}

			{isUploading && (
				<Box mt="md">
					<Text size="sm" mb="xs">
						{resolve((t) => t.fileUpload.processingFiles)}
					</Text>
					<Progress value={100} animated />
				</Box>
			)}

			{error && (
				<Text size="sm" c="red" mt="xs">
					{error}
				</Text>
			)}
		</div>
	)
}
