import type { AbookStoreServiceAbookAtoms } from "@/domain/abookStore"
import { useAtomValue } from "@teawithsand/fstate"
import { LoadingSuspenseBoundary } from "@teawithsand/mlui"
import { AbookEntryAction } from "../common"
import { OperationAbookEntryList } from "./OperationAbookEntryList"

interface AutonomousOperationAbookEntryListProps {
	readonly abookServiceAtoms: AbookStoreServiceAbookAtoms
	readonly abookId: string
	readonly actions?: readonly AbookEntryAction[]
}

/**
 * Autonomous operation-focused abook entry list component.
 * Handles data fetching and provides interface for bulk operations.
 */
export const AutonomousOperationAbookEntryList = ({
	abookServiceAtoms,
	actions = [],
}: AutonomousOperationAbookEntryListProps) => {
	const entries = useAtomValue(abookServiceAtoms.entries)

	return (
		<LoadingSuspenseBoundary>
			<OperationAbookEntryList
				entries={entries}
				actions={actions}
				showMetadata={true}
			/>
		</LoadingSuspenseBoundary>
	)
}
