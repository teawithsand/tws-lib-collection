import { useApp } from "@/app/app.hooks"
import { Routes } from "@/router"
import { useAtomValue } from "@teawithsand/fstate"
import { LoadingSuspenseBoundary, useNavigation } from "@teawithsand/mlui"
import { useCallback } from "react"
import { AbookList } from "./AbookList"

/**
 * Internal component that reads abook data.
 * Must be wrapped in Suspense.
 */
const AbookListDataLoader = ({ onRefresh }: { onRefresh: () => void }) => {
	const app = useApp()
	const navigation = useNavigation()
	const abooks = useAtomValue(app.abookStoreService.abooksList)

	const handleCreateAbookClick = useCallback(() => {
		navigation.navigate(Routes.createAbook.navigate())
	}, [navigation])

	return (
		<AbookList
			abooks={abooks}
			onCreateAbookClick={handleCreateAbookClick}
			onRefresh={onRefresh}
		/>
	)
}

/**
 * Autonomous audiobook list component that handles its own data loading.
 * Connects to the app's AbookStoreService and manages loading/error states with Suspense.
 * Search state is managed internally by AbookList component.
 * Navigation to create page is handled internally.
 */
export const AutonomousAbookList = () => {
	const app = useApp()

	const handleRefresh = useCallback(() => {
		app.atomStore.set(app.abookStoreService.refreshAbooksList)
	}, [app])

	return (
		<LoadingSuspenseBoundary>
			<AbookListDataLoader onRefresh={handleRefresh} />
		</LoadingSuspenseBoundary>
	)
}
