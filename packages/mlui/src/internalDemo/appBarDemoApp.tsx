import { MantineProvider } from "@mantine/core"
import {
	IconBell,
	IconHome,
	IconSearch,
	IconSettings,
	IconUser,
} from "@tabler/icons-react"
import { BrowserRouter } from "react-router"
import { AppBar, AppBarLinkType, AppBarNavigationButtonType } from "../appBar"

export const AppBarDemoApp = () => {
	return (
		<MantineProvider>
			<BrowserRouter>
				<div style={{ minHeight: "100vh" }}>
					<AppBar
						title="Demo Application"
						navigationConfig={{
							buttonType: AppBarNavigationButtonType.DRAWER,
						}}
						actions={[
							{
								label: "Search",
								icon: <IconSearch size={18} />,
								onClick: () => alert("Search clicked"),
							},
							{
								label: "Home",
								icon: <IconHome size={18} />,
								linkType: AppBarLinkType.LOCAL_LINK,
								href: "/",
								onClick: () => console.log("Home navigation"),
							},
							{
								label: "Profile",
								icon: <IconUser size={18} />,
								linkType: AppBarLinkType.LOCAL_LINK,
								href: "/profile",
							},
						]}
						moreActions={[
							{
								label: "Settings",
								icon: <IconSettings size={16} />,
								onClick: () => alert("Settings clicked"),
							},
							{
								label: "Notifications",
								icon: <IconBell size={16} />,
								onClick: () => alert("Notifications clicked"),
							},
							{
								label: "External Link",
								icon: <IconHome size={16} />,
								linkType: AppBarLinkType.REMOTE_LINK,
								href: "https://mantine.dev",
							},
						]}
						drawerItems={[
							{
								label: "Dashboard",
								icon: <IconHome size={18} />,
								linkType: AppBarLinkType.LOCAL_LINK,
								href: "/dashboard",
							},
							{
								label: "Users",
								icon: <IconUser size={18} />,
								linkType: AppBarLinkType.LOCAL_LINK,
								href: "/users",
							},
							{
								label: "Settings",
								icon: <IconSettings size={18} />,
								onClick: () => alert("Settings from drawer"),
							},
							{
								label: "Documentation",
								icon: <IconSearch size={18} />,
								linkType: AppBarLinkType.REMOTE_LINK,
								href: "https://mantine.dev/getting-started/",
							},
						]}
						drawerTitle="Navigation Menu"
						onNavigateBack={() => console.log("Navigate back")}
					/>

					<div style={{ padding: "2rem" }}>
						<h1>Welcome to the AppBar Demo</h1>
						<p>
							This demonstrates the AppBar component ported from
							mintay-app to mlui library.
						</p>

						<h2>Features demonstrated:</h2>
						<ul>
							<li>Main action buttons in the header</li>
							<li>More actions dropdown menu</li>
							<li>Navigation drawer with various link types</li>
							<li>Support for local and remote links</li>
							<li>Custom onClick handlers</li>
							<li>Responsive design with Mantine components</li>
						</ul>

						<h2>Try these interactions:</h2>
						<ul>
							<li>Click the burger menu to open the drawer</li>
							<li>Click the search and profile action buttons</li>
							<li>Click the three dots menu for more actions</li>
							<li>Test different link types in the drawer</li>
						</ul>

						<div
							style={{
								marginTop: "2rem",
								padding: "1rem",
								backgroundColor: "#f8f9fa",
								borderRadius: "8px",
							}}
						>
							<h3>AppBar with Back Button</h3>
							<AppBar
								title="Settings Page"
								navigationConfig={{
									buttonType: AppBarNavigationButtonType.BACK,
									onClick: () => alert("Custom back action"),
								}}
								actions={[
									{
										label: "Save",
										icon: <IconSettings size={18} />,
										onClick: () => alert("Save clicked"),
									},
								]}
							/>
							<div style={{ padding: "1rem" }}>
								<p>
									This AppBar shows a back button instead of a
									drawer.
								</p>
							</div>
						</div>

						<div
							style={{
								marginTop: "2rem",
								padding: "1rem",
								backgroundColor: "#f0f8ff",
								borderRadius: "8px",
							}}
						>
							<h3>AppBar with No Navigation</h3>
							<AppBar
								title="Modal Content"
								navigationConfig={{
									buttonType: AppBarNavigationButtonType.NONE,
								}}
								actions={[
									{
										label: "Close",
										icon: <IconUser size={18} />,
										onClick: () => alert("Close clicked"),
									},
								]}
							/>
							<div style={{ padding: "1rem" }}>
								<p>This AppBar has no navigation button.</p>
							</div>
						</div>
					</div>
				</div>
			</BrowserRouter>
		</MantineProvider>
	)
}
