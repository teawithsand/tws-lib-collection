import { Title } from "@mantine/core"
import { useTransResolver } from "../../../app"
import { RegisterForm, type RegisterFormData } from "../../form/register"
import styles from "./UserRegister.module.scss"

interface UserRegisterProps {
	readonly onSubmit: (data: RegisterFormData) => Promise<void>
}

export const UserRegister = ({ onSubmit }: UserRegisterProps) => {
	const { resolve } = useTransResolver()

	return (
		<div className={styles["user-register__container"]}>
			<Title order={2} className={styles["user-register__title"]}>
				{resolve((t) => t.auth.register.submit())}
			</Title>
			<RegisterForm onSubmit={onSubmit} />
		</div>
	)
}
