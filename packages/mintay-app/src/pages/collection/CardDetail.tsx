import { useApp } from "@/app"
import { PageSuspense } from "@/components/boundary"
import { CardDetail, CardNotFound } from "@/components/card"
import { CollectionNotFound } from "@/components/collection"
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

export const CardDetailPage = () => {
	const { id, cardId } = useParams<{ id: string; cardId: string }>()
	const app = useApp()

	useAppBarMutator(
		AppBarMutators.ARROW_BACK_MUTATOR,
		AppBarPredefinedMutatorPriorities.PAGE,
	)

	if (!id || !cardId) {
		return <CollectionNotFound />
	}

	const collectionService = app.collectionService.getCollection(id)
	const cardServiceAtom = app.collectionService.getCollectionCard(id, cardId)

	return (
		<LocalLayout>
			<PageSuspense>
				<CardDetailContent
					collectionServiceAtom={collectionService}
					cardServiceAtom={cardServiceAtom}
					collectionId={id}
				/>
			</PageSuspense>
		</LocalLayout>
	)
}

interface CardDetailContentProps {
	readonly collectionServiceAtom: ReturnType<
		CollectionService["getCollection"]
	>
	readonly cardServiceAtom: ReturnType<CollectionService["getCollectionCard"]>
	readonly collectionId: string
}

const CardDetailContent = ({
	collectionServiceAtom: collectionService,
	cardServiceAtom,
	collectionId,
}: CardDetailContentProps) => {
	const collectionData = useAtomValue(collectionService.dataWithId)
	const cardData = useAtomValue(cardServiceAtom.dataWithId)

	if (collectionData.data === null) {
		return <CollectionNotFound />
	}

	if (cardData.data === null) {
		return <CardNotFound collectionId={collectionId} />
	}

	const cardAtom = atom(() =>
		Promise.resolve({
			id: cardData.id,
			data: cardData.data ?? TypeAssert.unreachable(),
		}),
	)

	return <CardDetail cardAtom={cardAtom} collectionId={collectionId} />
}
