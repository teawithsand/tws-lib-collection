import { useApp } from "@/app"
import { CardFormData, CardFormUtils } from "@/components/form/card"
import { WithMintayId } from "@/mintay"
import { AppCardData } from "@/mintay/card/card"
import { Routes } from "@/router/routes"
import { Atom, useAtomValue } from "@teawithsand/fstate"
import { useCallback } from "react"
import { useNavigate } from "react-router"
import { CardEdit } from "./CardEdit"

interface AutonomousCardEditProps {
	readonly cardAtom: Atom<Promise<WithMintayId<AppCardData>>>
}

export const AutonomousCardEdit = ({ cardAtom }: AutonomousCardEditProps) => {
	const app = useApp()
	const navigate = useNavigate()
	const cardData = useAtomValue(cardAtom)

	const handleSubmit = useCallback(
		async (formData: CardFormData) => {
			if (!cardData) return

			const cardHandle = app.cardService.getCard(cardData.id)

			const updatedCardData: AppCardData =
				CardFormUtils.formDataToAppCardData(formData, {
					createdAt: cardData.data.createdAt,
					updatedAt: Date.now(),
				})

			await app.atomStore.set(cardHandle.update, updatedCardData)

			navigate(Routes.collections.navigate())
		},
		[app.atomStore, app.cardService, cardData, navigate],
	)

	const initialFormData = CardFormUtils.appCardDataToFormData(cardData.data)

	return <CardEdit initialData={initialFormData} onSubmit={handleSubmit} />
}
