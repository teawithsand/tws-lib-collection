import {
	ActionIcon,
	Group,
	Drawer as MantineDrawer,
	Stack,
	Text,
	useMantineColorScheme,
} from "@mantine/core"
import { IconCards, IconMoon, IconSettings, IconSun } from "@tabler/icons-react"
import { Link, useLocation } from "react-router"
import { useDrawerCloseGesture } from "./drawer.hooks"
import styles from "./drawer.module.scss"

interface NavLink {
	readonly label: string
	readonly href: string
	readonly icon: React.ComponentType<{ size?: number }>
}

interface DrawerNavigationProps {
	readonly opened: boolean
	readonly onClose: () => void
	readonly navLinks: NavLink[]
}

export const Drawer = ({
	opened,
	onClose,
	navLinks,
}: DrawerNavigationProps) => {
	const location = useLocation()
	const { colorScheme, toggleColorScheme } = useMantineColorScheme()

	useDrawerCloseGesture(opened, onClose)

	const isActiveRoute = (href: string): boolean => {
		if (href === "/") {
			return location.pathname === "/"
		}
		return location.pathname.startsWith(href)
	}

	return (
		<MantineDrawer
			opened={opened}
			onClose={onClose}
			title={
				<Group gap="xs">
					<IconCards size={20} />
					<Text fw={700}>Mintay</Text>
				</Group>
			}
			padding="md"
			size="sm"
			position="left"
		>
			<Stack gap="xs">
				<Group
					justify="space-between"
					p="xs"
					className={styles.themeToggle}
				>
					<Text size="sm" fw={500}>
						Settings
					</Text>
					<Group gap="xs">
						<ActionIcon
							component={Link}
							to="/settings"
							variant="subtle"
							size="lg"
							aria-label="Settings"
							onClick={onClose}
						>
							<IconSettings size={18} />
						</ActionIcon>
						<ActionIcon
							onClick={toggleColorScheme}
							variant="subtle"
							size="lg"
							aria-label={`Switch to ${colorScheme === "dark" ? "light" : "dark"} mode`}
						>
							{colorScheme === "dark" ? (
								<IconSun size={18} />
							) : (
								<IconMoon size={18} />
							)}
						</ActionIcon>
					</Group>
				</Group>

				{navLinks.map(({ label, href, icon: Icon }) => (
					<Link
						key={href}
						to={href}
						className={`${styles.drawerLink} ${
							isActiveRoute(href) ? styles.drawerLinkActive : ""
						}`}
						onClick={onClose}
					>
						<Icon size={18} />
						<span>{label}</span>
					</Link>
				))}
			</Stack>
		</MantineDrawer>
	)
}
