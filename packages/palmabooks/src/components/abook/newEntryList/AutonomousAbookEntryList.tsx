import { useApp } from "@/app/app.hooks"
import type { AbookStoreServiceAbookAtoms } from "@/domain/abookStore"
import { LoadingSuspenseBoundary, useStableMemo } from "@teawithsand/mlui"
import { useCallback } from "react"
import { AbookEntryList } from "./AbookEntryList"
import { AbookEntryListBehavior } from "./behavior/AbookEntryListBehavior"

interface AutonomousAbookEntryListProps {
	readonly abookServiceAtoms: AbookStoreServiceAbookAtoms
}

/**
 * Autonomous abook entry list component.
 * Creates and manages AbookEntryListBehavior instance and handles data persistence.
 */
export const AutonomousAbookEntryList = ({
	abookServiceAtoms,
}: AutonomousAbookEntryListProps) => {
	const app = useApp()

	// Create behavior instance with memoization to prevent recreation on re-renders
	const behavior = useStableMemo(() => {
		return new AbookEntryListBehavior(abookServiceAtoms.entries)
	}, [abookServiceAtoms.entries])

	const handleSaveChanges = useCallback(async () => {
		try {
			// TODO: Implement actual save logic for modifications
			// This is a scaffold version - actual implementation would:
			// 1. Get the modified entries from behavior.modifiedEntries
			// 2. Save them via the appropriate service
			// 3. Clear modifications after successful save

			app.logger.info(
				"AutonomousAbookEntryList",
				"Save changes called (scaffold - not implemented)",
			)
		} catch (error) {
			app.logger.error(
				"AutonomousAbookEntryList",
				"Failed to save changes:",
				error,
			)
			throw error
		}
	}, [app.logger])

	return (
		<LoadingSuspenseBoundary>
			<AbookEntryList
				behavior={behavior}
				onSaveChanges={handleSaveChanges}
			/>
		</LoadingSuspenseBoundary>
	)
}
