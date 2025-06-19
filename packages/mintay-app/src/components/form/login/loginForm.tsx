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
import styles from "./loginForm.module.scss"
import { LoginFormClass, LoginFormData } from "./loginFormClass"

interface LoginFormProps {
	initialData?: Partial<LoginFormData>
	onSubmit: (data: LoginFormData) => Promise<void>
}

export const LoginForm: React.FC<LoginFormProps> = ({
	initialData,
	onSubmit,
}) => {
	const [formAtoms] = useState(() => new LoginFormClass(initialData))

	const form = useForm(formAtoms)
	const usernameField = useFormField(formAtoms.fields.username)
	const passwordField = useFormField(formAtoms.fields.password)

	const { resolve } = useTransResolver()

	const resolvedSubmitLabel = resolve((t) => t.auth.login.submit())

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
			className={styles["login-form__container"]}
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
								t.auth.login.formValidationErrors(),
							)}
							color="red"
							className={styles["login-form__global-errors"]}
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

					<div className={styles["login-form__field-group"]}>
						<TextInput
							label={resolve((t) => t.auth.login.username())}
							placeholder={resolve((t) =>
								t.auth.login.enterUsername(),
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

					<div className={styles["login-form__field-group"]}>
						<PasswordInput
							label={resolve((t) => t.auth.login.password())}
							placeholder={resolve((t) =>
								t.auth.login.enterPassword(),
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

					<div className={styles["login-form__actions"]}>
						<Button
							className={styles["login-form__submit-button"]}
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
