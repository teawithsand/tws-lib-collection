import { MantineProvider } from "@mantine/core"
import { IconHome, IconSettings } from "@tabler/icons-react"
import "@testing-library/jest-dom"
import {
	fireEvent,
	render,
	screen,
	waitForElementToBeRemoved,
} from "@testing-library/react"
import type { ReactElement } from "react"
import { BrowserRouter } from "react-router"
import { describe, expect, test, vi } from "vitest"
import { AppBar } from "./appBar"
import { AppBarLinkType } from "./appBarLinkType"
import { AppBarNavigationButtonType } from "./appBarTypes"

const renderWithProviders = (ui: ReactElement) => {
	return render(
		<BrowserRouter>
			<MantineProvider>{ui}</MantineProvider>
		</BrowserRouter>,
	)
}

describe("AppBar", () => {
	test("renders title correctly", () => {
		renderWithProviders(<AppBar title="Test Title" />)

		expect(screen.getByTestId("app-bar-title")).toBeInTheDocument()
		expect(screen.getByText("Test Title")).toBeInTheDocument()
	})

	test("renders header with correct test id", () => {
		renderWithProviders(<AppBar title="Test" />)

		expect(screen.getByTestId("app-bar-header")).toBeInTheDocument()
	})

	test("renders action buttons", () => {
		const actions = [
			{
				label: "Home",
				icon: <IconHome size={18} />,
				onClick: () => {},
			},
			{
				label: "Settings",
				icon: <IconSettings size={18} />,
				linkType: AppBarLinkType.LOCAL_LINK as const,
				href: "/settings",
			},
		]

		renderWithProviders(<AppBar title="Test" actions={actions} />)

		expect(screen.getByTestId("app-bar-action-0")).toBeInTheDocument()
		expect(screen.getByTestId("app-bar-action-1")).toBeInTheDocument()
		expect(screen.getByLabelText("Home")).toBeInTheDocument()
		expect(screen.getByLabelText("Settings")).toBeInTheDocument()
	})

	test("renders more actions menu when provided", () => {
		const moreActions = [
			{
				label: "More Action",
				icon: <IconSettings size={16} />,
				onClick: () => {},
			},
		]

		renderWithProviders(<AppBar title="Test" moreActions={moreActions} />)

		expect(screen.getByTestId("app-bar-more-actions")).toBeInTheDocument()
		expect(screen.getByLabelText("More actions")).toBeInTheDocument()
	})

	test("does not render more actions menu when empty", () => {
		renderWithProviders(<AppBar title="Test" moreActions={[]} />)

		expect(
			screen.queryByTestId("app-bar-more-actions"),
		).not.toBeInTheDocument()
		expect(screen.queryByLabelText("More actions")).not.toBeInTheDocument()
	})

	test("renders all action types with all link types simultaneously", () => {
		const actions = [
			{
				label: "Action No Link",
				icon: <IconHome size={18} />,
				onClick: () => {},
			},
			{
				label: "Action Local Link",
				icon: <IconSettings size={18} />,
				linkType: AppBarLinkType.LOCAL_LINK as const,
				href: "/local",
			},
			{
				label: "Action Remote Link",
				icon: <IconHome size={18} />,
				linkType: AppBarLinkType.REMOTE_LINK as const,
				href: "https://example.com",
			},
		]

		const moreActions = [
			{
				label: "More No Link",
				icon: <IconSettings size={16} />,
				onClick: () => {},
			},
			{
				label: "More Local Link",
				icon: <IconHome size={16} />,
				linkType: AppBarLinkType.LOCAL_LINK as const,
				href: "/more-local",
			},
			{
				label: "More Remote Link",
				icon: <IconSettings size={16} />,
				linkType: AppBarLinkType.REMOTE_LINK as const,
				href: "https://more.example.com",
			},
		]

		const drawerItems = [
			{
				label: "Drawer No Link",
				icon: <IconHome size={18} />,
				onClick: () => {},
			},
			{
				label: "Drawer Local Link",
				icon: <IconSettings size={18} />,
				linkType: AppBarLinkType.LOCAL_LINK as const,
				href: "/drawer-local",
			},
			{
				label: "Drawer Remote Link",
				icon: <IconHome size={18} />,
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

		expect(screen.getByTestId("app-bar-action-0")).toBeInTheDocument()
		expect(screen.getByTestId("app-bar-action-1")).toBeInTheDocument()
		expect(screen.getByTestId("app-bar-action-2")).toBeInTheDocument()
		expect(screen.getByTestId("app-bar-more-actions")).toBeInTheDocument()
		expect(screen.getByTestId("app-bar-drawer-button")).toBeInTheDocument()
	})

	test("navigation button opens and closes drawer", async () => {
		const actions = [
			{
				label: "Home",
				icon: <IconHome size={18} />,
				onClick: () => {},
			},
		]

		const drawerItems = [
			{
				label: "Drawer Item 1",
				icon: <IconHome size={18} />,
				onClick: () => {},
			},
		]

		renderWithProviders(
			<AppBar
				title="Test Navigation Button"
				actions={actions}
				drawerItems={drawerItems}
			/>,
		)

		const openButton = screen.getByTestId("app-bar-drawer-button")

		expect(screen.queryByText("Drawer Item 1")).not.toBeInTheDocument()

		fireEvent.click(openButton)

		expect(await screen.findByText("Drawer Item 1")).toBeInTheDocument()

		const closeButton = document.querySelector(".mantine-Drawer-close")
		fireEvent.click(closeButton!)

		await waitForElementToBeRemoved(() =>
			screen.queryByText("Drawer Item 1"),
		)
	})

	describe("Navigation Button Behavior", () => {
		test("renders no navigation button when type is NONE", () => {
			renderWithProviders(
				<AppBar
					title="Test"
					navigationConfig={{
						buttonType: AppBarNavigationButtonType.NONE,
					}}
				/>,
			)

			expect(
				screen.queryByTestId("app-bar-drawer-button"),
			).not.toBeInTheDocument()
			expect(
				screen.queryByTestId("app-bar-back-button"),
			).not.toBeInTheDocument()
		})

		test("renders drawer button when type is DRAWER", () => {
			renderWithProviders(
				<AppBar
					title="Test"
					navigationConfig={{
						buttonType: AppBarNavigationButtonType.DRAWER,
					}}
				/>,
			)

			expect(
				screen.getByTestId("app-bar-drawer-button"),
			).toBeInTheDocument()
			expect(
				screen.queryByTestId("app-bar-back-button"),
			).not.toBeInTheDocument()
		})

		test("renders back button when type is BACK", () => {
			renderWithProviders(
				<AppBar
					title="Test"
					navigationConfig={{
						buttonType: AppBarNavigationButtonType.BACK,
					}}
				/>,
			)

			expect(
				screen.getByTestId("app-bar-back-button"),
			).toBeInTheDocument()
			expect(
				screen.queryByTestId("app-bar-drawer-button"),
			).not.toBeInTheDocument()
		})

		test("calls custom onClick handler for drawer button instead of default toggle", () => {
			const mockOnClick = vi.fn()

			renderWithProviders(
				<AppBar
					title="Test"
					navigationConfig={{
						buttonType: AppBarNavigationButtonType.DRAWER,
						onClick: mockOnClick,
					}}
				/>,
			)

			const drawerButton = screen.getByTestId("app-bar-drawer-button")
			fireEvent.click(drawerButton)

			expect(mockOnClick).toHaveBeenCalledTimes(1)
		})

		test("calls custom onClick handler for back button", () => {
			const mockOnClick = vi.fn()

			renderWithProviders(
				<AppBar
					title="Test"
					navigationConfig={{
						buttonType: AppBarNavigationButtonType.BACK,
						onClick: mockOnClick,
					}}
				/>,
			)

			const backButton = screen.getByTestId("app-bar-back-button")
			fireEvent.click(backButton)

			expect(mockOnClick).toHaveBeenCalledTimes(1)
		})

		test("drawer button uses default toggle behavior when no custom onClick provided", async () => {
			const drawerItems = [
				{
					label: "Test Item",
					icon: <IconHome size={18} />,
					onClick: () => {},
				},
			]

			renderWithProviders(
				<AppBar
					title="Test"
					navigationConfig={{
						buttonType: AppBarNavigationButtonType.DRAWER,
					}}
					drawerItems={drawerItems}
				/>,
			)

			const drawerButton = screen.getByTestId("app-bar-drawer-button")

			// Initially drawer should be closed
			expect(screen.queryByText("Test Item")).not.toBeInTheDocument()

			// Click to open
			fireEvent.click(drawerButton)
			expect(await screen.findByText("Test Item")).toBeInTheDocument()
		})

		test("back button has no default behavior when no custom onClick provided", () => {
			renderWithProviders(
				<AppBar
					title="Test"
					navigationConfig={{
						buttonType: AppBarNavigationButtonType.BACK,
					}}
				/>,
			)

			const backButton = screen.getByTestId("app-bar-back-button")

			// Should not throw when clicked
			expect(() => fireEvent.click(backButton)).not.toThrow()
		})

		test("calls onNavigateBack prop when back button clicked without custom onClick", () => {
			const mockOnNavigateBack = vi.fn()

			renderWithProviders(
				<AppBar
					title="Test"
					navigationConfig={{
						buttonType: AppBarNavigationButtonType.BACK,
					}}
					onNavigateBack={mockOnNavigateBack}
				/>,
			)

			const backButton = screen.getByTestId("app-bar-back-button")
			fireEvent.click(backButton)

			expect(mockOnNavigateBack).toHaveBeenCalledTimes(1)
		})

		test("custom onClick takes precedence over onNavigateBack prop", () => {
			const mockOnClick = vi.fn()
			const mockOnNavigateBack = vi.fn()

			renderWithProviders(
				<AppBar
					title="Test"
					navigationConfig={{
						buttonType: AppBarNavigationButtonType.BACK,
						onClick: mockOnClick,
					}}
					onNavigateBack={mockOnNavigateBack}
				/>,
			)

			const backButton = screen.getByTestId("app-bar-back-button")
			fireEvent.click(backButton)

			expect(mockOnClick).toHaveBeenCalledTimes(1)
			expect(mockOnNavigateBack).not.toHaveBeenCalled()
		})

		test("multiple clicks on custom onClick handlers work correctly", () => {
			const mockOnClick = vi.fn()

			renderWithProviders(
				<AppBar
					title="Test"
					navigationConfig={{
						buttonType: AppBarNavigationButtonType.DRAWER,
						onClick: mockOnClick,
					}}
				/>,
			)

			const drawerButton = screen.getByTestId("app-bar-drawer-button")

			fireEvent.click(drawerButton)
			fireEvent.click(drawerButton)
			fireEvent.click(drawerButton)

			expect(mockOnClick).toHaveBeenCalledTimes(3)
		})
	})
})
