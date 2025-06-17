import { AppBarLinkType } from "@/components/appBar"
import { AutonomousAppBar } from "@/components/appBar/autonomousAppBar"
import { AppSuspense } from "@/components/boundary"
import { useAppBarMutator } from "@/domain/appBar"
import { Routes } from "@/router/routes"
import { IconBook, IconHome } from "@tabler/icons-react"
import { ReactNode } from "react"
import styles from "./layout.module.scss"

interface LayoutProps {
	readonly children: ReactNode
}

export const GlobalLayout = ({ children }: LayoutProps) => {
	useAppBarMutator((state) => ({
		...state,
		title: () => "home.title",
		drawerItems: [
			{
				label: "Home",
				icon: IconHome,
				href: Routes.home.navigate(),
				linkType: AppBarLinkType.LOCAL_LINK,
			},
			{
				label: "Collections",
				icon: IconBook,
				href: Routes.collections.navigate(),
				linkType: AppBarLinkType.LOCAL_LINK,
			},
		],
	}))

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
