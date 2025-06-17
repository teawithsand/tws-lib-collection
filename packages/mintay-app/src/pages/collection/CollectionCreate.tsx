import { AutonomousCollectionCreate } from "@/components/collection/create/AutonomousCollectionCreate"
import { AppBoundary } from "../../app"
import { LocalLayout } from "../../components/layout"

/**
 * Page for creating new collections
 */
export const CollectionCreatePage = () => {
	return (
		<LocalLayout>
			<AppBoundary>
				<AutonomousCollectionCreate />
			</AppBoundary>
		</LocalLayout>
	)
}
