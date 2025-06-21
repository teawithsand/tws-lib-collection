import { useApp } from "@/app"
import { RegisterFormData } from "@/components/form/register"
import { convertRegisterFormDataToBackendData } from "@/components/form/register/registerFormUtils"
import { Routes } from "@/router/routes"
import { useCallback } from "react"
import { useNavigate } from "react-router"
import { UserRegister } from "./UserRegister"

const LOG_TAG = "AutonomousUserRegister"

export const AutonomousUserRegister = () => {
	const app = useApp()
	const navigate = useNavigate()

	const handleSubmit = useCallback(
		async (data: RegisterFormData) => {
			const registrationData = convertRegisterFormDataToBackendData(data)

			app.logger.info(LOG_TAG, "Attempting registration", {
				username: registrationData.username,
			})

			try {
				await app.atomStore.set(
					app.backendService.register,
					registrationData,
				)

				app.logger.info(LOG_TAG, "Registration successful", {
					username: registrationData.username,
				})

				navigate(Routes.collections.navigate())
			} catch (error) {
				app.logger.error(LOG_TAG, "Registration failed", {
					username: registrationData.username,
					error,
				})
				throw error
			}
		},
		[app, navigate],
	)

	return <UserRegister onSubmit={handleSubmit} />
}
