import { useApp } from "@/app"
import { AppBarLinkType } from "@/components/appBar"
import { AutonomousAppBar } from "@/components/appBar/autonomousAppBar"
import { AppSuspense } from "@/components/boundary"
import { AppBarMutator, useAppBarMutator } from "@/domain/appBar"
import { Routes } from "@/router/routes"
import {
	IconBook,
	IconHome,
	IconLogin,
	IconLogout,
	IconPlus,
	IconUser,
	IconUserPlus,
} from "@tabler/icons-react"
import { useAtomValue } from "@teawithsand/fstate"
import { ComponentType, ReactNode, useCallback } from "react"
import styles from "./layout.module.scss"

interface LayoutProps {
	readonly children: ReactNode
}

export const GlobalLayout = ({ children }: LayoutProps) => {
	const app = useApp()
	const authState = useAtomValue(app.backendService.authState)
	const translation = useAtomValue(app.transService.translation)

	const callback: AppBarMutator = useCallback(
		(state) => {
			const baseItems = [
				{
					label: "Home",
					icon: IconHome as ComponentType<{ size?: number }>,
					href: Routes.home.navigate(),
					linkType: AppBarLinkType.LOCAL_LINK as const,
				},
				{
					label: "Collections",
					icon: IconBook as ComponentType<{ size?: number }>,
					href: Routes.collections.navigate(),
					linkType: AppBarLinkType.LOCAL_LINK as const,
				},
				{
					label: "Add Collection",
					icon: IconPlus as ComponentType<{ size?: number }>,
					href: Routes.createCollection.navigate(),
					linkType: AppBarLinkType.LOCAL_LINK as const,
				},
				{
					label: "Backend Collections",
					icon: IconBook as ComponentType<{ size?: number }>,
					href: Routes.backendCollections.navigate(),
					linkType: AppBarLinkType.LOCAL_LINK as const,
				},
			]

			const authItems = authState.isAuthenticated
				? [
						{
							label: "Profile",
							icon: IconUser as ComponentType<{ size?: number }>,
							href: Routes.profile.navigate(),
							linkType: AppBarLinkType.LOCAL_LINK as const,
						},
						{
							label: "Logout",
							icon: IconLogout as ComponentType<{
								size?: number
							}>,
							linkType: AppBarLinkType.NO_LINK as const,
							onClick: () => {
								app.atomStore.set(app.backendService.logout)
							},
						},
					]
				: [
						{
							label: "Login",
							icon: IconLogin as ComponentType<{ size?: number }>,
							href: Routes.login.navigate(),
							linkType: AppBarLinkType.LOCAL_LINK as const,
						},
						{
							label: "Register",
							icon: IconUserPlus as ComponentType<{
								size?: number
							}>,
							href: Routes.register.navigate(),
							linkType: AppBarLinkType.LOCAL_LINK as const,
						},
					]

			return {
				...state,
				title: () => translation.appBar.title(),
				drawerItems: [...baseItems, ...authItems],
			}
		},
		[
			authState.isAuthenticated,
			app.atomStore,
			app.backendService.logout,
			translation.appBar,
		],
	)

	useAppBarMutator(callback)

	return (
		<AppSuspense>
			<div className={styles.layoutContainer}>
				<AutonomousAppBar />

				<main className={styles.mainContent}>
					<AppSuspense>{children}</AppSuspense>
				</main>
			</div>
		</AppSuspense>
	)
}
