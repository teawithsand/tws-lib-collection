import { Abook, AbookEntry, WithId } from "@teawithsand/booklibr"
import { Atom, useAtomValue } from "@teawithsand/fstate"
import { AutonomousAbookEntryDeleteModal } from "../delete/AutonomousAbookEntryDeleteModal"
import { useAbookEntryDeleteModal } from "../delete/useAbookEntryDeleteModal"
import { AbookEntryShowModal } from "./AbookEntryShowModal"

export interface AutonomousAbookEntryShowModalProps {
	readonly opened: boolean
	readonly onClose: () => void
	readonly abookDataWithIdAtom: Atom<Promise<WithId<Abook | null>>>
	readonly entryDataWithIdAtom: Atom<Promise<WithId<AbookEntry | null>>>

	/**
	 * Called when entry is modified in some way. Also when it's deleted.
	 *
	 * It warrants refresh of entries list.
	 */
	readonly onEntryModified?: () => void
}

/**
 * Autonomous version of AbookEntryShowModal that integrates with Suspense.
 * Expects a parent Suspense boundary to handle loading states.
 * Reads both abook and entry data from atoms to display entry information.
 * Integrates delete modal functionality with proper state management.
 */
export const AutonomousAbookEntryShowModal = ({
	opened,
	onClose,
	abookDataWithIdAtom,
	entryDataWithIdAtom,
	onEntryModified,
}: AutonomousAbookEntryShowModalProps) => {
	const abookWithId = useAtomValue(abookDataWithIdAtom)
	const entryWithId = useAtomValue(entryDataWithIdAtom)
	const deleteModal = useAbookEntryDeleteModal()

	const handleDeleteClick = () => {
		deleteModal.openModal(abookWithId.id, entryWithId.id)
	}

	const handleDeleted = () => {
		deleteModal.closeModal()
		onClose()
		if (onEntryModified) {
			onEntryModified()
		}
	}

	return (
		<>
			<AbookEntryShowModal
				opened={opened}
				onClose={onClose}
				abook={abookWithId}
				entry={entryWithId}
				onDeleteClick={handleDeleteClick}
			/>
			<AutonomousAbookEntryDeleteModal
				opened={deleteModal.opened}
				onClose={deleteModal.closeModal}
				abookDataWithIdAtom={abookDataWithIdAtom}
				entryDataWithIdAtom={entryDataWithIdAtom}
				onDeleted={handleDeleted}
			/>
		</>
	)
}
