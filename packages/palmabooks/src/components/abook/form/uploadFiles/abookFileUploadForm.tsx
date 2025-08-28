import { useApp, useTransResolver } from "@/app/app.hooks"
import {
	AbookFileUploadFormClass,
	AbookFileUploadFormInput,
	AbookFileUploadFormUtils,
} from "@/components/abook/form/uploadFiles"
import { AdvancedFileField } from "@/components/field"
import { IconAlertCircle, IconUpload } from "@tabler/icons-react"
import { Id } from "@teawithsand/booklibr"
import {
	useAtomValue,
	useForm,
	useFormField,
	useSetAtom,
} from "@teawithsand/fstate"
import {
	Alert,
	Button,
	Card,
	Group,
	Progress,
	Stack,
	Text,
} from "@teawithsand/mlui"
import { useCallback, useState } from "react"

const LOG_TAG = "AbookFileUploadForm"

export interface AbookFileUploadFormProps {
	abookId: Id
	onUploadComplete?: () => void
	onCancel?: () => void
}

export const AbookFileUploadForm: React.FC<AbookFileUploadFormProps> = ({
	abookId,
	onUploadComplete,
	onCancel,
}) => {
	const [formAtoms] = useState(() => new AbookFileUploadFormClass())
	const [uploadProgress, setUploadProgress] = useState(0)

	const app = useApp()
	const { resolve } = useTransResolver()

	const abookAtoms = app.abookStoreService.getAbook(abookId)
	const abook = useAtomValue(abookAtoms.data)
	const refreshAbook = useSetAtom(abookAtoms.refresh)

	const form = useForm(formAtoms)
	const filesField = useFormField(formAtoms.fields.files)

	const handleUpload = useCallback(
		async (formData: AbookFileUploadFormInput) => {
			const files = formData.files
			setUploadProgress(0)

			try {
				const entryDataList = AbookFileUploadFormUtils.filesToEntryData(
					files,
					formData.defaultDisposition,
				)

				for (let i = 0; i < files.length; i++) {
					const uploadedFile = files[i]
					const file = uploadedFile.file
					const entryData = entryDataList[i]

					// Create the entry
					const abookHandle =
						await app.abookStoreService.abookStore.get(abookId)
					const entryHandle = await abookHandle.createEntry(entryData)

					// Upload the file content
					const blobWriter = await entryHandle.getBlobWriter()
					await blobWriter.write(file)
					await blobWriter.close()

					// Update progress
					setUploadProgress(((i + 1) / files.length) * 100)
				}

				// Refresh the abook data to show new entries
				refreshAbook()

				// Clear files after successful upload
				filesField.set([])

				onUploadComplete?.()
			} catch (err) {
				// Log error for debugging
				app.logger.error(LOG_TAG, "Upload failed", String(err))
				throw err
			} finally {
				setUploadProgress(0)
			}
		},
		[
			abookId,
			app.abookStoreService.abookStore,
			app.logger,
			refreshAbook,
			filesField,
			onUploadComplete,
		],
	)

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault()

			if (form.isSubmitting || form.hasErrors) return

			form.submit(handleUpload)
		},
		[form, handleUpload],
	)

	if (!abook) {
		return (
			<Alert color="red">
				<Text>Audiobook not found</Text>
			</Alert>
		)
	}

	return (
		<Card shadow="sm" p="xl" radius="md" withBorder>
			<form onSubmit={handleSubmit}>
				<Stack gap="lg">
					<div>
						<Text size="lg" fw={600} mb="xs">
							{resolve((t) =>
								t.fileUpload.uploadTitle(
									abook.data.header.metadata.title,
								),
							)}
						</Text>
						<Text size="sm" c="dimmed">
							{resolve((t) => t.fileUpload.uploadDescription)}
						</Text>
					</div>

					{!form.globalErrors.isEmpty && (
						<Alert
							icon={<IconAlertCircle size="1rem" />}
							title={resolve(
								(t) => t.fileUpload.formValidationErrors,
							)}
							color="red"
						>
							<ul>
								{form.globalErrors.errors.map(
									(error, index) => (
										<li key={index}>{resolve(error)}</li>
									),
								)}
							</ul>
						</Alert>
					)}

					{form.lastSubmitError && (
						<Alert
							icon={<IconAlertCircle size="1rem" />}
							title={resolve((t) => t.fileUpload.uploadError)}
							color="red"
						>
							{form.lastSubmitError.message ||
								resolve((t) => t.fileUpload.uploadFailed)}
						</Alert>
					)}

					<AdvancedFileField
						files={filesField.value}
						onFilesChange={filesField.set}
						multiple={true}
						allowDirectories={true}
						disabled={form.isSubmitting}
						placeholder={resolve(
							(t) => t.fileUpload.dropFilesPlaceholder,
						)}
						error={
							!filesField.errors.isEmpty &&
							filesField.errors.first
								? String(filesField.errors.first)
								: undefined
						}
					/>

					{form.isSubmitting && (
						<div>
							<Text size="sm" mb="xs">
								{resolve((t) =>
									t.fileUpload.uploadingFiles(uploadProgress),
								)}
							</Text>
							<Progress value={uploadProgress} animated />
						</div>
					)}

					<Group justify="flex-end">
						{onCancel && (
							<Button
								variant="light"
								onClick={onCancel}
								disabled={form.isSubmitting}
							>
								{resolve((t) => t.fileUpload.cancel)}
							</Button>
						)}
						<Button
							leftSection={<IconUpload size={16} />}
							type="submit"
							disabled={
								filesField.value.length === 0 ||
								form.isSubmitting
							}
							loading={form.isSubmitting}
						>
							{form.isSubmitting
								? resolve((t) => t.fileUpload.uploading)
								: resolve((t) =>
										t.fileUpload.uploadFiles(
											filesField.value.length,
										),
									)}
						</Button>
					</Group>
				</Stack>
			</form>
		</Card>
	)
}
