import { useAtomValue } from "@teawithsand/fstate"
import type { ReactNode } from "react"
import { useNavigate } from "react-router"
import type { AppBarService } from "../domain"
import { AppBar } from "./appBar"

export const AutonomousAppBar = ({
	service,
	children,
}: {
	service: AppBarService
	children?: ReactNode
}) => {
	const appBarState = useAtomValue(service.currentAppBarState)
	const navigate = useNavigate()

	return (
		<AppBar
			title={appBarState.title}
			actions={appBarState.actions}
			moreActions={appBarState.moreActions}
			drawerItems={appBarState.drawerItems}
			drawerTitle={appBarState.drawerTitle}
			navigationConfig={appBarState.navigationConfig}
			onNavigateBack={() => navigate(-1)}
		>
			{children}
		</AppBar>
	)
}
