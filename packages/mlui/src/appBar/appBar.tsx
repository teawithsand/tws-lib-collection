import { ActionIcon, Burger, Group, Menu, Title } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { IconArrowLeft, IconDots } from "@tabler/icons-react"
import type { CSSProperties, ReactNode } from "react"
import { Link } from "react-router"
import { testId, TestIds } from "../domain/testIdUtil"
import styles from "./appBar.module.scss"
import { AppBarDrawer } from "./appBarDrawer"
import { AppBarLinkType } from "./appBarLinkType"
import type {
	AppBarAction,
	AppBarDrawerItem,
	AppBarMoreAction,
	AppBarNavigationConfig,
} from "./appBarTypes"
import { AppBarNavigationButtonType } from "./appBarTypes"

interface AppBarActionButtonProps {
	readonly action: AppBarAction
	readonly index: number
}

/**
 * Default icon size for action buttons in the AppBar.
 *
 * Size is expressed in pixels, and is compatible with tabler icons.
 */
export const APP_BAR_DEFAULT_ICON_SIZE = 19

/**
 * Individual action button component for the AppBar
 */
const AppBarActionButton = ({ action, index }: AppBarActionButtonProps) => {
	const actionTestId = TestIds.testId(`app-bar-action-${index}`)

	if (action.linkType === AppBarLinkType.LOCAL_LINK) {
		return (
			<ActionIcon
				key={index}
				component={Link}
				to={action.href}
				onClick={action.onClick}
				variant="subtle"
				disabled={action.disabled}
				aria-label={action.label}
				data-testid={actionTestId}
			>
				{action.icon}
			</ActionIcon>
		)
	}

	if (action.linkType === AppBarLinkType.REMOTE_LINK) {
		return (
			<ActionIcon
				key={index}
				component="a"
				href={action.href}
				target="_blank"
				rel="noopener noreferrer"
				onClick={action.onClick}
				variant="subtle"
				disabled={action.disabled}
				aria-label={action.label}
				data-testid={actionTestId}
			>
				{action.icon}
			</ActionIcon>
		)
	}

	return (
		<ActionIcon
			key={index}
			onClick={action.onClick}
			variant="subtle"
			disabled={action.disabled}
			aria-label={action.label}
			data-testid={actionTestId}
		>
			{action.icon}
		</ActionIcon>
	)
}

interface AppBarMoreActionItemProps {
	readonly action: AppBarMoreAction
	readonly index: number
}

const AppBarMoreActionItem = ({ action, index }: AppBarMoreActionItemProps) => {
	const moreActionTestId = testId(`app-bar-more-action-${index}`)

	if (action.linkType === AppBarLinkType.LOCAL_LINK) {
		return (
			<Menu.Item
				key={index}
				component={Link}
				to={action.href}
				leftSection={action.icon}
				onClick={action.onClick}
				disabled={action.disabled}
				data-testid={moreActionTestId}
			>
				{action.label}
			</Menu.Item>
		)
	}

	if (action.linkType === AppBarLinkType.REMOTE_LINK) {
		return (
			<Menu.Item
				key={index}
				component="a"
				href={action.href}
				target="_blank"
				rel="noopener noreferrer"
				leftSection={action.icon}
				onClick={action.onClick}
				disabled={action.disabled}
				data-testid={moreActionTestId}
			>
				{action.label}
			</Menu.Item>
		)
	}

	return (
		<Menu.Item
			key={index}
			leftSection={action.icon}
			onClick={action.onClick}
			disabled={action.disabled}
			data-testid={moreActionTestId}
		>
			{action.label}
		</Menu.Item>
	)
}

export interface AppBarProps {
	/** The title text displayed in the app bar header */
	readonly title: ReactNode
	/** Array of action buttons displayed on the right side of the app bar */
	readonly actions?: AppBarAction[]
	/** Array of additional actions displayed in a dropdown menu (three dots menu) */
	readonly moreActions?: AppBarMoreAction[]
	/** Array of items displayed in the navigation drawer */
	readonly drawerItems?: AppBarDrawerItem[]
	/** Title text displayed at the top of the navigation drawer */
	readonly drawerTitle?: ReactNode
	/** Icon displayed next to the drawer title */
	readonly drawerIcon?: ReactNode
	/** Configuration for the navigation button (drawer, back, or none) */
	readonly navigationConfig?: AppBarNavigationConfig
	/** Callback function called when the back button is pressed (if navigation type is back) */
	readonly onNavigateBack?: () => void
	/** Custom CSS class name for styling the app bar */
	readonly className?: string
	/** Inline styles for the app bar */
	readonly style?: CSSProperties
}

/**
 * Customizable AppBar component that can be configured differently for each page.
 *
 * This component provides a flexible header with navigation, title, and actions.
 * It can optionally render content below the header in a styled container.
 *
 * Features:
 * - Navigation button (drawer toggle, back button, or none)
 * - Customizable title
 * - Action buttons on the right side
 * - More actions dropdown menu
 * - Navigation drawer with custom items
 * - Content area below the header for page content
 *
 * @param props - The props for configuring the AppBar
 * @returns JSX element containing the app bar header, optional content area, and drawer
 */
export const AppBar = ({
	title,
	actions = [],
	moreActions = [],
	drawerItems = [],
	drawerTitle,
	drawerIcon,
	navigationConfig = { buttonType: AppBarNavigationButtonType.DRAWER },
	onNavigateBack,
	className,
	style,
}: AppBarProps) => {
	const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] =
		useDisclosure(false)

	const handleNavigationClick = () => {
		if (navigationConfig.buttonType === AppBarNavigationButtonType.DRAWER) {
			if (navigationConfig.onClick) {
				navigationConfig.onClick()
			} else {
				toggleDrawer()
			}
		} else if (
			navigationConfig.buttonType === AppBarNavigationButtonType.BACK
		) {
			if (navigationConfig.onClick) {
				navigationConfig.onClick()
			} else if (onNavigateBack) {
				onNavigateBack()
			}
		}
	}

	const renderNavigationButton = () => {
		if (navigationConfig.buttonType === AppBarNavigationButtonType.NONE) {
			return null
		}

		if (navigationConfig.buttonType === AppBarNavigationButtonType.DRAWER) {
			return (
				<Burger
					opened={drawerOpened}
					onClick={handleNavigationClick}
					size="sm"
					aria-label="Open navigation"
					data-testid={testId("app-bar-drawer-button")}
				/>
			)
		}

		if (navigationConfig.buttonType === AppBarNavigationButtonType.BACK) {
			return (
				<ActionIcon
					onClick={handleNavigationClick}
					variant="subtle"
					aria-label="Go back"
					data-testid={testId("app-bar-back-button")}
				>
					<IconArrowLeft size={18} />
				</ActionIcon>
			)
		}

		return null
	}

	return (
		<>
			<header
				className={
					className ? `${styles.appBar} ${className}` : styles.appBar
				}
				style={style}
				data-testid={testId("app-bar-header")}
			>
				<Group justify="space-between" h="100%" px="md">
					<Group gap="sm">
						{renderNavigationButton()}
						<Title
							order={3}
							className={styles.title}
							data-testid={testId("app-bar-title")}
						>
							{title}
						</Title>
					</Group>

					<Group gap="xs">
						{actions.map((action, index) => (
							<AppBarActionButton
								key={index}
								action={action}
								index={index}
							/>
						))}

						{moreActions.length > 0 && (
							<Menu shadow="md" width={200}>
								<Menu.Target>
									<ActionIcon
										variant="subtle"
										aria-label="More actions"
										data-testid={testId(
											"app-bar-more-actions",
										)}
									>
										<IconDots size={18} />
									</ActionIcon>
								</Menu.Target>

								<Menu.Dropdown
									data-testid={testId(
										"app-bar-more-actions-dropdown",
									)}
								>
									{moreActions.map((action, index) => (
										<AppBarMoreActionItem
											key={index}
											action={action}
											index={index}
										/>
									))}
								</Menu.Dropdown>
							</Menu>
						)}
					</Group>
				</Group>
			</header>

			<AppBarDrawer
				opened={drawerOpened}
				onClose={closeDrawer}
				items={drawerItems}
				drawerTitle={drawerTitle}
				drawerIcon={drawerIcon}
				data-testid={testId("app-bar-drawer")}
			/>
		</>
	)
}
