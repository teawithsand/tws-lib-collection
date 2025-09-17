import { useApp } from "@/app/app.hooks"
import type { AbookStoreServiceAbookAtoms } from "@/domain/abookStore"
import { useAtomValue } from "@teawithsand/fstate"
import { LoadingSuspenseBoundary } from "@teawithsand/mlui"
import { useCallback } from "react"
import { AbookEntryModifications } from "../common"
import { DispositionAbookEntryList } from "./DispositionAbookEntryList"

interface AutonomousDispositionAbookEntryListProps {
	readonly abookServiceAtoms: AbookStoreServiceAbookAtoms
	readonly abookId: string
}

/**
 * Autonomous disposition-focused abook entry list component.
 * Handles data fetching and disposition change persistence.
 */
export const AutonomousDispositionAbookEntryList = ({
	abookServiceAtoms,
}: AutonomousDispositionAbookEntryListProps) => {
	const app = useApp()
	const entries = useAtomValue(abookServiceAtoms.entries)

	const handleSaveChanges = useCallback(
		async (modifications: AbookEntryModifications) => {
			try {
				// TODO: Implement actual disposition change persistence
				// This would require extending the AbookStoreService to support entry updates
				// For now, we just log the modifications

				const changeCount = Object.keys(modifications).length
				if (changeCount > 0) {
					app.logger.info(
						"AutonomousDispositionAbookEntryList",
						`Would update dispositions for ${changeCount} entries:`,
						modifications,
					)

					// Here we would call something like:
					// await updateEntryDispositions(abookId, modifications)
					// await recomputeAggregate()
				}
			} catch (error) {
				app.logger.error(
					"AutonomousDispositionAbookEntryList",
					"Failed to save disposition changes:",
					error,
				)
				throw error
			}
		},
		[app.logger],
	)

	return (
		<LoadingSuspenseBoundary>
			<DispositionAbookEntryList
				entries={entries}
				onSaveChanges={handleSaveChanges}
				showMetadata={true}
			/>
		</LoadingSuspenseBoundary>
	)
}
