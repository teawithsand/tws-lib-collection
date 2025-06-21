import { testId } from "@/util/testIdUtil"
import { ActionIcon, Burger, Group, Menu, Title } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { IconArrowLeft, IconDotsVertical } from "@tabler/icons-react"
import { ReactNode } from "react"
import { Link } from "react-router"
import styles from "./appBar.module.scss"
import { AppBarDrawer } from "./appBarDrawer"
import { AppBarLinkType } from "./appBarLinkType"
import {
	AppBarAction,
	AppBarDrawerItem,
	AppBarMoreAction,
	AppBarNavigationButtonType,
	AppBarNavigationConfig,
} from "./appBarTypes"

interface AppBarActionButtonProps {
	readonly action: AppBarAction
	readonly index: number
}

/**
 * Individual action button component for the AppBar
 */
const AppBarActionButton = ({ action, index }: AppBarActionButtonProps) => {
	const actionTestId = testId(`app-bar-action-${index}`)

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
				{action.icon && <action.icon size={18} />}
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
				{action.icon && <action.icon size={18} />}
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
			{action.icon && <action.icon size={18} />}
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
				leftSection={action.icon && <action.icon size={16} />}
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
				leftSection={action.icon && <action.icon size={16} />}
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
			leftSection={action.icon && <action.icon size={16} />}
			onClick={action.onClick}
			disabled={action.disabled}
			data-testid={moreActionTestId}
		>
			{action.label}
		</Menu.Item>
	)
}

export interface AppBarProps {
	readonly title: string
	readonly actions?: AppBarAction[]
	readonly moreActions?: AppBarMoreAction[]
	readonly drawerItems?: AppBarDrawerItem[]
	readonly drawerTitle?: string
	readonly navigationConfig?: AppBarNavigationConfig
	readonly onNavigateBack?: () => void
	readonly children?: ReactNode
}

/**
 * Customizable AppBar component that can be configured differently for each page
 * Supports title, action buttons, more actions menu, and drawer navigation
 */
export const AppBar = ({
	title,
	actions = [],
	moreActions = [],
	drawerItems = [],
	drawerTitle,
	navigationConfig = { buttonType: AppBarNavigationButtonType.DRAWER },
	onNavigateBack,
	children,
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
				className={styles.appBar}
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
										<IconDotsVertical size={18} />
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

			{children && (
				<div
					className={styles.content}
					data-testid={testId("app-bar-content")}
				>
					{children}
				</div>
			)}

			<AppBarDrawer
				opened={drawerOpened}
				onClose={closeDrawer}
				items={drawerItems}
				drawerTitle={drawerTitle}
				data-testid={testId("app-bar-drawer")}
			/>
		</>
	)
}
