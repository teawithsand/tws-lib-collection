import { BackendCollectionData } from "@/domain/backend/backendCollectionData"
import { useDisclosure } from "@mantine/hooks"
import { useCallback, useState } from "react"

/**
 * Hook for managing collection download modal state
 */
export const useCollectionDownloadModal = () => {
	const [opened, { open, close }] = useDisclosure(false)
	const [backendCollectionData, setBackendCollectionData] =
		useState<BackendCollectionData | null>(null)

	const openModal = useCallback(
		(data: BackendCollectionData) => {
			setBackendCollectionData(data)
			open()
		},
		[open],
	)

	const closeModal = useCallback(() => {
		close()
		// Clear state after modal closes to prevent flash of old data
		setTimeout(() => {
			setBackendCollectionData(null)
		}, 200)
	}, [close])

	return {
		opened,
		backendCollectionData,
		openModal,
		closeModal,
	}
}
