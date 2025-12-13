import { AbookEntry, WithId } from "@teawithsand/booklibr"
import { Atom, useAtomValue } from "@teawithsand/fstate"
import { AbookEntryPreviewModal } from "./AbookEntryPreviewModal"

export interface AutonomousAbookEntryPreviewModalProps {
	readonly opened: boolean
	readonly onClose: () => void
	readonly entryDataWithIdAtom: Atom<Promise<WithId<AbookEntry | null>>>
}

/**
 * Autonomous version of AbookEntryPreviewModal that integrates with Suspense.
 * Expects a parent Suspense boundary to handle loading states.
 * Reads entry data from an atom to display the entry information in the preview modal.
 */
export const AutonomousAbookEntryPreviewModal = ({
	opened,
	onClose,
	entryDataWithIdAtom,
}: AutonomousAbookEntryPreviewModalProps) => {
	const entryWithId = useAtomValue(entryDataWithIdAtom)
	const resolvedEntry =
		entryWithId.data === null ? null : (entryWithId as WithId<AbookEntry>)

	return (
		<AbookEntryPreviewModal
			opened={opened}
			onClose={onClose}
			entry={resolvedEntry}
		/>
	)
}
