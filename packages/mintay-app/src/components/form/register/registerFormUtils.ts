import { UserRegistrationData } from "../../../domain/backend/client"
import { RegisterFormData } from "./registerFormClass"

/**
 * Convert register form data to backend client data format
 */
export const convertRegisterFormDataToBackendData = (
	formData: RegisterFormData,
): UserRegistrationData => {
	return {
		username: formData.username,
		password: formData.password,
	}
}
