import { useApp } from "@/app"
import { PageSuspense } from "@/components/boundary"
import { CollectionDetail, CollectionNotFound } from "@/components/collection"
import { LocalLayout } from "@/components/layout"
import {
	AppBarMutators,
	AppBarPredefinedMutatorPriorities,
	useAppBarMutator,
} from "@/domain/appBar"
import { CollectionService } from "@/domain/collectionsService"
import { AppCollectionData, WithMintayId } from "@/mintay"
import { atom, useAtomValue } from "@teawithsand/fstate"
import { useParams } from "react-router"

export const CollectionDetailPage = () => {
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
				<CollectionDetailContent
					collectionServiceAtom={collectionService}
				/>
			</PageSuspense>
		</LocalLayout>
	)
}

interface CollectionDetailContentProps {
	readonly collectionServiceAtom: ReturnType<
		CollectionService["getCollection"]
	>
}

const CollectionDetailContent = ({
	collectionServiceAtom: collectionService,
}: CollectionDetailContentProps) => {
	const collectionData = useAtomValue(collectionService.dataWithId)

	if (collectionData.data === null) {
		return <CollectionNotFound />
	}

	const collectionAtom = atom(() =>
		Promise.resolve({
			id: collectionData.id,
			data: collectionData.data,
		} as WithMintayId<AppCollectionData>),
	)

	return <CollectionDetail collectionAtom={collectionAtom} />
}
