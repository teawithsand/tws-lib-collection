import { useTransResolver } from "@/app/app.hooks"
import {
	IconAlertCircle,
	IconChevronDown,
	IconUpload,
} from "@tabler/icons-react"
import { useForm, useFormField } from "@teawithsand/fstate"
import {
	Alert,
	Button,
	Collapse,
	FileInput,
	Stack,
	Textarea,
	TextInput,
} from "@teawithsand/mlui"
import { useCallback, useState } from "react"
import styles from "./abookCreateForm.module.scss"
import {
	AbookCreateFormClass,
	AbookCreateFormData,
} from "./abookCreateFormClass"

interface AbookCreateFormProps {
	initialData?: Partial<AbookCreateFormData>
	onSubmit: (data: AbookCreateFormData) => Promise<void>
}

export const AbookCreateForm: React.FC<AbookCreateFormProps> = ({
	initialData,
	onSubmit,
}) => {
	const [formAtoms] = useState(() => new AbookCreateFormClass(initialData))
	const [morePropertiesOpened, setMorePropertiesOpened] = useState(false)
	const { resolve } = useTransResolver()

	const form = useForm(formAtoms)
	const titleField = useFormField(formAtoms.fields.title)
	const descriptionField = useFormField(formAtoms.fields.description)
	const privateNoteField = useFormField(formAtoms.fields.privateNote)
	const filesField = useFormField(formAtoms.fields.files)

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
			className={styles["abook-create-form__container"]}
		>
			<Stack gap="lg">
				{!form.globalErrors.isEmpty && (
					<Alert
						icon={<IconAlertCircle size="1rem" />}
						title={resolve(
							(t) => t.abook.create.form.validationErrors,
						)}
						color="red"
						className={styles["abook-create-form__global-errors"]}
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
						className={styles["abook-create-form__submit-error"]}
					>
						{form.lastSubmitError.message ||
							resolve((t) => t.abook.create.form.unexpectedError)}
					</Alert>
				)}
				<div className={styles["abook-create-form__field-group"]}>
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
				<div className={styles["abook-create-form__field-group"]}>
					<FileInput
						label={resolve((t) => t.abook.create.form.filesLabel)}
						placeholder={resolve(
							(t) => t.abook.create.form.filesPlaceholder,
						)}
						value={filesField.value}
						onChange={(files) => {
							if (files) {
								filesField.set(files)
							}
						}}
						error={
							!filesField.errors.isEmpty &&
							filesField.errors.first
								? filesField.errors.first
								: undefined
						}
						disabled={filesField.disabled}
						multiple
						accept="audio/*,image/*"
						leftSection={<IconUpload size="1rem" />}
						required
						withAsterisk
						clearable
					/>
					{filesField.value.length > 0 && (
						<div
							className={styles["abook-create-form__files-info"]}
						>
							<small>
								{filesField.value.length} file(s) selected:
							</small>
							<ul
								className={
									styles["abook-create-form__files-list"]
								}
							>
								{filesField.value.map((file, index) => (
									<li key={index}>
										{file.name} (
										{(file.size / 1024 / 1024).toFixed(2)}{" "}
										MB)
									</li>
								))}
							</ul>
						</div>
					)}
				</div>
				<div
					className={
						styles["abook-create-form__more-properties-toggle"]
					}
				>
					<Button
						variant="subtle"
						onClick={() =>
							setMorePropertiesOpened(!morePropertiesOpened)
						}
						rightSection={
							<IconChevronDown
								size="1rem"
								style={{
									transform: morePropertiesOpened
										? "rotate(180deg)"
										: "none",
									transition: "transform 200ms ease",
								}}
							/>
						}
					>
						More Properties
					</Button>
				</div>
				<Collapse in={morePropertiesOpened}>
					<Stack gap="lg">
						<div
							className={`${styles["abook-create-form__field-group"]} ${styles["abook-create-form__description-field"]}`}
						>
							<Textarea
								label="Description"
								placeholder="Enter audiobook description (optional)"
								value={descriptionField.value}
								onChange={(event) =>
									descriptionField.set(
										event.currentTarget.value,
									)
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
							className={`${styles["abook-create-form__field-group"]} ${styles["abook-create-form__note-field"]}`}
						>
							<Textarea
								label={resolve(
									(t) => t.abook.create.form.privateNoteLabel,
								)}
								placeholder={resolve(
									(t) =>
										t.abook.create.form
											.privateNotePlaceholder,
								)}
								value={privateNoteField.value}
								onChange={(event) =>
									privateNoteField.set(
										event.currentTarget.value,
									)
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
					</Stack>
				</Collapse>
				<div className={styles["abook-create-form__actions"]}>
					<Button
						className={styles["abook-create-form__submit-button"]}
						type="submit"
						loading={form.isSubmitting}
						disabled={form.hasErrors || form.isSubmitting}
					>
						{resolve((t) => t.abook.create.form.submitButton)}
					</Button>
				</div>
			</Stack>
		</form>
	)
}
