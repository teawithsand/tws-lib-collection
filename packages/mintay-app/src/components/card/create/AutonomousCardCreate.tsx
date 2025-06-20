import { useApp } from "@/app"
import { CardFormData, CardFormUtils } from "@/components/form/card"
import { AppCardData } from "@/mintay/card/card"
import { Routes } from "@/router/routes"
import { useCallback } from "react"
import { useNavigate } from "react-router"
import { CardCreate } from "./CardCreate"

interface AutonomousCardCreateProps {
	readonly collectionId: string
	readonly onPostSubmitSuccess?: () => void
}

export const AutonomousCardCreate = ({
	collectionId,
	onPostSubmitSuccess,
}: AutonomousCardCreateProps) => {
	const app = useApp()
	const navigate = useNavigate()

	const handleSubmit = useCallback(
		async (formData: CardFormData) => {
			const collection =
				app.collectionService.collectionStore.get(collectionId)

			const cardHandle = await collection.createCard()

			const now = Date.now()
			const cardData: AppCardData = CardFormUtils.formDataToAppCardData(
				formData,
				{
					createdAt: now,
					updatedAt: now,
				},
			)

			await cardHandle.save(cardData)

			if (onPostSubmitSuccess) {
				onPostSubmitSuccess()
			} else {
				navigate(Routes.collectionDetail.navigate(collectionId))
			}
		},
		[
			app.collectionService.collectionStore,
			collectionId,
			navigate,
			onPostSubmitSuccess,
		],
	)

	return <CardCreate onSubmit={handleSubmit} />
}
