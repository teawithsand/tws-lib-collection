import { MantineProvider } from "@mantine/core"
import { IconHome, IconSettings, IconUser } from "@tabler/icons-react"
import { fireEvent, render, screen } from "@testing-library/react"
import type { ReactElement } from "react"
import { BrowserRouter } from "react-router"
import { describe, expect, test, vi } from "vitest"
import { AppBarDrawer } from "./appBarDrawer"
import { AppBarLinkType } from "./appBarLinkType"

const renderWithProviders = (ui: ReactElement) => {
	return render(
		<BrowserRouter>
			<MantineProvider>{ui}</MantineProvider>
		</BrowserRouter>,
	)
}

describe("AppBarDrawer", () => {
	test("renders drawer with title", () => {
		const items = [
			{
				label: "Home",
				icon: IconHome,
				onClick: () => {},
			},
		]

		renderWithProviders(
			<AppBarDrawer
				opened={true}
				onClose={() => {}}
				items={items}
				drawerTitle="Test Navigation"
			/>,
		)

		expect(screen.getByText("Test Navigation")).toBeInTheDocument()
	})

	test("renders default title when drawerTitle not provided", () => {
		const items = [
			{
				label: "Home",
				icon: IconHome,
				onClick: () => {},
			},
		]

		renderWithProviders(
			<AppBarDrawer opened={true} onClose={() => {}} items={items} />,
		)

		expect(screen.getByText("Navigation")).toBeInTheDocument()
	})

	test("renders drawer items with no link type", () => {
		const mockOnClick = vi.fn()
		const items = [
			{
				label: "Home",
				icon: IconHome,
				onClick: mockOnClick,
			},
			{
				label: "Settings",
				icon: IconSettings,
				onClick: () => {},
			},
		]

		renderWithProviders(
			<AppBarDrawer opened={true} onClose={() => {}} items={items} />,
		)

		expect(screen.getByText("Home")).toBeInTheDocument()
		expect(screen.getByText("Settings")).toBeInTheDocument()

		// Test onClick
		fireEvent.click(screen.getByText("Home"))
		expect(mockOnClick).toHaveBeenCalledTimes(1)
	})

	test("renders drawer items with local link type", () => {
		const items = [
			{
				label: "Dashboard",
				icon: IconHome,
				linkType: AppBarLinkType.LOCAL_LINK as const,
				href: "/dashboard",
			},
			{
				label: "Profile",
				icon: IconUser,
				linkType: AppBarLinkType.LOCAL_LINK as const,
				href: "/profile",
				onClick: () => {},
			},
		]

		renderWithProviders(
			<AppBarDrawer opened={true} onClose={() => {}} items={items} />,
		)

		expect(screen.getByText("Dashboard")).toBeInTheDocument()
		expect(screen.getByText("Profile")).toBeInTheDocument()

		// Check that links are rendered
		const dashboardLink = screen.getByText("Dashboard").closest("a")
		const profileLink = screen.getByText("Profile").closest("a")

		expect(dashboardLink).toHaveAttribute("href", "/dashboard")
		expect(profileLink).toHaveAttribute("href", "/profile")
	})

	test("renders drawer items with remote link type", () => {
		const items = [
			{
				label: "Documentation",
				icon: IconSettings,
				linkType: AppBarLinkType.REMOTE_LINK as const,
				href: "https://example.com/docs",
			},
			{
				label: "Support",
				icon: IconHome,
				linkType: AppBarLinkType.REMOTE_LINK as const,
				href: "https://example.com/support",
				onClick: () => {},
			},
		]

		renderWithProviders(
			<AppBarDrawer opened={true} onClose={() => {}} items={items} />,
		)

		expect(screen.getByText("Documentation")).toBeInTheDocument()
		expect(screen.getByText("Support")).toBeInTheDocument()

		// Check that external links are rendered with correct attributes
		const docsLink = screen.getByText("Documentation").closest("a")
		const supportLink = screen.getByText("Support").closest("a")

		expect(docsLink).toHaveAttribute("href", "https://example.com/docs")
		expect(docsLink).toHaveAttribute("target", "_blank")
		expect(docsLink).toHaveAttribute("rel", "noopener noreferrer")

		expect(supportLink).toHaveAttribute(
			"href",
			"https://example.com/support",
		)
		expect(supportLink).toHaveAttribute("target", "_blank")
		expect(supportLink).toHaveAttribute("rel", "noopener noreferrer")
	})

	test("calls onClose when drawer item is clicked", () => {
		const mockOnClose = vi.fn()
		const mockItemOnClick = vi.fn()

		const items = [
			{
				label: "Home",
				icon: IconHome,
				onClick: mockItemOnClick,
			},
			{
				label: "Profile",
				icon: IconUser,
				linkType: AppBarLinkType.LOCAL_LINK as const,
				href: "/profile",
			},
		]

		renderWithProviders(
			<AppBarDrawer opened={true} onClose={mockOnClose} items={items} />,
		)

		// Click on no-link item
		fireEvent.click(screen.getByText("Home"))
		expect(mockItemOnClick).toHaveBeenCalledTimes(1)
		expect(mockOnClose).toHaveBeenCalledTimes(1)

		// Click on local link item
		fireEvent.click(screen.getByText("Profile"))
		expect(mockOnClose).toHaveBeenCalledTimes(2)
	})

	test("handles disabled items", () => {
		const mockOnClick = vi.fn()
		const mockOnClose = vi.fn()

		const items = [
			{
				label: "Disabled Item",
				icon: IconHome,
				onClick: mockOnClick,
				disabled: true,
			},
			{
				label: "Enabled Item",
				icon: IconSettings,
				onClick: () => {},
				disabled: false,
			},
		]

		renderWithProviders(
			<AppBarDrawer opened={true} onClose={mockOnClose} items={items} />,
		)

		expect(screen.getByText("Disabled Item")).toBeInTheDocument()
		expect(screen.getByText("Enabled Item")).toBeInTheDocument()

		// Disabled item should not trigger onClick
		const disabledItem = screen.getByText("Disabled Item")
		fireEvent.click(disabledItem)
		expect(mockOnClick).not.toHaveBeenCalled()
		expect(mockOnClose).not.toHaveBeenCalled()
	})

	test("renders empty drawer when no items provided", () => {
		renderWithProviders(
			<AppBarDrawer opened={true} onClose={() => {}} items={[]} />,
		)

		expect(screen.getByText("Navigation")).toBeInTheDocument()
		// Should not have any navigation items, only the close button
		expect(screen.queryByRole("link")).toBeNull()
		// The close button should still be present
		expect(screen.getByRole("button")).toBeInTheDocument()
	})

	test("handles mixed item types correctly", () => {
		const mockOnClick = vi.fn()
		const mockOnClose = vi.fn()

		const items = [
			{
				label: "No Link",
				icon: IconHome,
				onClick: mockOnClick,
			},
			{
				label: "Local Link",
				icon: IconUser,
				linkType: AppBarLinkType.LOCAL_LINK as const,
				href: "/local",
			},
			{
				label: "Remote Link",
				icon: IconSettings,
				linkType: AppBarLinkType.REMOTE_LINK as const,
				href: "https://example.com",
			},
		]

		renderWithProviders(
			<AppBarDrawer opened={true} onClose={mockOnClose} items={items} />,
		)

		expect(screen.getByText("No Link")).toBeInTheDocument()
		expect(screen.getByText("Local Link")).toBeInTheDocument()
		expect(screen.getByText("Remote Link")).toBeInTheDocument()

		// Test different behaviors
		fireEvent.click(screen.getByText("No Link"))
		expect(mockOnClick).toHaveBeenCalledTimes(1)
		expect(mockOnClose).toHaveBeenCalledTimes(1)

		fireEvent.click(screen.getByText("Local Link"))
		expect(mockOnClose).toHaveBeenCalledTimes(2)

		fireEvent.click(screen.getByText("Remote Link"))
		expect(mockOnClose).toHaveBeenCalledTimes(3)
	})
})
