import type { ReactNode } from "react"
import { useNavigation } from "../domain"
import { useAppBarState } from "../domain/appBar/hooks"
import { AppBarService } from "../domain/appBar/service"
import { AppBar } from "./appBar"

export interface AppBarAutonomousProps {
	readonly appBarService: AppBarService
	readonly onNavigateBack?: () => void
	readonly children?: ReactNode
}

/**
 * Autonomous AppBar component that manages its state through the provided AppBarService.
 */
export const AppBarAutonomous = ({
	appBarService,
	children,
}: AppBarAutonomousProps) => {
	const appBarState = useAppBarState(appBarService)
	const navigation = useNavigation()

	return (
		<AppBar
			title={appBarState.title}
			actions={appBarState.actions}
			moreActions={appBarState.moreActions}
			drawerItems={appBarState.drawerItems}
			drawerTitle={appBarState.drawerTitle}
			navigationConfig={appBarState.navigationConfig}
			onNavigateBack={() => navigation.navigateBack()}
		>
			{children}
		</AppBar>
	)
}
