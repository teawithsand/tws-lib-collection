import { useApp } from "@/app"
import { CardFormData, CardFormUtils } from "@/components/form/card"
import { WithMintayId } from "@/mintay"
import { AppCardData } from "@/mintay/card/card"
import { Atom, useAtomValue } from "@teawithsand/fstate"
import { useCallback } from "react"
import { CardEdit } from "./CardEdit"

interface AutonomousCardEditProps {
	readonly cardAtom: Atom<Promise<WithMintayId<AppCardData>>>
	readonly collectionId: string
	readonly onPostSubmitSuccess?: () => void
}

export const AutonomousCardEdit = ({
	cardAtom,
	collectionId,
	onPostSubmitSuccess,
}: AutonomousCardEditProps) => {
	const app = useApp()
	const cardData = useAtomValue(cardAtom)

	const handleSubmit = useCallback(
		async (formData: CardFormData) => {
			const updatedCardData: AppCardData =
				CardFormUtils.formDataToAppCardData(formData, {
					createdAt: cardData.data.createdAt,
					updatedAt: Date.now(),
				})

			// Update the data in the backend
			const collection =
				app.collectionService.collectionStore.get(collectionId)
			const cardHandle = await collection.getCard(cardData.id)
			await cardHandle.save(updatedCardData)

			if (onPostSubmitSuccess) {
				onPostSubmitSuccess()
			}
		},
		[
			app,
			cardData.data.createdAt,
			cardData.id,
			collectionId,
			onPostSubmitSuccess,
		],
	)

	const initialFormData = CardFormUtils.appCardDataToFormData(cardData.data)

	return <CardEdit initialData={initialFormData} onSubmit={handleSubmit} />
}
