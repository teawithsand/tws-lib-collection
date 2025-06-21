import { useDisclosure } from "@mantine/hooks"
import { MintayId } from "@teawithsand/mintay-core"
import { useCallback, useState } from "react"

/**
 * Hook for managing collection upload modal state
 */
export const useCollectionUploadModal = () => {
	const [opened, { open, close }] = useDisclosure(false)
	const [collectionId, setCollectionId] = useState<MintayId | null>(null)
	const [collectionTitle, setCollectionTitle] = useState<string | undefined>(
		undefined,
	)

	const openModal = useCallback(
		(id: MintayId, title?: string) => {
			setCollectionId(id)
			setCollectionTitle(title)
			open()
		},
		[open],
	)

	const closeModal = useCallback(() => {
		close()
		// Clear state after modal closes to prevent flash of old data
		setTimeout(() => {
			setCollectionId(null)
			setCollectionTitle(undefined)
		}, 200)
	}, [close])

	return {
		opened,
		collectionId,
		collectionTitle,
		openModal,
		closeModal,
	}
}
