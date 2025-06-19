import { useTransResolver } from "@/app/trans/hook"
import { useAppBarState } from "@/domain/appBar/appBarService.hooks"
import { ReactNode } from "react"
import { useNavigate } from "react-router"
import { AppBar } from "./appBar"

export interface AutonomousAppBarProps {
	readonly children?: ReactNode
}

export const AutonomousAppBar = ({ children }: AutonomousAppBarProps) => {
	const transResolver = useTransResolver()
	const appBarState = useAppBarState()
	const navigate = useNavigate()

	return (
		<AppBar
			title={transResolver.resolve(appBarState.title)}
			actions={appBarState.actions}
			moreActions={appBarState.moreActions}
			drawerItems={appBarState.drawerItems}
			drawerTitle={transResolver.resolve(appBarState.drawerTitle)}
			navigationConfig={appBarState.navigationConfig}
			onNavigateBack={() => navigate(-1)}
		>
			{children}
		</AppBar>
	)
}
