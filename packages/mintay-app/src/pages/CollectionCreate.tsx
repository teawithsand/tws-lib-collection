import { AppBoundary } from "../app"
import { CollectionCreate } from "../components/collection"
import { LocalLayout } from "../components/layout"

/**
 * Page for creating new collections
 */
export const CollectionCreatePage = () => {
	return (
		<LocalLayout>
			<AppBoundary>
				<CollectionCreate />
			</AppBoundary>
		</LocalLayout>
	)
}
