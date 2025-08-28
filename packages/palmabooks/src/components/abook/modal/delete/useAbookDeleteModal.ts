import { useDisclosure } from "@teawithsand/mlui"
import { useCallback, useState } from "react"

/**
 * Hook for managing audiobook delete modal state
 */
export const useAbookDeleteModal = () => {
	const [opened, { open, close }] = useDisclosure(false)
	const [abookId, setAbookId] = useState<string | null>(null)
	const [abookTitle, setAbookTitle] = useState<string | null>(null)

	const openModal = useCallback(
		(id: string, title?: string) => {
			setAbookId(id)
			setAbookTitle(title || null)
			open()
		},
		[open],
	)

	const closeModal = useCallback(() => {
		close()
		// Clear state after modal closes to prevent flash of old data
		setTimeout(() => {
			setAbookId(null)
			setAbookTitle(null)
		}, 200)
	}, [close])

	return {
		opened,
		abookId,
		abookTitle,
		openModal,
		closeModal,
	}
}
