import { useTransResolver } from "@/app/app.hooks"
import {
	AdvancedFileField,
	AdvancedFileFieldEntry,
} from "@/components/field/advancedFileField/AdvancedFileField"
import { AdvancedFileFieldPreviewMode } from "@/components/field/advancedFileField/types"
import { IconAlertCircle } from "@tabler/icons-react"
import { useForm, useFormField } from "@teawithsand/fstate"
import {
	Alert,
	Button,
	MluiBreakpoint,
	Stack,
	useBreakpoint,
} from "@teawithsand/mlui"
import { ReactNode, useCallback, useState } from "react"
import styles from "./abookUploadForm.module.scss"
import {
	AbookUploadFormClass,
	AbookUploadFormInput,
} from "./abookUploadFormClass"

interface AbookUploadFormProps {
	initialData?: Partial<AbookUploadFormInput>
	onSubmit: (files: AdvancedFileFieldEntry[]) => Promise<void>
	disabled?: boolean
	submitButtonText?: string
	error?: ReactNode
}

export const AbookUploadForm: React.FC<AbookUploadFormProps> = ({
	initialData,
	onSubmit,
	disabled = false,
	submitButtonText,
	error,
}) => {
	const [formAtoms] = useState(() => new AbookUploadFormClass(initialData))

	const form = useForm(formAtoms)
	const filesField = useFormField(formAtoms.fields.files)

	const { resolve } = useTransResolver()
	const { isAtMost } = useBreakpoint()

	const previewMode = isAtMost(MluiBreakpoint.SM)
		? AdvancedFileFieldPreviewMode.MODAL
		: AdvancedFileFieldPreviewMode.ENABLED

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault()

			if (form.isSubmitting || disabled) return

			const handleFormSubmit = async (formData: AbookUploadFormInput) => {
				return onSubmit(formData.files)
			}

			form.submit(handleFormSubmit)
		},
		[form, onSubmit, disabled],
	)

	const handleFilesChange = useCallback(
		(files: AdvancedFileFieldEntry[]) => {
			filesField.set(files)
		},
		[filesField],
	)

	return (
		<div className={styles["upload-form__container"]}>
			<form onSubmit={handleSubmit}>
				<Stack gap="lg">
					{error && (
						<Alert
							icon={<IconAlertCircle size="1rem" />}
							color="red"
							title={resolve((t) => t.common.submitFailedTitle)}
							className={styles["upload-form__error-alert"]}
						>
							{error}
						</Alert>
					)}

					{form.lastSubmitError && (
						<Alert
							icon={<IconAlertCircle size="1rem" />}
							color="red"
							title={resolve((t) => t.common.submitFailedTitle)}
							className={styles["upload-form__error-alert"]}
						>
							{form.lastSubmitError.message ||
								resolve((t) => t.abooks.form.unexpectedError)}
						</Alert>
					)}

					<div className={styles["upload-form__field-group"]}>
						<AdvancedFileField
							files={filesField.value}
							onFilesChange={handleFilesChange}
							accept="audio/*"
							multiple={true}
							allowDirectories={true}
							disabled={disabled || form.isSubmitting}
							previewMode={previewMode}
						/>
					</div>

					<div className={styles["upload-form__actions"]}>
						<Button
							type="submit"
							loading={form.isSubmitting}
							disabled={disabled || filesField.value.length === 0}
							className={styles["upload-form__submit-button"]}
						>
							{submitButtonText ??
								resolve((t) =>
									t.fileUpload.uploadFiles(
										filesField.value.length,
									),
								)}
						</Button>
					</div>
				</Stack>
			</form>
		</div>
	)
}
