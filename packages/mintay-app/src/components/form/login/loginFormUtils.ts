import { UserLoginData } from "../../../domain/backend/client"
import { LoginFormData } from "./loginFormClass"

/**
 * Convert login form data to backend client data format
 */
export const convertLoginFormDataToBackendData = (
	formData: LoginFormData,
): UserLoginData => {
	return {
		username: formData.username,
		password: formData.password,
	}
}
