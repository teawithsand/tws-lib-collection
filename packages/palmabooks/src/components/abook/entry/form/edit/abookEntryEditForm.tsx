import { useTransResolver } from "@/app/app.hooks"
import { IconAlertCircle } from "@tabler/icons-react"
import { AbookEntryData, AbookEntryDisposition } from "@teawithsand/booklibr"
import { useForm, useFormField } from "@teawithsand/fstate"
import {
	Alert,
	Button,
	NumberInput,
	Select,
	Stack,
	TextInput,
} from "@teawithsand/mlui"
import { ReactNode, useCallback, useState } from "react"
import styles from "../../../form/shared/abookForm.module.scss"
import {
	AbookEntryEditFormClass,
	AbookEntryEditFormInput,
} from "./abookEntryEditFormClass"

interface AbookEntryEditFormProps {
	readonly initialData: AbookEntryEditFormInput
	readonly onSubmit: (
		data: AbookEntryData,
		originalData: AbookEntryData,
	) => Promise<void>
	readonly onCancel?: () => void
	readonly error?: ReactNode
	readonly originalEntryData: AbookEntryData
}

export const AbookEntryEditForm: React.FC<AbookEntryEditFormProps> = ({
	initialData,
	onSubmit,
	onCancel,
	error,
	originalEntryData,
}) => {
	const [formAtoms] = useState(() => new AbookEntryEditFormClass(initialData))

	const form = useForm(formAtoms)
	const nameField = useFormField(formAtoms.fields.name)
	const dispositionField = useFormField(formAtoms.fields.disposition)
	const ordinalNumberField = useFormField(formAtoms.fields.ordinalNumber)

	const { resolve } = useTransResolver()

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault()

			if (form.isSubmitting || form.hasErrors) return

			const handleFormSubmit = async (
				formData: AbookEntryEditFormInput,
			) => {
				const entryData = formAtoms.toAbookEntryData(
					formData,
					originalEntryData,
				)
				return onSubmit(entryData, originalEntryData)
			}

			await form.submit(handleFormSubmit)
		},
		[form, formAtoms, onSubmit, originalEntryData],
	)

	const handleCancel = useCallback(() => {
		if (onCancel) {
			onCancel()
		}
	}, [onCancel])

	const dispositionOptions = [
		{
			value: AbookEntryDisposition.PLAYABLE_AUDIO,
			label: resolve((t) => t.entryList.disposition.labels.playableAudio),
		},
		{
			value: AbookEntryDisposition.COVER_IMAGE,
			label: resolve((t) => t.entryList.disposition.labels.coverImage),
		},
		{
			value: AbookEntryDisposition.DESCRIPTION,
			label: resolve((t) => t.entryList.disposition.labels.description),
		},
		{
			value: AbookEntryDisposition.UNKNOWN,
			label: resolve((t) => t.entryList.disposition.labels.unknown),
		},
	]

	return (
		<div className={styles["abook-form__container"]}>
			<form onSubmit={handleSubmit}>
				<Stack gap="lg">
					{error && (
						<Alert
							icon={<IconAlertCircle size="1rem" />}
							color="red"
							title={resolve((t) => t.common.submitFailedTitle)}
							className={styles["abook-form__submit-error"]}
						>
							{error}
						</Alert>
					)}

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
							title={resolve((t) => t.common.submitFailedTitle)}
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
							value={nameField.value}
							onChange={(event) =>
								nameField.set(event.currentTarget.value)
							}
							error={
								!nameField.errors.isEmpty &&
								nameField.errors.first
									? resolve(nameField.errors.first)
									: undefined
							}
							required
						/>
					</div>

					<div className={styles["abook-form__field-group"]}>
						<Select
							label={resolve(
								(t) => t.abooks.preview.dispositionLabel,
							)}
							placeholder={resolve(
								(t) =>
									t.entryList.filter.dispositionPlaceholder,
							)}
							value={dispositionField.value}
							onChange={(value) => {
								if (value) {
									dispositionField.set(
										value as AbookEntryDisposition,
									)
								}
							}}
							data={dispositionOptions}
							error={
								!dispositionField.errors.isEmpty &&
								dispositionField.errors.first
									? resolve(dispositionField.errors.first)
									: undefined
							}
						/>
					</div>

					<div className={styles["abook-form__field-group"]}>
						<NumberInput
							label={resolve(
								(t) => t.abooks.entry.metadata.ordinalLabel,
							)}
							placeholder={resolve(
								(t) =>
									t.abooks.entry.metadata.ordinalPlaceholder,
							)}
							value={ordinalNumberField.value}
							onChange={(value) =>
								ordinalNumberField.set(Number(value) || 0)
							}
							min={0}
							error={
								!ordinalNumberField.errors.isEmpty &&
								ordinalNumberField.errors.first
									? resolve(ordinalNumberField.errors.first)
									: undefined
							}
						/>
					</div>

					<div className={styles["abook-form__actions"]}>
						{onCancel && (
							<Button
								type="button"
								variant="outline"
								onClick={handleCancel}
								disabled={form.isSubmitting}
							>
								{resolve((t) => t.common.cancel)}
							</Button>
						)}

						<Button
							type="submit"
							loading={form.isSubmitting}
							disabled={form.hasErrors}
							className={styles["abook-form__submit-button"]}
						>
							{resolve((t) => t.abooks.form.updateButton)}
						</Button>
					</div>
				</Stack>
			</form>
		</div>
	)
}
