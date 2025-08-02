import type { CSSProperties } from "react"
import { useNavigation } from "../domain"
import { useAppBarState } from "../domain/appBar/hooks"
import { AppBarService } from "../domain/appBar/service"
import { AppBar } from "./appBar"

export interface AppBarAutonomousProps {
	/** The AppBarService instance that manages the app bar state and configuration */
	readonly appBarService: AppBarService
	/** Optional callback function called when the back button is pressed (overrides default navigation behavior) */
	readonly onNavigateBack?: () => void
	/** Custom CSS class name for styling the app bar */
	readonly className?: string
	/** Inline styles for the app bar */
	readonly style?: CSSProperties
}

/**
 * Autonomous AppBar component that manages its state through the provided AppBarService.
 *
 * This component automatically subscribes to state changes from the AppBarService and
 * renders the AppBar with the current configuration. It's ideal for applications that
 * need centralized app bar state management across multiple pages.
 *
 * Features:
 * - Automatic state synchronization with AppBarService
 * - Built-in navigation handling via useNavigation hook
 * - Content area support for rendering page content below the header
 * - Reactive updates when AppBarService state changes
 *
 * Use this component when:
 * - You need app bar state to persist across page changes
 * - Multiple pages need to update the same app bar
 * - You want centralized control over app bar configuration
 *
 * @param props - The props for configuring the autonomous AppBar
 * @returns JSX element with AppBar connected to AppBarService state
 */
export const AppBarAutonomous = ({
	appBarService,
	className,
	style,
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
			drawerIcon
			navigationConfig={appBarState.navigationConfig}
			onNavigateBack={() => navigation.navigateBack()}
			className={className}
			style={style}
		/>
	)
}
