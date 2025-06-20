import { useApp } from "@/app"
import { Routes } from "@/router/routes"
import { useAtomValue } from "@teawithsand/fstate"
import { useCallback } from "react"
import { useNavigate } from "react-router"
import { LoginRequired } from "./LoginRequired"
import { UserProfile } from "./UserProfile"

const LOG_TAG = "AutonomousUserProfile"

/**
 * Autonomous user profile component that handles authentication state
 */
export const AutonomousUserProfile = () => {
	const app = useApp()
	const navigate = useNavigate()
	const authState = useAtomValue(app.backendService.authState)

	const handleLogout = useCallback(() => {
		app.logger.info(LOG_TAG, "User logging out")

		app.atomStore.set(app.backendService.logout)

		app.logger.info(LOG_TAG, "User logged out, redirecting to home")
		navigate(Routes.home.navigate())
	}, [app, navigate])

	if (!authState.isAuthenticated || !authState.user) {
		return <LoginRequired />
	}

	return <UserProfile user={authState.user} onLogout={handleLogout} />
}
