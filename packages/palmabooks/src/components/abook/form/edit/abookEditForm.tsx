import { useTransResolver } from "@/app/app.hooks"
import {
	AbookFormClass,
	AbookFormInput,
} from "@/components/abook/form/shared/abookFormClass"
import { IconAlertCircle } from "@tabler/icons-react"
import { AbookData } from "@teawithsand/booklibr"
import { useForm, useFormField } from "@teawithsand/fstate"
import {
	Alert,
	Button,
	Paper,
	Stack,
	Textarea,
	TextInput,
} from "@teawithsand/mlui"
import { useCallback, useState } from "react"
import styles from "../shared/abookForm.module.scss"

interface AbookEditFormProps {
	initialData: AbookFormInput
	onSubmit: (data: AbookData) => Promise<void>
	onCancel?: () => void
}

export const AbookEditForm: React.FC<AbookEditFormProps> = ({
	initialData,
	onSubmit,
	onCancel,
}) => {
	const [formAtoms] = useState(() => new AbookFormClass(initialData))

	const form = useForm(formAtoms)
	const titleField = useFormField(formAtoms.fields.title)
	const descriptionField = useFormField(formAtoms.fields.description)
	const privateUserNoteField = useFormField(formAtoms.fields.privateUserNote)

	const { resolve } = useTransResolver()

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault()

			if (form.isSubmitting || form.hasErrors) return

			const handleFormSubmit = async (formData: AbookFormInput) => {
				const abookData = formAtoms.toAbookData(formData)
				return onSubmit(abookData)
			}

			form.submit(handleFormSubmit)
		},
		[form, formAtoms, onSubmit],
	)

	const handleCancel = useCallback(() => {
		if (onCancel) {
			onCancel()
		}
	}, [onCancel])

	return (
		<Paper
			className={styles["abook-form__container"]}
			shadow="sm"
			p="xl"
			radius="md"
			withBorder
		>
			<form onSubmit={handleSubmit}>
				<Stack gap="lg">
					{!form.globalErrors.isEmpty && (
						<Alert
							icon={<IconAlertCircle size="1rem" />}
							title={resolve(
								(t) => t.abooks.form.formValidationErrors,
							)}
							color="red"
							className={styles["abook-form__global-errors"]}
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
							title={resolve(
								(t) => t.abooks.form.submissionError,
							)}
							color="red"
							className={styles["abook-form__submit-error"]}
						>
							{form.lastSubmitError.message ||
								resolve((t) => t.abooks.form.unexpectedError)}
						</Alert>
					)}

					<div className={styles["abook-form__field-group"]}>
						<TextInput
							label={resolve((t) => t.abooks.form.title)}
							placeholder={resolve(
								(t) => t.abooks.form.titlePlaceholder,
							)}
							value={titleField.value}
							onChange={(event) =>
								titleField.set(event.currentTarget.value)
							}
							error={
								!titleField.errors.isEmpty &&
								titleField.errors.first
									? resolve(titleField.errors.first)
									: undefined
							}
							disabled={titleField.disabled}
							required
							withAsterisk
						/>
					</div>

					<div className={styles["abook-form__field-group"]}>
						<Textarea
							label={resolve((t) => t.abooks.form.description)}
							placeholder={resolve(
								(t) => t.abooks.form.descriptionPlaceholder,
							)}
							value={descriptionField.value}
							onChange={(event) =>
								descriptionField.set(event.currentTarget.value)
							}
							error={
								!descriptionField.errors.isEmpty &&
								descriptionField.errors.first
									? resolve(descriptionField.errors.first)
									: undefined
							}
							disabled={descriptionField.disabled}
							rows={4}
						/>
					</div>

					<div className={styles["abook-form__field-group"]}>
						<Textarea
							label={resolve(
								(t) => t.abooks.form.privateUserNote,
							)}
							placeholder={resolve(
								(t) => t.abooks.form.privateUserNotePlaceholder,
							)}
							value={privateUserNoteField.value}
							onChange={(event) =>
								privateUserNoteField.set(
									event.currentTarget.value,
								)
							}
							error={
								!privateUserNoteField.errors.isEmpty &&
								privateUserNoteField.errors.first
									? resolve(privateUserNoteField.errors.first)
									: undefined
							}
							disabled={privateUserNoteField.disabled}
							rows={3}
						/>
					</div>

					<div className={styles["abook-form__actions"]}>
						<Button
							className={styles["abook-form__submit-button"]}
							type="submit"
							loading={form.isSubmitting}
							disabled={form.hasErrors || form.isSubmitting}
						>
							{resolve((t) => t.abooks.form.updateButton)}
						</Button>
						{onCancel && (
							<Button
								variant="outline"
								onClick={handleCancel}
								disabled={form.isSubmitting}
							>
								{resolve((t) => t.common.cancel)}
							</Button>
						)}
					</div>
				</Stack>
			</form>
		</Paper>
	)
}
