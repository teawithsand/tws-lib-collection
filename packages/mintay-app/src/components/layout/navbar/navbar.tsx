import {
	ActionIcon,
	Burger,
	Container,
	Group,
	Text,
	useMantineColorScheme,
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import {
	IconBook,
	IconCards,
	IconHome,
	IconMoon,
	IconSettings,
	IconSun,
} from "@tabler/icons-react"
import { Link, useLocation } from "react-router"
import { Drawer } from "../drawer/drawer"
import { useSwipeGesture } from "./navbar.hooks"
import styles from "./navbar.module.scss"

interface NavLink {
	readonly label: string
	readonly href: string
	readonly icon: React.ComponentType<{ size?: number }>
}

const NAV_LINKS: NavLink[] = [
	{ label: "Home", href: "/", icon: IconHome },
	{ label: "Collections", href: "/collections", icon: IconBook },
	{ label: "Cards", href: "/cards", icon: IconCards },
]

export const Navbar = () => {
	const [opened, { toggle, close, open }] = useDisclosure(false)
	const { colorScheme, toggleColorScheme } = useMantineColorScheme()
	const location = useLocation()

	useSwipeGesture(open)

	const isActiveRoute = (href: string): boolean => {
		if (href === "/") {
			return location.pathname === "/"
		}
		return location.pathname.startsWith(href)
	}

	const renderNavLinks = () =>
		NAV_LINKS.map(({ label, href, icon: Icon }) => (
			<Link
				key={href}
				to={href}
				className={`${styles.navLink} ${
					isActiveRoute(href) ? styles.navLinkActive : ""
				}`}
				onClick={close}
			>
				<Icon size={16} />
				<span>{label}</span>
			</Link>
		))

	return (
		<>
			<nav className={styles.header}>
				<Container size="xl" className={styles.inner}>
					<Group h="100%" w="100%">
						<Group gap="lg" style={{ flex: 1 }}>
							<Burger
								opened={opened}
								onClick={toggle}
								size="sm"
								className={styles.burger}
								aria-label="Toggle navigation"
							/>

							<Link to="/" className={styles.brand}>
								<IconCards size={24} />
								<Text
									size="lg"
									fw={700}
									className={styles.brandText}
								>
									Mintay
								</Text>
							</Link>

							<Group gap="xs" className={styles.desktopNav}>
								{renderNavLinks()}
							</Group>
						</Group>

						<Group gap="xs" className={styles.actions}>
							<ActionIcon
								component={Link}
								to="/settings"
								variant="subtle"
								size="lg"
								className={styles.desktopSettingsLink}
								aria-label="Settings"
							>
								<IconSettings size={18} />
							</ActionIcon>

							{/* Desktop Theme Toggle */}
							<ActionIcon
								onClick={toggleColorScheme}
								variant="subtle"
								size="lg"
								className={styles.desktopThemeToggle}
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
				</Container>
			</nav>

			<Drawer opened={opened} onClose={close} navLinks={NAV_LINKS} />
		</>
	)
}
