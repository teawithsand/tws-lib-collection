import { MantineProvider } from "@mantine/core"
import { IconHome, IconSettings } from "@tabler/icons-react"
import "@testing-library/jest-dom"
import { render, screen } from "@testing-library/react"
import { BrowserRouter } from "react-router"
import { describe, expect, test } from "vitest"
import { AppBar } from "./appBar"
import { AppBarLinkType } from "./appBarLinkType"

const renderWithProviders = (ui: React.ReactElement) => {
	return render(
		<BrowserRouter>
			<MantineProvider>{ui}</MantineProvider>
		</BrowserRouter>,
	)
}

describe("AppBar", () => {
	test("renders title correctly", () => {
		renderWithProviders(<AppBar title="Test Title" />)

		expect(screen.getByText("Test Title")).toBeInTheDocument()
	})

	test("renders action buttons", () => {
		const actions = [
			{
				label: "Home",
				icon: IconHome,
				onClick: () => {},
			},
			{
				label: "Settings",
				icon: IconSettings,
				linkType: AppBarLinkType.LOCAL_LINK as const,
				href: "/settings",
			},
		]

		renderWithProviders(<AppBar title="Test" actions={actions} />)

		expect(screen.getByLabelText("Home")).toBeInTheDocument()
		expect(screen.getByLabelText("Settings")).toBeInTheDocument()
	})

	test("renders more actions menu when provided", () => {
		const moreActions = [
			{
				label: "More Action",
				icon: IconSettings,
				onClick: () => {},
			},
		]

		renderWithProviders(<AppBar title="Test" moreActions={moreActions} />)

		expect(screen.getByLabelText("More actions")).toBeInTheDocument()
	})

	test("renders navigation burger button", () => {
		renderWithProviders(<AppBar title="Test" />)

		expect(screen.getByLabelText("Open navigation")).toBeInTheDocument()
	})

	test("renders children content", () => {
		renderWithProviders(
			<AppBar title="Test">
				<div>Test Content</div>
			</AppBar>,
		)

		expect(screen.getByText("Test Content")).toBeInTheDocument()
	})

	test("does not render more actions menu when empty", () => {
		renderWithProviders(<AppBar title="Test" moreActions={[]} />)

		expect(screen.queryByLabelText("More actions")).not.toBeInTheDocument()
	})

	test("renders all action types with all link types simultaneously", () => {
		const actions = [
			{
				label: "Action No Link",
				icon: IconHome,
				onClick: () => {},
			},
			{
				label: "Action Local Link",
				icon: IconSettings,
				linkType: AppBarLinkType.LOCAL_LINK as const,
				href: "/local",
			},
			{
				label: "Action Remote Link",
				icon: IconHome,
				linkType: AppBarLinkType.REMOTE_LINK as const,
				href: "https://example.com",
			},
		]

		const moreActions = [
			{
				label: "More No Link",
				icon: IconSettings,
				onClick: () => {},
			},
			{
				label: "More Local Link",
				icon: IconHome,
				linkType: AppBarLinkType.LOCAL_LINK as const,
				href: "/more-local",
			},
			{
				label: "More Remote Link",
				icon: IconSettings,
				linkType: AppBarLinkType.REMOTE_LINK as const,
				href: "https://more.example.com",
			},
		]

		const drawerItems = [
			{
				label: "Drawer No Link",
				icon: IconHome,
				onClick: () => {},
			},
			{
				label: "Drawer Local Link",
				icon: IconSettings,
				linkType: AppBarLinkType.LOCAL_LINK as const,
				href: "/drawer-local",
			},
			{
				label: "Drawer Remote Link",
				icon: IconHome,
				linkType: AppBarLinkType.REMOTE_LINK as const,
				href: "https://drawer.example.com",
			},
		]

		renderWithProviders(
			<AppBar
				title="Test All Types"
				actions={actions}
				moreActions={moreActions}
				drawerItems={drawerItems}
			/>,
		)

		// Verify regular actions are rendered
		expect(screen.getByLabelText("Action No Link")).toBeInTheDocument()
		expect(screen.getByLabelText("Action Local Link")).toBeInTheDocument()
		expect(screen.getByLabelText("Action Remote Link")).toBeInTheDocument()

		// Verify more actions menu is rendered
		expect(screen.getByLabelText("More actions")).toBeInTheDocument()

		// Verify drawer items are available (drawer itself is not visible by default)
		expect(screen.getByLabelText("Open navigation")).toBeInTheDocument()
	})
})
