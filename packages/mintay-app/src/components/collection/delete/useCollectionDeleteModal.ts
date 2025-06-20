import { AppCollectionData, WithMintayId } from "@/mintay"
import { useCallback, useState } from "react"

interface UseCollectionDeleteModalState {
	readonly opened: boolean
	readonly collection: WithMintayId<AppCollectionData> | null
	readonly openModal: (collection: WithMintayId<AppCollectionData>) => void
	readonly closeModal: () => void
}

/**
 * Hook for managing collection delete modal state.
 * Provides methods to open/close the modal and track the selected collection.
 */
export const useCollectionDeleteModal = (): UseCollectionDeleteModalState => {
	const [opened, setOpened] = useState(false)
	const [collection, setCollection] =
		useState<WithMintayId<AppCollectionData> | null>(null)

	const openModal = useCallback(
		(collectionData: WithMintayId<AppCollectionData>) => {
			setCollection(collectionData)
			setOpened(true)
		},
		[],
	)

	const closeModal = useCallback(() => {
		setOpened(false)
		// Don't clear collection immediately to allow for smooth closing animation
		setTimeout(() => {
			setCollection(null)
		}, 200)
	}, [])

	return {
		opened,
		collection,
		openModal,
		closeModal,
	}
}
