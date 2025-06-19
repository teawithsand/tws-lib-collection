import { atom, useAtomValue } from "@teawithsand/fstate"
import { TypeAssert } from "@teawithsand/lngext"
import { useParams } from "react-router"
import { useApp } from "../../app"
import { PageSuspense } from "../../components/boundary"
import { CollectionCardsList } from "../../components/card/list"
import { CollectionNotFound } from "../../components/collection"
import { LocalLayout } from "../../components/layout"
import { CollectionService } from "../../domain/collectionsService"

/**
 * Page component for displaying cards within a specific collection
 * Shows collection info and a list of cards with actions
 */
export const CollectionCardsPage = () => {
	const { id } = useParams<{ id: string }>()
	const app = useApp()

	if (!id) {
		return <CollectionNotFound />
	}

	const collectionService = app.collectionService.getCollection(id)
	const collectionCards = app.collectionService.getCollectionCards(id)

	return (
		<LocalLayout>
			<PageSuspense>
				<CollectionCardsContent
					collectionServiceAtom={collectionService}
					cardsAtom={collectionCards.data}
					collectionId={id}
				/>
			</PageSuspense>
		</LocalLayout>
	)
}

interface CollectionCardsContentProps {
	readonly collectionServiceAtom: ReturnType<
		CollectionService["getCollection"]
	>
	readonly cardsAtom: ReturnType<
		CollectionService["getCollectionCards"]
	>["data"]
	readonly collectionId: string
}

const CollectionCardsContent = ({
	collectionServiceAtom: collectionService,
	cardsAtom,
	collectionId,
}: CollectionCardsContentProps) => {
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
		<CollectionCardsList
			collectionAtom={collectionAtom}
			cardsAtom={cardsAtom}
			collectionId={collectionId}
		/>
	)
}
