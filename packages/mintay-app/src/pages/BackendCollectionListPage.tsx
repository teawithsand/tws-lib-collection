import { PageSuspense } from "@/components/boundary"
import { LocalLayout } from "@/components/layout"
import {
	AppBarMutators,
	AppBarPredefinedMutatorPriorities,
	useAppBarMutator,
} from "@/domain/appBar"
import { BackendCollectionList } from "../components/backend/collection"

/**
 * Page for displaying a list of backend collections
 */
export const BackendCollectionListPage = () => {
	useAppBarMutator(
		AppBarMutators.ARROW_BACK_MUTATOR,
		AppBarPredefinedMutatorPriorities.PAGE,
	)

	return (
		<LocalLayout>
			<PageSuspense>
				<BackendCollectionListContent />
			</PageSuspense>
		</LocalLayout>
	)
}

const BackendCollectionListContent = () => {
	return <BackendCollectionList />
}
