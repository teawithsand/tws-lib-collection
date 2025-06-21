import { MantineProvider } from "@mantine/core"
import { IconHome, IconSettings } from "@tabler/icons-react"
import "@testing-library/jest-dom"
import {
	fireEvent,
	render,
	screen,
	waitForElementToBeRemoved,
} from "@testing-library/react"
import { BrowserRouter } from "react-router"
import { describe, expect, test, vi } from "vitest"
import { AppBar } from "./appBar"
import { AppBarLinkType } from "./appBarLinkType"
import { AppBarNavigationButtonType } from "./appBarTypes"

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

		expect(screen.getByTestId("app-bar-action-0")).toBeInTheDocument()
		expect(screen.getByTestId("app-bar-action-1")).toBeInTheDocument()
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

		expect(screen.getByTestId("app-bar-more-actions")).toBeInTheDocument()
		expect(screen.getByLabelText("More actions")).toBeInTheDocument()
	})

	test("renders children content", () => {
		const testContent = "Test Content"
		renderWithProviders(
			<AppBar title="Test">
				<div data-testid="test-content">{testContent}</div>
			</AppBar>,
		)

		expect(screen.getByTestId("test-content")).toBeInTheDocument()
		expect(screen.getByTestId("app-bar-content")).toBeInTheDocument()
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
				icon: IconHome,
				onClick: () => {},
			},
		]

		const drawerItems = [
			{
				label: "Drawer Item 1",
				icon: IconHome,
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
			expect(
				screen.queryByLabelText("Open navigation"),
			).not.toBeInTheDocument()
			expect(screen.queryByLabelText("Go back")).not.toBeInTheDocument()
		})

		test("renders drawer button when type is DRAWER", () => {
			renderWithProviders(
				<AppBar
					title="Test"
					navigationConfig={{
						buttonType: AppBarNavigationButtonType.DRAWER,
					}}
					drawerItems={[
						{
							label: "Test Item",
							icon: IconHome,
							onClick: () => {},
						},
					]}
				/>,
			)

			expect(
				screen.getByTestId("app-bar-drawer-button"),
			).toBeInTheDocument()
			expect(
				screen.queryByTestId("app-bar-back-button"),
			).not.toBeInTheDocument()
			expect(screen.getByLabelText("Open navigation")).toBeInTheDocument()
			expect(screen.queryByLabelText("Go back")).not.toBeInTheDocument()
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
			expect(screen.getByLabelText("Go back")).toBeInTheDocument()
			expect(
				screen.queryByLabelText("Open navigation"),
			).not.toBeInTheDocument()
		})

		test("calls custom onClick handler for drawer button instead of default toggle", () => {
			const customOnClick = vi.fn()

			renderWithProviders(
				<AppBar
					title="Test"
					navigationConfig={{
						buttonType: AppBarNavigationButtonType.DRAWER,
						onClick: customOnClick,
					}}
					drawerItems={[
						{
							label: "Test Item",
							icon: IconHome,
							onClick: () => {},
						},
					]}
				/>,
			)

			const navigationButton = screen.getByTestId("app-bar-drawer-button")

			expect(screen.queryByText("Test Item")).not.toBeInTheDocument()

			fireEvent.click(navigationButton)

			expect(customOnClick).toHaveBeenCalledTimes(1)
			expect(screen.queryByText("Test Item")).not.toBeInTheDocument()
		})

		test("calls custom onClick handler for back button", () => {
			const customOnClick = vi.fn()

			renderWithProviders(
				<AppBar
					title="Test"
					navigationConfig={{
						buttonType: AppBarNavigationButtonType.BACK,
						onClick: customOnClick,
					}}
				/>,
			)

			const backButton = screen.getByTestId("app-bar-back-button")
			fireEvent.click(backButton)

			expect(customOnClick).toHaveBeenCalledTimes(1)
		})

		test("drawer button uses default toggle behavior when no custom onClick provided", async () => {
			renderWithProviders(
				<AppBar
					title="Test"
					navigationConfig={{
						buttonType: AppBarNavigationButtonType.DRAWER,
					}}
					drawerItems={[
						{
							label: "Test Item",
							icon: IconHome,
							onClick: () => {},
						},
					]}
				/>,
			)

			const navigationButton = screen.getByTestId("app-bar-drawer-button")

			expect(screen.queryByText("Test Item")).not.toBeInTheDocument()

			fireEvent.click(navigationButton)

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

			expect(() => fireEvent.click(backButton)).not.toThrow()
		})

		test("calls onNavigateBack prop when back button clicked without custom onClick", () => {
			const onNavigateBack = vi.fn()

			renderWithProviders(
				<AppBar
					title="Test"
					navigationConfig={{
						buttonType: AppBarNavigationButtonType.BACK,
					}}
					onNavigateBack={onNavigateBack}
				/>,
			)

			const backButton = screen.getByTestId("app-bar-back-button")
			fireEvent.click(backButton)

			expect(onNavigateBack).toHaveBeenCalledTimes(1)
		})

		test("custom onClick takes precedence over onNavigateBack prop", () => {
			const customOnClick = vi.fn()
			const onNavigateBack = vi.fn()

			renderWithProviders(
				<AppBar
					title="Test"
					navigationConfig={{
						buttonType: AppBarNavigationButtonType.BACK,
						onClick: customOnClick,
					}}
					onNavigateBack={onNavigateBack}
				/>,
			)

			const backButton = screen.getByTestId("app-bar-back-button")
			fireEvent.click(backButton)

			expect(customOnClick).toHaveBeenCalledTimes(1)
			expect(onNavigateBack).not.toHaveBeenCalled()
		})

		test("multiple clicks on custom onClick handlers work correctly", () => {
			const drawerOnClick = vi.fn()
			const backOnClick = vi.fn()

			const { rerender } = renderWithProviders(
				<AppBar
					title="Test"
					navigationConfig={{
						buttonType: AppBarNavigationButtonType.DRAWER,
						onClick: drawerOnClick,
					}}
					drawerItems={[
						{
							label: "Test Item",
							icon: IconHome,
							onClick: () => {},
						},
					]}
				/>,
			)

			const drawerButton = screen.getByTestId("app-bar-drawer-button")
			fireEvent.click(drawerButton)
			fireEvent.click(drawerButton)
			expect(drawerOnClick).toHaveBeenCalledTimes(2)

			rerender(
				<BrowserRouter>
					<MantineProvider>
						<AppBar
							title="Test"
							navigationConfig={{
								buttonType: AppBarNavigationButtonType.BACK,
								onClick: backOnClick,
							}}
						/>
					</MantineProvider>
				</BrowserRouter>,
			)

			const backButton = screen.getByTestId("app-bar-back-button")
			fireEvent.click(backButton)
			fireEvent.click(backButton)
			fireEvent.click(backButton)
			expect(backOnClick).toHaveBeenCalledTimes(3)
		})
	})
})
