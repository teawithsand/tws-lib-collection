import { Badge, Group, Paper } from "@mantine/core"
import {
	IconBook,
	IconCards,
	IconHome,
	IconPlus,
	IconRefresh,
	IconSettings,
	IconShare,
} from "@tabler/icons-react"
import { AppBar, AppBarLinkType } from "../components/appBar"
import { LocalLayout } from "../components/layout"

/**
 * Home page component demonstrating the customizable AppBar component
 */
export const HomePage = () => {
	const handleRefresh = () => {
		console.log("Refreshing...")
	}

	const handleNewCollection = () => {
		console.log("Creating new collection...")
	}

	const handleShare = () => {
		console.log("Sharing...")
	}

	const handleSettings = () => {
		console.log("Opening settings...")
	}

	const handleNavigation = (path: string) => {
		console.log(`Navigating to ${path}`)
	}

	return (
		<LocalLayout>
			<AppBar
				title="Welcome to Mintay"
				actions={[
					{
						label: "Refresh",
						icon: IconRefresh,
						onClick: handleRefresh,
					},
				]}
				moreActions={[
					{
						label: "New Collection",
						icon: IconPlus,
						onClick: handleNewCollection,
					},
					{
						label: "Share",
						icon: IconShare,
						onClick: handleShare,
					},
					{
						label: "Settings",
						icon: IconSettings,
						onClick: handleSettings,
					},
				]}
				drawerItems={[
					{
						label: "Home",
						icon: IconHome,
						onClick: () => handleNavigation("/"),
						href: "/",
						linkType: AppBarLinkType.LOCAL_LINK,
					},
					{
						label: "Collections",
						icon: IconBook,
						onClick: () => handleNavigation("/collections"),
						href: "/collections",
						linkType: AppBarLinkType.LOCAL_LINK,
					},
					{
						label: "Cards",
						icon: IconCards,
						onClick: () => handleNavigation("/cards"),
						href: "/cards",
						linkType: AppBarLinkType.LOCAL_LINK,
					},
				]}
			>
				<Paper p="md" radius="md" withBorder>
					<Group justify="center" gap="lg">
						<Badge variant="light" color="blue" size="lg">
							Demo Page
						</Badge>
						<Badge variant="light" color="green" size="lg">
							Mobile-First AppBar
						</Badge>
					</Group>
				</Paper>
			</AppBar>
		</LocalLayout>
	)
}
