import { useApp } from "@/app"
import { CardFormData, CardFormUtils } from "@/components/form/card"
import { AppCardData } from "@/mintay/card/card"
import { Routes } from "@/router/routes"
import { generateUuid } from "@teawithsand/lngext"
import { useCallback } from "react"
import { useNavigate } from "react-router"
import { CardCreate } from "./CardCreate"

interface AutonomousCardCreateProps {
	readonly collectionId: string
}

export const AutonomousCardCreate = ({
	collectionId,
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

			if (!cardData.globalId.trim()) {
				cardData.globalId = generateUuid()
			}

			await cardHandle.save(cardData)

			navigate(Routes.collections.navigate())
		},
		[app.collectionService.collectionStore, collectionId, navigate],
	)

	return <CardCreate onSubmit={handleSubmit} />
}
