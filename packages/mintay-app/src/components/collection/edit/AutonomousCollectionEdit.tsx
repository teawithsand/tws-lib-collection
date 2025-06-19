import { useApp } from "@/app"
import { CollectionFormData } from "@/components/form"
import { AppCollectionData, WithMintayId } from "@/mintay"
import { Routes } from "@/router/routes"
import { Atom, useAtomValue, useSetAtom } from "@teawithsand/fstate"
import { useCallback } from "react"
import { useNavigate } from "react-router"
import { CollectionEdit } from "./CollectionEdit"

interface AutonomousCollectionEditProps {
	readonly collectionDataWithIdAtom: Atom<
		Promise<WithMintayId<AppCollectionData | null>>
	>
}

export const AutonomousCollectionEdit = ({
	collectionDataWithIdAtom,
}: AutonomousCollectionEditProps) => {
	const app = useApp()
	const navigate = useNavigate()

	const collectionDataWithId = useAtomValue(collectionDataWithIdAtom)
	const { id: collectionId, data: collectionData } = collectionDataWithId

	const refresh = useSetAtom(app.collectionService.refreshCollectionsList)

	const handleSubmit = useCallback(
		async (data: CollectionFormData) => {
			if (!collectionData) return

			const updatedData: AppCollectionData = {
				...collectionData,
				title: data.title,
				description: data.description,
				updatedAt: Date.now(),
			}

			const collection =
				app.collectionService.collectionStore.get(collectionId)
			await collection.save(updatedData)

			refresh()

			navigate(Routes.collections.navigate())
		},
		[app, collectionId, navigate, refresh, collectionData],
	)

	if (!collectionData) {
		return <div>Collection not found</div>
	}

	const initialData: CollectionFormData = {
		title: collectionData.title,
		description: collectionData.description,
	}

	return <CollectionEdit initialData={initialData} onSubmit={handleSubmit} />
}
