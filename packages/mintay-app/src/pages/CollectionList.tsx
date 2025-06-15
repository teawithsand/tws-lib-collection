import { AppBoundary } from "../app"
import { CollectionList } from "../components/collection/list/collectionList"
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
