import { useApp, useTransResolver } from "@/app/app.hooks"
import { AutonomousGlobalErrorFallback } from "@/components/globalErrorFallback"
import { Routes } from "@/router"
import {
	IconBook,
	IconCategory,
	IconHome,
	IconInfoCircle,
	IconMenu2,
	IconSettings,
} from "@tabler/icons-react"
import { produce } from "@teawithsand/fstate"
import {
	APP_BAR_DEFAULT_ICON_SIZE,
	AppBarAutonomous,
	AppBarLinkType,
	AppBarPredefinedMutatorPriorities,
	ErrorBoundary,
	useAppBarMutator,
} from "@teawithsand/mlui"
import { useCallback, type CSSProperties, type ReactNode } from "react"
import styles from "./appGlobalLayout.module.scss"

export interface AppGlobalLayoutProps {
	readonly children: ReactNode
	readonly className?: string
	readonly style?: CSSProperties
}

/**
 * Global layout component that provides the app bar and overall structure.
 */
export const AppGlobalLayout = ({
	children,
	className,
	style,
}: AppGlobalLayoutProps) => {
	const app = useApp()
	const t = useTransResolver()
	useAppBarMutator(
		useCallback(
			(state) =>
				produce(state, (draft) => {
					draft.title = t.resolve((trans) => trans.layout.appTitle)
					draft.drawerTitle = t.resolve(
						(trans) => trans.layout.drawerTitle,
					)
					draft.drawerIcon = <IconMenu2 size={20} />
					draft.drawerItems = [
						{
							label: t.resolve(
								(trans) => trans.layout.navigation.home,
							),
							linkType: AppBarLinkType.LOCAL_LINK,
							href: Routes.home.navigate(),
							icon: <IconHome size={APP_BAR_DEFAULT_ICON_SIZE} />,
						},
						{
							label: t.resolve(
								(trans) => trans.layout.navigation.books,
							),
							linkType: AppBarLinkType.LOCAL_LINK,
							href: Routes.books.navigate(),
							icon: <IconBook size={APP_BAR_DEFAULT_ICON_SIZE} />,
						},
						{
							label: t.resolve(
								(trans) => trans.layout.navigation.categories,
							),
							linkType: AppBarLinkType.LOCAL_LINK,
							href: Routes.categories.navigate(),
							icon: (
								<IconCategory
									size={APP_BAR_DEFAULT_ICON_SIZE}
								/>
							),
						},
						{
							label: t.resolve(
								(trans) => trans.layout.navigation.settings,
							),
							linkType: AppBarLinkType.LOCAL_LINK,
							href: Routes.settings.navigate(),
							icon: (
								<IconSettings
									size={APP_BAR_DEFAULT_ICON_SIZE}
								/>
							),
						},
						{
							label: t.resolve(
								(trans) => trans.layout.navigation.about,
							),
							linkType: AppBarLinkType.LOCAL_LINK,
							href: Routes.about.navigate(),
							icon: (
								<IconInfoCircle
									size={APP_BAR_DEFAULT_ICON_SIZE}
								/>
							),
						},
					]
				}),
			[t],
		),
		AppBarPredefinedMutatorPriorities.DEFAULT,
		app.appBarService,
	)

	return (
		<div
			className={`${styles.container}${className ? ` ${className}` : ""}`}
			style={style}
		>
			<AppBarAutonomous appBarService={app.appBarService} />
			<ErrorBoundary fallback={<AutonomousGlobalErrorFallback />}>
				<div className={styles.content}>{children}</div>
			</ErrorBoundary>
		</div>
	)
}
