import { Abook, AbookEntry, WithId } from "@teawithsand/booklibr"
import { Atom } from "@teawithsand/fstate"
import {
	AutonomousAbookEntryShowModal,
	useAbookEntryPreviewModal,
} from "../show"
import { AbookEntryList } from "./AbookEntryList"
import { AbookEntrySelectionShortcuts } from "./AbookEntrySelectionShortcuts"

export interface AutonomousAbookEntryListProps {
	readonly entriesAtom: Atom<Promise<WithId<AbookEntry>[]>>
	readonly abookAtom: Atom<Promise<WithId<Abook | null>>>
	onRefresh: () => void
	readonly onDeleteSelectedEntries?: (
		entries: WithId<AbookEntry>[],
	) => void | Promise<void>
}

/**
 * Autonomous version of AbookEntryList that integrates with Suspense.
 * Expects a parent Suspense boundary to handle loading states.
 * Search state is managed internally by AbookEntryList component.
 */
export const AutonomousAbookEntryList = ({
	entriesAtom,
	abookAtom,
	onRefresh,
	onDeleteSelectedEntries,
}: AutonomousAbookEntryListProps) => {
	const {
		opened,
		entry: modalEntry,
		openModal,
		closeModal,
	} = useAbookEntryPreviewModal()

	return (
		<>
			<AbookEntryList
				entriesAtom={entriesAtom}
				onRefresh={onRefresh}
				onEntryClick={openModal}
				onDeleteSelectedEntries={onDeleteSelectedEntries}
			>
				<AbookEntrySelectionShortcuts />
			</AbookEntryList>
			{modalEntry && (
				<AutonomousAbookEntryShowModal
					opened={opened}
					onClose={closeModal}
					abookDataWithIdAtom={abookAtom}
					entry={modalEntry}
					onEntryModified={() => {
						onRefresh()
					}}
				/>
			)}
		</>
	)
}
