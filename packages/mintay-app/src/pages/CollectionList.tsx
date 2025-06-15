import { AppBoundary } from "../app"
import { CollectionList } from "../components/collection/list/collectionList"

export const CollectionListPage = () => {
	return (
		<AppBoundary>
			<CollectionList />
		</AppBoundary>
	)
}
