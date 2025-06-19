import { useApp } from "@/app"
import { LoginFormData } from "@/components/form/login"
import { convertLoginFormDataToBackendData } from "@/components/form/login/loginFormUtils"
import { Routes } from "@/router/routes"
import { useCallback } from "react"
import { useNavigate } from "react-router"
import { UserLogin } from "./UserLogin"

const LOG_TAG = "AutonomousUserLogin"

export const AutonomousUserLogin = () => {
	const app = useApp()
	const navigate = useNavigate()

	const handleSubmit = useCallback(
		async (data: LoginFormData) => {
			const loginData = convertLoginFormDataToBackendData(data)

			app.logger.info(LOG_TAG, "Attempting login", {
				username: loginData.username,
			})

			try {
				await app.atomStore.set(app.backendService.login, loginData)

				app.logger.info(LOG_TAG, "Login successful", {
					username: loginData.username,
				})

				navigate(Routes.collections.navigate())
			} catch (error) {
				app.logger.error(LOG_TAG, "Login failed", {
					username: loginData.username,
					error,
				})
				throw error
			}
		},
		[app, navigate],
	)

	return <UserLogin onSubmit={handleSubmit} />
}
