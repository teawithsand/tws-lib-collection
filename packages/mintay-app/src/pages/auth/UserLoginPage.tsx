import { AutonomousUserLogin } from "@/components/user/login"
import { AppBoundary } from "../../app"
import { LocalLayout } from "../../components/layout"

/**
 * Page for user login
 */
export const UserLoginPage = () => {
	return (
		<LocalLayout>
			<AppBoundary>
				<AutonomousUserLogin />
			</AppBoundary>
		</LocalLayout>
	)
}
