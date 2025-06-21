import {
	Alert,
	Button,
	NumberInput,
	Paper,
	Stack,
	Tabs,
	Text,
} from "@mantine/core"
import {
	IconAlertCircle,
	IconArrowRight,
	IconMessageCircle,
	IconQuestionMark,
	IconSettings,
} from "@tabler/icons-react"
import { useForm, useFormField } from "@teawithsand/fstate"
import "@uiw/react-markdown-preview/markdown.css"
import MDEditor from "@uiw/react-md-editor"
import "@uiw/react-md-editor/markdown-editor.css"
import { useCallback, useState } from "react"
import { useTransResolver } from "../../../app"
import styles from "./cardForm.module.scss"
import { CardFormClass, CardFormData, CardFormInput } from "./cardFormClass"

enum CardFormTab {
	QUESTION = "question",
	ANSWER = "answer",
	SETTINGS = "settings",
}

const CARD_FORM_TABS_ORDER = [
	CardFormTab.QUESTION,
	CardFormTab.ANSWER,
	CardFormTab.SETTINGS,
] as const

interface CardFormProps {
	initialData?: Partial<CardFormInput>
	onSubmit: (data: CardFormData) => Promise<void>
}

export const CardForm: React.FC<CardFormProps> = ({
	initialData,
	onSubmit,
}) => {
	const [formAtoms] = useState(() => new CardFormClass(initialData))
	const [activeTab, setActiveTab] = useState<CardFormTab>(
		CardFormTab.QUESTION,
	)

	const form = useForm(formAtoms)
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

			const handleFormSubmit = async (formData: CardFormInput) => {
				const cardData = formAtoms.toCardData(formData)
				return onSubmit(cardData)
			}

			form.submit(handleFormSubmit)
		},
		[form, formAtoms, onSubmit],
	)

	const handleTabChange = useCallback((value: string | null) => {
		if (
			value &&
			Object.values(CardFormTab).includes(value as CardFormTab)
		) {
			setActiveTab(value as CardFormTab)
		}
	}, [])

	const handleNextTab = useCallback(() => {
		const currentIndex = CARD_FORM_TABS_ORDER.indexOf(activeTab)
		if (currentIndex < CARD_FORM_TABS_ORDER.length - 1) {
			setActiveTab(CARD_FORM_TABS_ORDER[currentIndex + 1])
		}
	}, [activeTab])

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

					<Tabs value={activeTab} onChange={handleTabChange}>
						<Tabs.List justify="space-between">
							<Tabs.Tab value={CardFormTab.QUESTION}>
								<IconQuestionMark size="1.2rem" />
							</Tabs.Tab>
							<Tabs.Tab value={CardFormTab.ANSWER}>
								<IconMessageCircle size="1.2rem" />
							</Tabs.Tab>
							<Tabs.Tab value={CardFormTab.SETTINGS}>
								<IconSettings size="1.2rem" />
							</Tabs.Tab>
						</Tabs.List>

						<Tabs.Panel value={CardFormTab.QUESTION} pt="lg">
							<Stack gap="lg">
								<div
									className={`${styles["card-form__field-group"]} ${styles["card-form__content-field"]}`}
								>
									<Text
										component="label"
										size="sm"
										fw={500}
										mb="xs"
									>
										{resolve((t) =>
											t.card.form.questionContent(),
										)}
									</Text>
									<MDEditor
										value={questionContentField.value}
										onChange={(value: string | undefined) =>
											questionContentField.set(
												value || "",
											)
										}
										preview="edit"
										hideToolbar={false}
										visibleDragbar={false}
										data-disabled={
											questionContentField.disabled
										}
									/>
									{!questionContentField.errors.isEmpty &&
										questionContentField.errors.first && (
											<Text size="xs" c="red" mt="xs">
												{resolve(
													questionContentField.errors
														.first,
												)}
											</Text>
										)}
								</div>

								<div className={styles["card-form__actions"]}>
									<Button
										className={
											styles["card-form__next-button"]
										}
										onClick={handleNextTab}
										rightSection={
											<IconArrowRight size="1rem" />
										}
									>
										Next
									</Button>
								</div>
							</Stack>
						</Tabs.Panel>

						<Tabs.Panel value={CardFormTab.ANSWER} pt="lg">
							<Stack gap="lg">
								<div
									className={`${styles["card-form__field-group"]} ${styles["card-form__content-field"]}`}
								>
									<Text
										component="label"
										size="sm"
										fw={500}
										mb="xs"
									>
										{resolve((t) =>
											t.card.form.answerContent(),
										)}
									</Text>
									<MDEditor
										value={answerContentField.value}
										onChange={(value: string | undefined) =>
											answerContentField.set(value || "")
										}
										preview="edit"
										hideToolbar={false}
										visibleDragbar={false}
										data-disabled={
											answerContentField.disabled
										}
									/>
									{!answerContentField.errors.isEmpty &&
										answerContentField.errors.first && (
											<Text size="xs" c="red" mt="xs">
												{resolve(
													answerContentField.errors
														.first,
												)}
											</Text>
										)}
								</div>

								<div className={styles["card-form__actions"]}>
									<Button
										className={
											styles["card-form__next-button"]
										}
										onClick={handleNextTab}
										rightSection={
											<IconArrowRight size="1rem" />
										}
									>
										Next
									</Button>
								</div>
							</Stack>
						</Tabs.Panel>

						<Tabs.Panel value={CardFormTab.SETTINGS} pt="lg">
							<Stack gap="lg">
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
												discoveryPriorityField.set(
													value,
												)
											} else {
												discoveryPriorityField.set(0)
											}
										}}
										error={
											!discoveryPriorityField.errors
												.isEmpty &&
											discoveryPriorityField.errors.first
												? resolve(
														discoveryPriorityField
															.errors.first,
													)
												: undefined
										}
										disabled={
											discoveryPriorityField.disabled
										}
										decimalScale={0}
										allowDecimal={false}
									/>
								</div>

								<div className={styles["card-form__actions"]}>
									<Button
										className={
											styles["card-form__submit-button"]
										}
										type="submit"
										loading={form.isSubmitting}
										disabled={
											form.hasErrors || form.isSubmitting
										}
									>
										{resolvedSubmitLabel}
									</Button>
								</div>
							</Stack>
						</Tabs.Panel>
					</Tabs>
				</Stack>
			</form>
		</Paper>
	)
}
