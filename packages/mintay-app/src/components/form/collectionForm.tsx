import {
	Alert,
	Button,
	Paper,
	Stack,
	Textarea,
	TextInput,
	Title,
} from "@mantine/core"
import { IconAlertCircle } from "@tabler/icons-react"
import { useForm, useFormField } from "@teawithsand/fstate"
import { useCallback, useState } from "react"
import { useTransResolver } from "../../app"
import styles from "./collectionForm.module.scss"
import { CollectionFormClass, CollectionFormData } from "./collectionFormClass"

interface CollectionFormProps {
	initialData?: Partial<CollectionFormData>
	onSubmit: (data: CollectionFormData) => Promise<void>
}

export const CollectionForm: React.FC<CollectionFormProps> = ({
	initialData,
	onSubmit,
}) => {
	const [formAtoms] = useState(() => new CollectionFormClass(initialData))

	const form = useForm(formAtoms)
	const nameField = useFormField(formAtoms.fields.title)
	const descriptionField = useFormField(formAtoms.fields.description)

	const { resolve } = useTransResolver()

	const resolvedTitle = resolve((t) => t.collection.form.createCollection())
	const resolvedSubmitLabel = resolve((t) => t.collection.form.submit())

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault()

			if (form.isSubmitting || form.hasErrors) return
			form.submit(onSubmit)
		},
		[form, onSubmit],
	)

	return (
		<Paper
			className={styles["collection-form__container"]}
			shadow="sm"
			p="xl"
			radius="md"
			withBorder
		>
			<Title order={2} className={styles["collection-form__title"]}>
				{resolvedTitle}
			</Title>

			<form onSubmit={handleSubmit}>
				<Stack gap="lg">
					{!form.globalErrors.isEmpty && (
						<Alert
							icon={<IconAlertCircle size="1rem" />}
							title={resolve((t) =>
								t.collection.form.formValidationErrors(),
							)}
							color="red"
							className={styles["collection-form__global-errors"]}
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

					<div className={styles["collection-form__field-group"]}>
						<TextInput
							label={resolve((t) =>
								t.collection.form.collectionName(),
							)}
							placeholder={resolve((t) =>
								t.collection.form.enterCollectionName(),
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
							disabled={nameField.disabled}
							required
							withAsterisk
						/>
					</div>

					<div
						className={`${styles["collection-form__field-group"]} ${styles["collection-form__description-field"]}`}
					>
						<Textarea
							label={resolve((t) =>
								t.collection.form.description(),
							)}
							placeholder={resolve((t) =>
								t.collection.form.enterCollectionDescription(),
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
						/>
					</div>

					<div className={styles["collection-form__actions"]}>
						<Button
							className={styles["collection-form__submit-button"]}
							type="submit"
							loading={form.isSubmitting}
							disabled={form.hasErrors || form.isSubmitting}
						>
							{resolvedSubmitLabel}
						</Button>
					</div>
				</Stack>
			</form>
		</Paper>
	)
}
