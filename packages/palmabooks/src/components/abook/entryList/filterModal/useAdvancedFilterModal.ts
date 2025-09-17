import { useDisclosure } from "@teawithsand/mlui"
import { useCallback } from "react"

/**
 * Hook for managing advanced filter modal state
 */
export const useAdvancedFilterModal = () => {
	const [opened, { open, close }] = useDisclosure(false)

	const openModal = useCallback(() => {
		open()
	}, [open])

	const closeModal = useCallback(() => {
		close()
	}, [close])

	return {
		opened,
		openModal,
		closeModal,
	}
}
