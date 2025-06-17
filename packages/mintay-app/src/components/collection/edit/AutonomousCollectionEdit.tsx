import { useApp } from "@/app"
import { CollectionFormData } from "@/components/form"
import { Routes } from "@/router/routes"
import { useStableMemo } from "@/util/useStableMemo"
import { useAtomValue, useSetAtom } from "@teawithsand/fstate"
import { MintayCollectionData } from "@teawithsand/mintay-core"
import { useCallback } from "react"
import { useNavigate, useParams } from "react-router"
import { CollectionEdit } from "./CollectionEdit"

export const AutonomousCollectionEdit = () => {
	const app = useApp()
	const navigate = useNavigate()
	const { id } = useParams<{ id: string }>()
	const collectionId = id ?? ""

	const refresh = useSetAtom(app.collectionService.refreshCollectionsList)

	const collectionAtoms = useStableMemo(
		() => app.collectionService.getCollection(collectionId),
		[app.collectionService, collectionId],
	)
	const collectionDataLoadable = useAtomValue(collectionAtoms.dataLoadable)

	const handleSubmit = useCallback(
		async (data: CollectionFormData) => {
			const currentData = await app.collectionService.collectionStore
				.get(collectionId)
				.mustRead()

			const updatedData: MintayCollectionData = {
				...currentData,
				title: data.title,
				description: data.description,
				lastUpdatedAtTimestamp: Date.now(),
			}

			const collection =
				app.collectionService.collectionStore.get(collectionId)
			await collection.save(updatedData)

			refresh()

			navigate(Routes.collections.navigate())
		},
		[app, collectionId, navigate, refresh],
	)

	if (collectionDataLoadable.state === "loading") {
		return <div>Loading collection...</div>
	}

	if (collectionDataLoadable.state === "hasError") {
		return <div>Error loading collection</div>
	}

	if (
		collectionDataLoadable.state === "hasData" &&
		collectionDataLoadable.data
	) {
		const initialData: CollectionFormData = {
			title: collectionDataLoadable.data.title,
			description: collectionDataLoadable.data.description,
		}

		return (
			<CollectionEdit initialData={initialData} onSubmit={handleSubmit} />
		)
	}

	return <div>Collection not found</div>
}
