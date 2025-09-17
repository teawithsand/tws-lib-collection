import { useApp } from "@/app/app.hooks"
import type { AbookStoreServiceAbookAtoms } from "@/domain/abookStore"
import { LoadingSuspenseBoundary } from "@teawithsand/mlui"
import { useCallback, useMemo } from "react"
import { AbookEntryListBehavior } from "../AbookEntryListBehavior"
import { SimpleAbookEntryList } from "./SimpleAbookEntryList"

interface AutonomousSimpleAbookEntryListProps {
	readonly abookServiceAtoms: AbookStoreServiceAbookAtoms
}

/**
 * Autonomous simple abook entry list component.
 * Creates and manages AbookEntryListBehavior instance and handles data persistence.
 */
export const AutonomousSimpleAbookEntryList = ({
	abookServiceAtoms,
}: AutonomousSimpleAbookEntryListProps) => {
	const app = useApp()

	// Create behavior instance with memoization to prevent recreation on re-renders
	const behavior = useMemo(() => {
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
				"AutonomousSimpleAbookEntryList",
				"Save changes called (scaffold - not implemented)",
			)
		} catch (error) {
			app.logger.error(
				"AutonomousSimpleAbookEntryList",
				"Failed to save changes:",
				error,
			)
			throw error
		}
	}, [app.logger])

	return (
		<LoadingSuspenseBoundary>
			<SimpleAbookEntryList
				behavior={behavior}
				onSaveChanges={handleSaveChanges}
			/>
		</LoadingSuspenseBoundary>
	)
}
