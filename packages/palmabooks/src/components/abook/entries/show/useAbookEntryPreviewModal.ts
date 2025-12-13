import { AbookEntry, WithId } from "@teawithsand/booklibr"
import { useCallback, useState } from "react"

export interface UseAbookEntryPreviewModalState {
	readonly opened: boolean
	readonly entry: WithId<AbookEntry> | null
	readonly openModal: (entry: WithId<AbookEntry>) => void
	readonly closeModal: () => void
}

/**
 * Hook for managing abook entry preview modal state.
 * Provides methods to open/close the modal and track the selected entry.
 */
export const useAbookEntryPreviewModal = (): UseAbookEntryPreviewModalState => {
	const [opened, setOpened] = useState(false)
	const [entry, setEntry] = useState<WithId<AbookEntry> | null>(null)

	const openModal = useCallback((e: WithId<AbookEntry>) => {
		setEntry(e)
		setOpened(true)
	}, [])

	const closeModal = useCallback(() => {
		setOpened(false)
		setTimeout(() => {
			setEntry(null)
		}, 200)
	}, [])

	return {
		opened,
		entry,
		openModal,
		closeModal,
	}
}
