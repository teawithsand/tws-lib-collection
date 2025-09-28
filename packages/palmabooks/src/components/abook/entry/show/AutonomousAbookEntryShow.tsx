import type { AbookStoreServiceAbookAtoms } from "@/domain/abookStore"
import { type AbookEntry, type WithId } from "@teawithsand/booklibr"
import { useAtomValue } from "@teawithsand/fstate"
import { useNavigation } from "@teawithsand/mlui"
import { useCallback } from "react"
import { AbookEntryShow } from "./AbookEntryShow"
import { AbookEntryShowNotFound } from "./AbookEntryShowNotFound"

interface AutonomousAbookEntryShowProps {
	readonly abookServiceAtoms: AbookStoreServiceAbookAtoms
	readonly abookId: string
	readonly entryId: string
}

/**
 * Autonomous abook entry show component that handles data fetching and navigation.
 */
export const AutonomousAbookEntryShow = ({
	abookServiceAtoms,
	entryId,
}: AutonomousAbookEntryShowProps) => {
	const entries = useAtomValue(abookServiceAtoms.entries)
	const { navigateBack } = useNavigation()

	const entry = entries.find(
		(e: WithId<AbookEntry>) => e.id.toString() === entryId,
	)

	const handleBackClick = useCallback(() => {
		navigateBack()
	}, [navigateBack])

	if (!entry) {
		return <AbookEntryShowNotFound onBackClick={handleBackClick} />
	}

	return (
		<AbookEntryShow
			entry={entry}
			entryId={entryId}
			onBackClick={handleBackClick}
		/>
	)
}
