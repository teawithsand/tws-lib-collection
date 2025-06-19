import {
	Alert,
	Button,
	Paper,
	PasswordInput,
	Stack,
	TextInput,
} from "@mantine/core"
import { IconAlertCircle } from "@tabler/icons-react"
import { useForm, useFormField } from "@teawithsand/fstate"
import { useCallback, useState } from "react"
import { useTransResolver } from "../../../app"
import styles from "./registerForm.module.scss"
import { RegisterFormClass, RegisterFormData } from "./registerFormClass"

interface RegisterFormProps {
	initialData?: Partial<RegisterFormData>
	onSubmit: (data: RegisterFormData) => Promise<void>
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
	initialData,
	onSubmit,
}) => {
	const [formAtoms] = useState(() => new RegisterFormClass(initialData))

	const form = useForm(formAtoms)
	const usernameField = useFormField(formAtoms.fields.username)
	const passwordField = useFormField(formAtoms.fields.password)
	const confirmPasswordField = useFormField(formAtoms.fields.confirmPassword)

	const { resolve } = useTransResolver()

	const resolvedSubmitLabel = resolve((t) => t.auth.register.submit())

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
			className={styles["register-form__container"]}
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
								t.auth.register.formValidationErrors(),
							)}
							color="red"
							className={styles["register-form__global-errors"]}
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

					<div className={styles["register-form__field-group"]}>
						<TextInput
							label={resolve((t) => t.auth.register.username())}
							placeholder={resolve((t) =>
								t.auth.register.enterUsername(),
							)}
							value={usernameField.value}
							onChange={(event) =>
								usernameField.set(event.currentTarget.value)
							}
							error={
								!usernameField.errors.isEmpty &&
								usernameField.errors.first
									? resolve(usernameField.errors.first)
									: undefined
							}
							disabled={usernameField.disabled}
							required
							withAsterisk
						/>
					</div>

					<div className={styles["register-form__field-group"]}>
						<PasswordInput
							label={resolve((t) => t.auth.register.password())}
							placeholder={resolve((t) =>
								t.auth.register.enterPassword(),
							)}
							value={passwordField.value}
							onChange={(event) =>
								passwordField.set(event.currentTarget.value)
							}
							error={
								!passwordField.errors.isEmpty &&
								passwordField.errors.first
									? resolve(passwordField.errors.first)
									: undefined
							}
							disabled={passwordField.disabled}
							required
							withAsterisk
						/>
					</div>

					<div className={styles["register-form__field-group"]}>
						<PasswordInput
							label={resolve((t) =>
								t.auth.register.confirmPassword(),
							)}
							placeholder={resolve((t) =>
								t.auth.register.enterConfirmPassword(),
							)}
							value={confirmPasswordField.value}
							onChange={(event) =>
								confirmPasswordField.set(
									event.currentTarget.value,
								)
							}
							error={
								!confirmPasswordField.errors.isEmpty &&
								confirmPasswordField.errors.first
									? resolve(confirmPasswordField.errors.first)
									: undefined
							}
							disabled={confirmPasswordField.disabled}
							required
							withAsterisk
						/>
					</div>

					<div className={styles["register-form__actions"]}>
						<Button
							className={styles["register-form__submit-button"]}
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
