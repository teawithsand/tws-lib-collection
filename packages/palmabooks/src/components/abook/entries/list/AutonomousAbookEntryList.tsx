import { Abook, AbookEntry, WithId } from "@teawithsand/booklibr"
import { atom, Atom, useAtomValue } from "@teawithsand/fstate"
import { useMemo } from "react"
import {
	AutonomousAbookEntryShowModal,
	useAbookEntryPreviewModal,
} from "../show"
import { AbookEntryList } from "./AbookEntryList"

export interface AutonomousAbookEntryListProps {
	readonly entriesAtom: Atom<Promise<WithId<AbookEntry>[]>>
	readonly abookAtom: Atom<Promise<WithId<Abook | null>>>
	onRefresh: () => void
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
}: AutonomousAbookEntryListProps) => {
	const entries = useAtomValue(entriesAtom)
	const {
		opened,
		entry: modalEntry,
		openModal,
		closeModal,
	} = useAbookEntryPreviewModal()

	// TODO(teaiwthsand): figure out if this will really work, as this is quite finicky
	const entryDataWithIdAtom = useMemo(() => {
		if (!modalEntry) return atom(Promise.resolve({ id: "", data: null }))
		return atom(Promise.resolve(modalEntry))
	}, [modalEntry])

	return (
		<>
			<AbookEntryList
				entries={entries}
				onRefresh={onRefresh}
				onEntryClick={openModal}
			/>
			{modalEntry && (
				<AutonomousAbookEntryShowModal
					opened={opened}
					onClose={closeModal}
					abookDataWithIdAtom={abookAtom}
					entryDataWithIdAtom={entryDataWithIdAtom}
					onEntryModified={() => {
						onRefresh()
					}}
				/>
			)}
		</>
	)
}
