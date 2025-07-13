import { useNavigate } from "react-router"
import { type NavigationHook } from "../defines"

/**
 * Hook that provides navigation functionality using react-router
 */
export const useNavigation = (): NavigationHook => {
	const navigate = useNavigate()

	return {
		navigate: (to, options) => {
			navigate(to, {
				replace: options?.replace,
				state: options?.state,
			})
		},
		navigateBack: () => {
			navigate(-1)
		},
	}
}
