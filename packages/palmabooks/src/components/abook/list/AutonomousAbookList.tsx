import { useApp } from "@/app/app.hooks"
import { useAtomValue } from "@teawithsand/fstate"
import { Stack } from "@teawithsand/mlui"
import { AbookList } from "./AbookList"
import { AbookListHeader } from "./AbookListHeader"

/**
 * Books page content component for viewing and managing book collection.
 */
export const AutonomousAbookList = () => {
	const app = useApp()
	const abooks = useAtomValue(app.abookStoreService.abooksList)

	return (
		<Stack gap="lg">
			<AbookListHeader abooksCount={abooks.length} />
			<AbookList abooks={abooks} />
		</Stack>
	)
}
