import { useAtomValue } from "@teawithsand/fstate"
import { useNavigate } from "react-router"
import type { AppBarService } from "../domain"
import { AppBar } from "./appBar"

export const AutonomousAppBar = ({ service }: { service: AppBarService }) => {
	const appBarState = useAtomValue(service.currentAppBarState)
	const navigate = useNavigate()

	return (
		<AppBar
			title={appBarState.title}
			actions={appBarState.actions}
			moreActions={appBarState.moreActions}
			drawerItems={appBarState.drawerItems}
			drawerTitle={appBarState.drawerTitle}
			drawerIcon={appBarState.drawerIcon}
			navigationConfig={appBarState.navigationConfig}
			onNavigateBack={() => navigate(-1)}
		/>
	)
}
