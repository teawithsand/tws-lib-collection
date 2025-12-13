import { useApp } from "@/app/app.hooks"
import { useAtomValue } from "@teawithsand/fstate"
import { LoadingSuspenseBoundary } from "@teawithsand/mlui"
import { useCallback } from "react"
import { AbookList } from "./AbookList"

/**
 * Internal component that reads abook data.
 * Must be wrapped in Suspense.
 */
const AbookListDataLoader = ({
	onCreateAbookClick,
	onRefresh,
}: {
	onCreateAbookClick: () => void
	onRefresh: () => void
}) => {
	const app = useApp()
	const abooks = useAtomValue(app.abookStoreService.abooksList)

	return (
		<AbookList
			abooks={abooks}
			onCreateAbookClick={onCreateAbookClick}
			onRefresh={onRefresh}
		/>
	)
}

/**
 * Autonomous audiobook list component that handles its own data loading.
 * Connects to the app's AbookStoreService and manages loading/error states with Suspense.
 * Search state is managed internally by AbookList component.
 */
export const AutonomousAbookList = ({
	onCreateAbookClick,
}: {
	onCreateAbookClick: () => void
}) => {
	const app = useApp()

	const handleRefresh = useCallback(() => {
		// Trigger refresh by calling the atom's set function
		app.atomStore.set(app.abookStoreService.refreshAbooksList)
	}, [app])

	return (
		<LoadingSuspenseBoundary>
			<AbookListDataLoader
				onCreateAbookClick={onCreateAbookClick}
				onRefresh={handleRefresh}
			/>
		</LoadingSuspenseBoundary>
	)
}
