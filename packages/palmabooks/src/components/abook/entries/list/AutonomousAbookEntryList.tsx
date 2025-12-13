import { AbookEntry, WithId } from "@teawithsand/booklibr"
import { Atom, useAtomValue } from "@teawithsand/fstate"
import { AbookEntryList } from "./AbookEntryList"

export interface AutonomousAbookEntryListProps {
	readonly entriesAtom: Atom<Promise<WithId<AbookEntry>[]>>
	onRefresh: () => void
}

/**
 * Autonomous version of AbookEntryList that integrates with Suspense.
 * Expects a parent Suspense boundary to handle loading states.
 * Search state is managed internally by AbookEntryList component.
 */
export const AutonomousAbookEntryList = ({
	entriesAtom,
	onRefresh,
}: AutonomousAbookEntryListProps) => {
	const entries = useAtomValue(entriesAtom)

	return <AbookEntryList entries={entries} onRefresh={onRefresh} />
}
