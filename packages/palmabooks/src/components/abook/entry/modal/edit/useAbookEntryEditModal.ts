import { useDisclosure } from "@teawithsand/mlui"
import { useCallback, useState } from "react"

/**
 * Hook for managing audiobook entry edit modal state
 */
export const useAbookEntryEditModal = () => {
	const [opened, { open, close }] = useDisclosure(false)
	const [entryId, setEntryId] = useState<string | null>(null)

	const openModal = useCallback(
		(id: string) => {
			setEntryId(id)
			open()
		},
		[open],
	)

	const closeModal = useCallback(() => {
		close()
	}, [close])

	return {
		opened,
		entryId,
		openModal,
		closeModal,
	}
}
