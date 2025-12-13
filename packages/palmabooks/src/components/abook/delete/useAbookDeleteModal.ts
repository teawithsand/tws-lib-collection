import { Id } from "@teawithsand/booklibr"
import { useCallback, useState } from "react"

export interface UseAbookDeleteModalState {
	readonly opened: boolean
	readonly abookId: Id | null
	readonly openModal: (abookId: Id) => void
	readonly closeModal: () => void
}

/**
 * Hook for managing abook delete modal state.
 * Provides methods to open/close the modal and track the selected abook ID.
 */
export const useAbookDeleteModal = (): UseAbookDeleteModalState => {
	const [opened, setOpened] = useState(false)
	const [abookId, setAbookId] = useState<Id | null>(null)

	const openModal = useCallback((id: Id) => {
		setAbookId(id)
		setOpened(true)
	}, [])

	const closeModal = useCallback(() => {
		setOpened(false)
		setTimeout(() => {
			setAbookId(null)
		}, 200)
	}, [])

	return {
		opened,
		abookId,
		openModal,
		closeModal,
	}
}
