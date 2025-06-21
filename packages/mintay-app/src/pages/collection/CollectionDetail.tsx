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
import { atom, useAtomValue } from "@teawithsand/fstate"
import { TypeAssert } from "@teawithsand/lngext"
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
	const cardsAtom = app.collectionService.getCollectionCards(id).data
	return (
		<LocalLayout>
			<PageSuspense>
				<CollectionDetailContent
					collectionServiceAtom={collectionService}
					cardsAtom={cardsAtom}
				/>
			</PageSuspense>
		</LocalLayout>
	)
}

interface CollectionDetailContentProps {
	readonly collectionServiceAtom: ReturnType<
		CollectionService["getCollection"]
	>
	readonly cardsAtom: ReturnType<
		CollectionService["getCollectionCards"]
	>["data"]
}

const CollectionDetailContent = ({
	collectionServiceAtom: collectionService,
	cardsAtom,
}: CollectionDetailContentProps) => {
	const collectionData = useAtomValue(collectionService.dataWithId)

	if (collectionData.data === null) {
		return <CollectionNotFound />
	}

	const collectionAtom = atom(() =>
		Promise.resolve({
			id: collectionData.id,
			data: collectionData.data ?? TypeAssert.unreachable(),
		}),
	)

	return (
		<CollectionDetail
			collectionAtom={collectionAtom}
			cardCountAtom={collectionService.cardCount}
			cardsAtom={cardsAtom}
		/>
	)
}
