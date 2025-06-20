import { AutonomousUserProfile } from "@/components/backend/user"
import { AppBoundary } from "../../app"
import { LocalLayout } from "../../components/layout"

/**
 * Page for displaying user profile information
 */
export const UserProfilePage = () => {
	return (
		<LocalLayout>
			<AppBoundary>
				<AutonomousUserProfile />
			</AppBoundary>
		</LocalLayout>
	)
}
