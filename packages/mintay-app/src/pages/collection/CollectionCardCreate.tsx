import { useApp } from "@/app"
import { PageSuspense } from "@/components/boundary"
import { CollectionNotFound } from "@/components/collection"
import { LocalLayout } from "@/components/layout"
import {
	AppBarMutators,
	AppBarPredefinedMutatorPriorities,
	useAppBarMutator,
} from "@/domain/appBar"
import { CollectionService } from "@/domain/collectionsService"
import { useAtomValue } from "@teawithsand/fstate"
import { useParams } from "react-router"
import { AutonomousCardCreate } from "../../components/card/create"

/**
 * Page component for creating a new card within a specific collection
 */
export const CollectionCardCreatePage = () => {
	const { id } = useParams<{ id: string }>()
	const app = useApp()

	useAppBarMutator(
		AppBarMutators.ARROW_BACK_MUTATOR,
		AppBarPredefinedMutatorPriorities.PAGE,
	)

	if (!id) {
		return <CollectionNotFound />
	}

	const collectionService = app.collectionService.getCollection(id)
	return (
		<LocalLayout>
			<PageSuspense>
				<CollectionCardCreateContent
					collectionServiceAtom={collectionService}
					collectionId={id}
				/>
			</PageSuspense>
		</LocalLayout>
	)
}

interface CollectionCardCreateContentProps {
	readonly collectionServiceAtom: ReturnType<
		CollectionService["getCollection"]
	>
	readonly collectionId: string
}

const CollectionCardCreateContent = ({
	collectionServiceAtom: collectionService,
	collectionId,
}: CollectionCardCreateContentProps) => {
	const collectionData = useAtomValue(collectionService.dataWithId)

	if (collectionData.data === null) {
		return <CollectionNotFound />
	}

	return <AutonomousCardCreate collectionId={collectionId} />
}
