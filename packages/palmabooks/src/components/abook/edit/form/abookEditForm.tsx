import { useTransResolver } from "@/app/app.hooks"
import { IconAlertCircle } from "@tabler/icons-react"
import { useForm, useFormField } from "@teawithsand/fstate"
import { Alert, Button, Stack, Textarea, TextInput } from "@teawithsand/mlui"
import { useCallback, useState } from "react"
import styles from "./abookEditForm.module.scss"
import { AbookEditFormClass, AbookEditFormData } from "./abookEditFormClass"

interface AbookEditFormProps {
	initialData?: Partial<AbookEditFormData>
	onSubmit: (data: AbookEditFormData) => Promise<void>
}

export const AbookEditForm: React.FC<AbookEditFormProps> = ({
	initialData,
	onSubmit,
}) => {
	const [formAtoms] = useState(() => new AbookEditFormClass(initialData))
	const { resolve } = useTransResolver()

	const form = useForm(formAtoms)
	const titleField = useFormField(formAtoms.fields.title)
	const descriptionField = useFormField(formAtoms.fields.description)
	const privateNoteField = useFormField(formAtoms.fields.privateNote)

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault()

			if (form.isSubmitting || form.hasErrors) return
			form.submit(onSubmit)
		},
		[form, onSubmit],
	)

	return (
		<form
			onSubmit={handleSubmit}
			className={styles["abook-edit-form__container"]}
		>
			<Stack gap="lg">
				{!form.globalErrors.isEmpty && (
					<Alert
						icon={<IconAlertCircle size="1rem" />}
						title={resolve(
							(t) => t.abook.create.form.validationErrors,
						)}
						color="red"
						className={styles["abook-edit-form__global-errors"]}
					>
						<ul>
							{form.globalErrors.errors.map((error, index) => (
								<li key={index}>{error}</li>
							))}
						</ul>
					</Alert>
				)}
				{form.lastSubmitError && (
					<Alert
						icon={<IconAlertCircle size="1rem" />}
						title={resolve(
							(t) => t.abook.create.form.submissionError,
						)}
						color="red"
						className={styles["abook-edit-form__submit-error"]}
					>
						{form.lastSubmitError.message ||
							resolve((t) => t.abook.create.form.unexpectedError)}
					</Alert>
				)}
				<div className={styles["abook-edit-form__field-group"]}>
					<TextInput
						label={resolve((t) => t.abook.create.form.titleLabel)}
						placeholder={resolve(
							(t) => t.abook.create.form.titlePlaceholder,
						)}
						value={titleField.value}
						onChange={(event) =>
							titleField.set(event.currentTarget.value)
						}
						error={
							!titleField.errors.isEmpty &&
							titleField.errors.first
								? titleField.errors.first
								: undefined
						}
						disabled={titleField.disabled}
						required
						withAsterisk
					/>
				</div>
				<div
					className={`${styles["abook-edit-form__field-group"]} ${styles["abook-edit-form__description-field"]}`}
				>
					<Textarea
						label={resolve(
							(t) => t.abook.create.form.descriptionLabel,
						)}
						placeholder={resolve(
							(t) => t.abook.create.form.descriptionPlaceholder,
						)}
						value={descriptionField.value}
						onChange={(event) =>
							descriptionField.set(event.currentTarget.value)
						}
						error={
							!descriptionField.errors.isEmpty &&
							descriptionField.errors.first
								? descriptionField.errors.first
								: undefined
						}
						disabled={descriptionField.disabled}
						minRows={3}
						autosize
					/>
				</div>
				<div
					className={`${styles["abook-edit-form__field-group"]} ${styles["abook-edit-form__note-field"]}`}
				>
					<Textarea
						label={resolve(
							(t) => t.abook.create.form.privateNoteLabel,
						)}
						placeholder={resolve(
							(t) => t.abook.create.form.privateNotePlaceholder,
						)}
						value={privateNoteField.value}
						onChange={(event) =>
							privateNoteField.set(event.currentTarget.value)
						}
						error={
							!privateNoteField.errors.isEmpty &&
							privateNoteField.errors.first
								? privateNoteField.errors.first
								: undefined
						}
						disabled={privateNoteField.disabled}
						minRows={2}
						autosize
					/>
				</div>
				<div className={styles["abook-edit-form__actions"]}>
					<Button
						className={styles["abook-edit-form__submit-button"]}
						type="submit"
						loading={form.isSubmitting}
						disabled={form.hasErrors || form.isSubmitting}
					>
						Save Changes
					</Button>
				</div>
			</Stack>
		</form>
	)
}
