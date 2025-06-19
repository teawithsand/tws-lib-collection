import { useApp } from "@/app"
import { RegisterFormData } from "@/components/form/register"
import { convertRegisterFormDataToBackendData } from "@/components/form/register/registerFormUtils"
import { Routes } from "@/router/routes"
import { useCallback } from "react"
import { useNavigate } from "react-router"
import { UserRegister } from "./UserRegister"

export const AutonomousUserRegister = () => {
	const app = useApp()
	const navigate = useNavigate()

	const handleSubmit = useCallback(
		async (data: RegisterFormData) => {
			const registrationData = convertRegisterFormDataToBackendData(data)

			const authResponse =
				await app.backendClient.register(registrationData)

			// The backend client automatically sets the auth token
			console.log("Registration successful:", authResponse.user)

			// Navigate to collections page after successful registration
			navigate(Routes.collections.navigate())
		},
		[app, navigate],
	)

	return <UserRegister onSubmit={handleSubmit} />
}
