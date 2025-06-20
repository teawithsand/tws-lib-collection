import { PageSuspense } from "@/components/boundary"
import { CollectionNotFound } from "@/components/collection"
import { LocalLayout } from "@/components/layout"
import {
	AppBarMutators,
	AppBarPredefinedMutatorPriorities,
	useAppBarMutator,
} from "@/domain/appBar"
import { useParams } from "react-router"
import { AutonomousCollectionLearn } from "../../components/collection/learn"

/**
 * Page component for learning cards in a specific collection using spaced repetition
 */
export const CollectionLearnPage = () => {
	const { id } = useParams<{ id: string }>()

	useAppBarMutator(
		AppBarMutators.ARROW_BACK_MUTATOR,
		AppBarPredefinedMutatorPriorities.PAGE,
	)

	if (!id) {
		return <CollectionNotFound />
	}

	return (
		<LocalLayout>
			<PageSuspense>
				<AutonomousCollectionLearn collectionId={id} />
			</PageSuspense>
		</LocalLayout>
	)
}
