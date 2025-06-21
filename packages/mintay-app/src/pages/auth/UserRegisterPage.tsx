import { AutonomousUserRegister } from "@/components/user/register"
import { AppBoundary } from "../../app"
import { LocalLayout } from "../../components/layout"

/**
 * Page for user registration
 */
export const UserRegisterPage = () => {
	return (
		<LocalLayout>
			<AppBoundary>
				<AutonomousUserRegister />
			</AppBoundary>
		</LocalLayout>
	)
}
