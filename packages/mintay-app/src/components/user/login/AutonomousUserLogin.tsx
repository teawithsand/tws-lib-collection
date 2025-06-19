import { useApp } from "@/app"
import { LoginFormData } from "@/components/form/login"
import { convertLoginFormDataToBackendData } from "@/components/form/login/loginFormUtils"
import { Routes } from "@/router/routes"
import { useCallback } from "react"
import { useNavigate } from "react-router"
import { UserLogin } from "./UserLogin"

export const AutonomousUserLogin = () => {
	const app = useApp()
	const navigate = useNavigate()

	const handleSubmit = useCallback(
		async (data: LoginFormData) => {
			const loginData = convertLoginFormDataToBackendData(data)

			const authResponse = await app.backendClient.login(loginData)

			// The backend client automatically sets the auth token
			console.log("Login successful:", authResponse.user)

			// Navigate to collections page after successful login
			navigate(Routes.collections.navigate())
		},
		[app, navigate],
	)

	return <UserLogin onSubmit={handleSubmit} />
}
