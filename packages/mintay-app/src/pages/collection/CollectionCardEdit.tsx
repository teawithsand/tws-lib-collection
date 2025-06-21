import { useApp } from "@/app"
import { PageSuspense } from "@/components/boundary"
import { CardNotFound } from "@/components/card"
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
import { useCallback } from "react"
import { useNavigate, useParams } from "react-router"
import { AutonomousCardEdit } from "../../components/card/edit"

/**
 * Page component for editing a card within a specific collection
 */
export const CollectionCardEditPage = () => {
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
	const cardService = app.collectionService.getCollectionCard(id, cardId)
	return (
		<LocalLayout>
			<PageSuspense>
				<CollectionCardEditContent
					collectionServiceAtom={collectionService}
					cardServiceAtom={cardService}
					collectionId={id}
					cardId={cardId}
				/>
			</PageSuspense>
		</LocalLayout>
	)
}

interface CollectionCardEditContentProps {
	readonly collectionServiceAtom: ReturnType<
		CollectionService["getCollection"]
	>
	readonly cardServiceAtom: ReturnType<CollectionService["getCollectionCard"]>
	readonly collectionId: string
	readonly cardId: string
}

const CollectionCardEditContent = ({
	collectionServiceAtom: collectionService,
	cardServiceAtom: cardService,
	collectionId,
}: CollectionCardEditContentProps) => {
	const collectionData = useAtomValue(collectionService.dataWithId)
	const cardData = useAtomValue(cardService.dataWithId)
	const navigate = useNavigate()

	const handlePostSubmit = useCallback(() => {
		navigate(-1) // Navigate to previous page
	}, [navigate])

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

	return (
		<AutonomousCardEdit
			collectionId={collectionId}
			cardAtom={cardAtom}
			onPostSubmitSuccess={handlePostSubmit}
		/>
	)
}
