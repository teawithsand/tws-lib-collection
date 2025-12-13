import { useDisclosure } from "@teawithsand/mlui"
import { useCallback } from "react"

/**
 * Hook for managing abook entry sort modal state
 */
export const useAbookEntrySortModal = () => {
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
