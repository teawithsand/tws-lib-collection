import { PageSuspense } from "@/components/boundary"
import { LocalLayout } from "@/components/layout"
import {
	AppBarMutators,
	AppBarPredefinedMutatorPriorities,
	useAppBarMutator,
} from "@/domain/appBar"
import { useParams } from "react-router"
import { BackendCollectionDetail } from "../components/backend/collection"

/**
 * Page for displaying details of a backend collection
 */
export const BackendCollectionDetailPage = () => {
	const { id } = useParams<{ id: string }>()

	useAppBarMutator(
		AppBarMutators.ARROW_BACK_MUTATOR,
		AppBarPredefinedMutatorPriorities.PAGE,
	)

	return (
		<LocalLayout>
			<PageSuspense>
				<BackendCollectionDetailContent collectionId={id} />
			</PageSuspense>
		</LocalLayout>
	)
}

interface BackendCollectionDetailContentProps {
	readonly collectionId: string | undefined
}

const BackendCollectionDetailContent = ({
	collectionId,
}: BackendCollectionDetailContentProps) => {
	if (!collectionId) {
		return <BackendCollectionDetail />
	}

	return <BackendCollectionDetail />
}
