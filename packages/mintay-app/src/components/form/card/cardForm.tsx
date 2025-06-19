import {
	Alert,
	Button,
	NumberInput,
	Paper,
	Stack,
	Textarea,
	TextInput,
} from "@mantine/core"
import { IconAlertCircle } from "@tabler/icons-react"
import { useForm, useFormField } from "@teawithsand/fstate"
import { useCallback, useState } from "react"
import { useTransResolver } from "../../../app"
import styles from "./cardForm.module.scss"
import { CardFormClass, CardFormData } from "./cardFormClass"

interface CardFormProps {
	initialData?: Partial<CardFormData>
	onSubmit: (data: CardFormData) => Promise<void>
}

export const CardForm: React.FC<CardFormProps> = ({
	initialData,
	onSubmit,
}) => {
	const [formAtoms] = useState(() => new CardFormClass(initialData))

	const form = useForm(formAtoms)
	const globalIdField = useFormField(formAtoms.fields.globalId)
	const questionContentField = useFormField(formAtoms.fields.questionContent)
	const answerContentField = useFormField(formAtoms.fields.answerContent)
	const discoveryPriorityField = useFormField(
		formAtoms.fields.discoveryPriority,
	)

	const { resolve } = useTransResolver()

	const resolvedSubmitLabel = resolve((t) => t.card.form.submit())

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
			className={styles["card-form__container"]}
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
							title={resolve((t) =>
								t.card.form.formValidationErrors(),
							)}
							color="red"
							className={styles["card-form__global-errors"]}
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

					<div className={styles["card-form__field-group"]}>
						<TextInput
							label={resolve((t) => t.card.form.cardId())}
							placeholder={resolve((t) =>
								t.card.form.enterCardId(),
							)}
							value={globalIdField.value}
							onChange={(event) =>
								globalIdField.set(event.currentTarget.value)
							}
							error={
								!globalIdField.errors.isEmpty &&
								globalIdField.errors.first
									? resolve(globalIdField.errors.first)
									: undefined
							}
							disabled={globalIdField.disabled}
							required
							withAsterisk
						/>
					</div>

					<div className={styles["card-form__two-column"]}>
						<div
							className={`${styles["card-form__field-group"]} ${styles["card-form__content-field"]}`}
						>
							<Textarea
								label={resolve((t) =>
									t.card.form.questionContent(),
								)}
								placeholder={resolve((t) =>
									t.card.form.enterQuestionContent(),
								)}
								value={questionContentField.value}
								onChange={(event) =>
									questionContentField.set(
										event.currentTarget.value,
									)
								}
								error={
									!questionContentField.errors.isEmpty &&
									questionContentField.errors.first
										? resolve(
												questionContentField.errors
													.first,
											)
										: undefined
								}
								disabled={questionContentField.disabled}
								required
								withAsterisk
							/>
						</div>

						<div
							className={`${styles["card-form__field-group"]} ${styles["card-form__content-field"]}`}
						>
							<Textarea
								label={resolve((t) =>
									t.card.form.answerContent(),
								)}
								placeholder={resolve((t) =>
									t.card.form.enterAnswerContent(),
								)}
								value={answerContentField.value}
								onChange={(event) =>
									answerContentField.set(
										event.currentTarget.value,
									)
								}
								error={
									!answerContentField.errors.isEmpty &&
									answerContentField.errors.first
										? resolve(
												answerContentField.errors.first,
											)
										: undefined
								}
								disabled={answerContentField.disabled}
								required
								withAsterisk
							/>
						</div>
					</div>

					<div
						className={`${styles["card-form__field-group"]} ${styles["card-form__priority-field"]}`}
					>
						<NumberInput
							label={resolve((t) =>
								t.card.form.discoveryPriority(),
							)}
							placeholder={resolve((t) =>
								t.card.form.enterDiscoveryPriority(),
							)}
							value={discoveryPriorityField.value}
							onChange={(value) => {
								if (
									typeof value === "number" &&
									!isNaN(value)
								) {
									discoveryPriorityField.set(value)
								} else {
									discoveryPriorityField.set(0)
								}
							}}
							error={
								!discoveryPriorityField.errors.isEmpty &&
								discoveryPriorityField.errors.first
									? resolve(
											discoveryPriorityField.errors.first,
										)
									: undefined
							}
							disabled={discoveryPriorityField.disabled}
							min={0}
						/>
					</div>

					<div className={styles["card-form__actions"]}>
						<Button
							className={styles["card-form__submit-button"]}
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
