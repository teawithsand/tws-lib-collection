import { useApp } from "@/app"
import { CollectionFormData } from "@/components/form"
import { AppCollectionData } from "@/mintay"
import { Routes } from "@/router/routes"
import { useSetAtom } from "@teawithsand/fstate"
import { generateUuid } from "@teawithsand/lngext"
import { useCallback } from "react"
import { useNavigate } from "react-router"
import { CollectionCreate } from "./CollectionCreate"

export const AutonomousCollectionCreate = () => {
	const app = useApp()
	const navigate = useNavigate()

	const refresh = useSetAtom(app.collectionService.refreshCollectionsList)

	const handleSubmit = useCallback(
		async (data: CollectionFormData) => {
			const collection =
				await app.collectionService.collectionStore.create()

			const now = Date.now()
			const collectionData: AppCollectionData = {
				globalId: generateUuid(),
				title: data.title,
				description: data.description,
				createdAt: now,
				updatedAt: now,
			}

			await collection.save(collectionData)

			refresh()

			navigate(Routes.collections.navigate())
		},
		[app, navigate, refresh],
	)

	console.log({ handleSubmit })

	return <CollectionCreate onSubmit={handleSubmit} />
}
