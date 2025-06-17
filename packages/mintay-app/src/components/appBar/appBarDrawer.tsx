import { Drawer, Group, NavLink, Stack, Text } from "@mantine/core"
import { IconCards } from "@tabler/icons-react"
import { Link } from "react-router"
import styles from "./appBarDrawer.module.scss"
import { AppBarLinkType } from "./appBarLinkType"
import { AppBarDrawerItem } from "./appBarTypes"

interface AppBarDrawerItemProps {
	readonly item: AppBarDrawerItem
	readonly index: number
}

const AppBarDrawerItemComponent = ({ item, index }: AppBarDrawerItemProps) => {
	if (item.linkType === AppBarLinkType.LOCAL_LINK && item.href) {
		return (
			<NavLink
				key={index}
				label={item.label}
				leftSection={<item.icon size={18} />}
				onClick={item.onClick}
				disabled={item.disabled}
				className={styles.navLink}
				component={Link}
				to={item.href}
			/>
		)
	}

	if (item.linkType === AppBarLinkType.REMOTE_LINK) {
		return (
			<NavLink
				key={index}
				label={item.label}
				leftSection={<item.icon size={18} />}
				onClick={item.onClick}
				disabled={item.disabled}
				className={styles.navLink}
				component="a"
				href={item.href}
				target="_blank"
				rel="noopener noreferrer"
			/>
		)
	}

	return (
		<NavLink
			key={index}
			label={item.label}
			leftSection={<item.icon size={18} />}
			onClick={item.onClick}
			disabled={item.disabled}
			className={styles.navLink}
		/>
	)
}

export interface AppBarDrawerProps {
	readonly opened: boolean
	readonly onClose: () => void
	readonly items: AppBarDrawerItem[]
	readonly drawerTitle?: string
}

/**
 * Drawer component for the AppBar navigation
 */
export const AppBarDrawer = ({
	opened,
	onClose,
	items,
	drawerTitle = "Navigation",
}: AppBarDrawerProps) => {
	return (
		<Drawer
			opened={opened}
			onClose={onClose}
			title={
				<Group gap="xs">
					<IconCards size={20} />
					<Text fw={700}>{drawerTitle}</Text>
				</Group>
			}
			padding="md"
			size="sm"
			position="left"
		>
			<Stack gap="xs">
				{items.map((item, index) => (
					<AppBarDrawerItemComponent
						key={index}
						item={item}
						index={index}
					/>
				))}
			</Stack>
		</Drawer>
	)
}
