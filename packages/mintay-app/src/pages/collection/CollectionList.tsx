import { AutonomousCollectionList } from "@/components/collection"
import { AppBoundary } from "../../app"
import { LocalLayout } from "../../components/layout"

export const CollectionListPage = () => {
	return (
		<LocalLayout>
			<AppBoundary>
				<AutonomousCollectionList />
			</AppBoundary>
		</LocalLayout>
	)
}
