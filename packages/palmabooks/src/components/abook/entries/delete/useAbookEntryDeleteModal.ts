import { Id } from "@teawithsand/booklibr"
import { useCallback, useState } from "react"

export interface UseAbookEntryDeleteModalState {
	readonly opened: boolean
	readonly abookId: Id | null
	readonly entryId: Id | null
	readonly openModal: (abookId: Id, entryId: Id) => void
	readonly closeModal: () => void
}

/**
 * Hook for managing the state of the abook entry delete modal.
 */
export const useAbookEntryDeleteModal = (): UseAbookEntryDeleteModalState => {
	const [opened, setOpened] = useState(false)
	const [abookId, setAbookId] = useState<Id | null>(null)
	const [entryId, setEntryId] = useState<Id | null>(null)

	const openModal = useCallback((newAbookId: Id, newEntryId: Id) => {
		setAbookId(newAbookId)
		setEntryId(newEntryId)
		setOpened(true)
	}, [])

	const closeModal = useCallback(() => {
		setOpened(false)
		setAbookId(null)
		setEntryId(null)
	}, [])

	return {
		opened,
		abookId,
		entryId,
		openModal,
		closeModal,
	}
}
