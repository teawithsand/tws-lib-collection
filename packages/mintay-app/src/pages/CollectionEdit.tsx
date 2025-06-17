import { useParams } from "react-router"
import { AppBoundary, useApp } from "../app"
import { AutonomousCollectionEdit } from "../components/collection/edit"
import { LocalLayout } from "../components/layout"
import { useStableMemo } from "../util/useStableMemo"

export const CollectionEditPage = () => {
	const app = useApp()
	const { id } = useParams<{ id: string }>()
	const collectionId = id ?? ""

	const collectionAtoms = useStableMemo(
		() => app.collectionService.getCollection(collectionId),
		[app.collectionService, collectionId],
	)

	return (
		<LocalLayout>
			<AppBoundary>
				<AutonomousCollectionEdit
					collectionDataWithIdAtom={collectionAtoms.dataWithId}
				/>
			</AppBoundary>
		</LocalLayout>
	)
}
