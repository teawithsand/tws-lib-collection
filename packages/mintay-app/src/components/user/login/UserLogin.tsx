import { Title } from "@mantine/core"
import { useTransResolver } from "../../../app"
import { LoginForm, type LoginFormData } from "../../form/login"
import styles from "./UserLogin.module.scss"

interface UserLoginProps {
	readonly onSubmit: (data: LoginFormData) => Promise<void>
}

export const UserLogin = ({ onSubmit }: UserLoginProps) => {
	const { resolve } = useTransResolver()

	return (
		<div className={styles["user-login__container"]}>
			<Title order={2} className={styles["user-login__title"]}>
				{resolve((t) => t.auth.login.submit())}
			</Title>
			<LoginForm onSubmit={onSubmit} />
		</div>
	)
}
