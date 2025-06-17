import { ActionIcon, Burger, Group, Menu, Title } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { IconDotsVertical } from "@tabler/icons-react"
import { ReactNode } from "react"
import { Link } from "react-router"
import styles from "./appBar.module.scss"
import { AppBarDrawer } from "./appBarDrawer"
import { AppBarLinkType } from "./appBarLinkType"
import { AppBarAction, AppBarDrawerItem, AppBarMoreAction } from "./appBarTypes"

interface AppBarActionButtonProps {
	readonly action: AppBarAction
	readonly index: number
}

/**
 * Individual action button component for the AppBar
 */
const AppBarActionButton = ({ action, index }: AppBarActionButtonProps) => {
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
	if (action.linkType === AppBarLinkType.LOCAL_LINK) {
		return (
			<Menu.Item
				key={index}
				component={Link}
				to={action.href}
				leftSection={action.icon && <action.icon size={16} />}
				onClick={action.onClick}
				disabled={action.disabled}
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
	children,
}: AppBarProps) => {
	const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] =
		useDisclosure(false)

	return (
		<>
			<header className={styles.appBar}>
				<Group justify="space-between" h="100%" px="md">
					<Group gap="sm">
						<Burger
							opened={drawerOpened}
							onClick={toggleDrawer}
							size="sm"
							aria-label="Open navigation"
						/>
						<Title order={3} className={styles.title}>
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
									>
										<IconDotsVertical size={18} />
									</ActionIcon>
								</Menu.Target>

								<Menu.Dropdown>
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

			{children && <div className={styles.content}>{children}</div>}

			<AppBarDrawer
				opened={drawerOpened}
				onClose={closeDrawer}
				items={drawerItems}
				drawerTitle={drawerTitle}
			/>
		</>
	)
}
