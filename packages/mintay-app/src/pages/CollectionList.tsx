import { AppBoundary } from "../app"
import { CollectionList } from "../components/collection/list"
import { LocalLayout } from "../components/layout"

export const CollectionListPage = () => {
	return (
		<LocalLayout>
			<AppBoundary>
				<CollectionList />
			</AppBoundary>
		</LocalLayout>
	)
}
