import { AppBoundary } from "../app"
import { AutonomousCollectionEdit } from "../components/collection/edit"
import { LocalLayout } from "../components/layout"

export const CollectionEditPage = () => {
	return (
		<LocalLayout>
			<AppBoundary>
				<AutonomousCollectionEdit />
			</AppBoundary>
		</LocalLayout>
	)
}
